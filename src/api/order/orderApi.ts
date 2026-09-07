import axiosInstance from '../axiosInstance';
import { orderEndpoints } from '../endpoints';
import { OrderStatusCode } from '../interfaces';
import type {
  PlaceOrderInterface,
  PlaceOrderResponse,
  OrderHistoryRequest,
  OrderDetailRequest,
  CancelOrderInterface,
  OrderHistoryApiResponse,
  OrderPaymentInfoInterface,
  ReturnReasonInterface,
  ReturnOrderInterface,
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
  sortBy?:      'asc' | 'desc';
  dateFrom?:    string | null;
  dateTo?:      string | null;
  status?:      'all' | 'delivered' | 'cancelled' | 'returned';
  searchQuery?: string | null;
}

export const placeOrder = async (data: PlaceOrderInterface): Promise<PlaceOrderResponse> => {
  const response = await axiosInstance.post(orderEndpoints.placeOrder, data);
  return response.data;
};

// Kept so AddressScreen compiles without changes — delegates to placeOrder
export const postPlacedMultipleOrder = placeOrder;

const PAGE_SIZE_DEFAULT = 10;

const STATUS_TO_CODE: Record<Exclude<OrderHistoryFilters['status'], 'all' | undefined>, number> = {
  delivered: OrderStatusCode.Delivered,
  cancelled: OrderStatusCode.Cancelled,
  returned:  OrderStatusCode.Returned,
};

export const postOrderHistory = async (
  customerprofilecode: number,
  page: number = 1,
  filters: OrderHistoryFilters = {},
): Promise<{ items: any[]; hasMore: boolean; totalRecords: number }> => {
  const searchQuery = filters.searchQuery?.trim();
  const statusCode = filters.status && filters.status !== 'all' ? STATUS_TO_CODE[filters.status] : null;
  const payload: OrderHistoryRequest = {
    CustomerProfileCode: customerprofilecode,
    PageNumber:          page,
    PageSize:            PAGE_SIZE_DEFAULT,
    SortBy:              filters.sortBy ?? 'desc',
    DateFrom:            filters.dateFrom ?? null,
    DateTo:              filters.dateTo ?? null,
    OrderStatusList:     statusCode !== null ? [statusCode] : null,
    SearchQuery:         searchQuery ? `%${searchQuery}%` : null,
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

export const getReturnReasons = async (): Promise<{ statusCode: 1 | 0; result: ReturnReasonInterface[]; userMessage: string }> => {
  const response = await axiosInstance.get(orderEndpoints.getReturnReasons);
  return response.data;
};

export const postReturnRequest = async (data: ReturnOrderInterface) => {
  const response = await axiosInstance.post(orderEndpoints.postReturnRequest, data);
  return response.data;
};
