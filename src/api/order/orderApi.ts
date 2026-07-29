import axiosInstance from '../axiosInstance';
import { orderEndpoints } from '../endpoints';
import type {
  PlaceOrderInterface,
  OrderHistoryRequest,
  OrderDetailRequest,
  CancelOrderInterface,
  OrderHistoryApiResponse,
  OrderPaymentInfoInterface,
} from '../interfaces';

interface RawOrderHistoryItem {
  InventoryID:     number;
  ItemID:          number;
  BrandID:         number;
  BrandName:       string;
  CompanyName?:    string;
  SubOrderID?:     number;
  SubOrderNumber?: string;
  Quantity:        number;
  Name:            string;
  Variant:         string;
  Images:          string;
  OrderStatus:     number;
  ItemPriceInfo:   {
    GrossAmount:   number;
    TotalDiscount: number;
    Taxes:         unknown[];
  };
  [key: string]: unknown;
}

interface RawOrderHistoryGroup {
  OrderMasterCode:  number;
  OrderNumber:      string;
  OrderedDate:      string;
  OrderPaymentInfo: OrderPaymentInfoInterface;
  Items:            RawOrderHistoryItem[];
}

export interface OrderHistoryFilters {
  sortBy?:   'asc' | 'desc';
  dateFrom?: string | null;
  dateTo?:   string | null;
  status?:   'all' | 'delivered' | 'cancelled' | 'returned';
}

export const placeOrder = async (data: PlaceOrderInterface) => {
  const response = await axiosInstance.post(orderEndpoints.placeOrder, data);
  return response.data;
};

// Kept so AddressScreen compiles without changes — delegates to placeOrder
export const postPlacedMultipleOrder = placeOrder;

// Status isn't a backend filter param on this endpoint (see OrderHistoryRequest) —
// it's applied client-side in OrderHistoryScreen. When a status filter is active,
// fetch the full history in one page rather than 10 at a time, otherwise the
// filter only ever sees whichever page(s) happen to be loaded.
const UNFILTERED_PAGE_SIZE = 10;
const STATUS_FILTERED_PAGE_SIZE = 500;

export const postOrderHistory = async (
  customerprofilecode: number,
  page: number = 1,
  filters: OrderHistoryFilters = {},
): Promise<{ items: any[]; hasMore: boolean; totalRecords: number }> => {
  const isStatusFiltered = !!filters.status && filters.status !== 'all';
  const payload: OrderHistoryRequest = {
    CustomerProfileCode: customerprofilecode,
    PageNumber:          isStatusFiltered ? 1 : page,
    PageSize:            isStatusFiltered ? STATUS_FILTERED_PAGE_SIZE : UNFILTERED_PAGE_SIZE,
    SortBy:              filters.sortBy ?? 'desc',
    DateFrom:            filters.dateFrom ?? null,
    DateTo:              filters.dateTo ?? null,
  };
  const response = await axiosInstance.post(orderEndpoints.getOrderHistory, payload);
  const raw: { result?: OrderHistoryApiResponse } = response.data;
  const orders = raw.result?.Orders as unknown as RawOrderHistoryGroup[] | undefined;

  if (!Array.isArray(orders) || orders.length === 0) {
    return { items: [], hasMore: false, totalRecords: 0 };
  }

  const PAGE_SIZE = payload.PageSize ?? 10;

  const items = orders.flatMap((order: RawOrderHistoryGroup) =>
    (order.Items ?? []).map((item: RawOrderHistoryItem) => ({
      ...item,
      OrderNumber:     order.OrderNumber,
      OrderedDate:     order.OrderedDate,
      OrderMasterCode: order.OrderMasterCode,
      Inventory_Id:    item.InventoryID,
      Item_Id:         item.ItemID,
      SubOrder:        { Code: item.SubOrderID ?? 0, Number: item.SubOrderNumber ?? '' },
      Brand_Id:        item.BrandID,
      Brand_Name:      item.BrandName,
      // Per-item display price — tax-inclusive gross amount.
      Amount:          item.ItemPriceInfo?.GrossAmount ?? 0,
      PaymentInfo: {
        ...order.OrderPaymentInfo,
        // Discount moved from order-level to per-item (ItemPriceInfo.TotalDiscount)
        // in this response — surface it per item so existing sum(Discount) math holds.
        Discount: item.ItemPriceInfo?.TotalDiscount ?? 0,
      },
    })),
  );

  const totalRecords = raw.result?.TotalRecords ?? 0;
  const pageNum = payload.PageNumber ?? 1;
  return { items, hasMore: pageNum * PAGE_SIZE < totalRecords, totalRecords };
};

export const cancelOrder = async (data: CancelOrderInterface) => {
  const response = await axiosInstance.post(orderEndpoints.cancelOrder, data);
  return response.data;
};

export const postCnfOrderDetail = async (OrderMasterCode: string, CustomerProfileCode: number) => {
  const payload: OrderDetailRequest = { OrderNumber: OrderMasterCode, CustomerProfileCode };
  const response = await axiosInstance.post(orderEndpoints.getOrderStatus, payload);
  return response.data;
};
