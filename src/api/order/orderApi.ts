import axiosInstance from '../axiosInstance';
import { orderEndpoints } from '../endpoints';
import type {
  PlaceOrderInterface,
  OrderHistoryRequest,
  OrderDetailRequest,
  CancelOrderInterface,
  OrderHistoryApiResponse,
} from '../interfaces';

interface RawOrderHistoryItem {
  InventoryID:     number;
  ItemID:          number;
  BrandID:         number;
  BrandName:       string;
  SubOrderID?:     number;
  SubOrderNumber?: string;
  Price:           number;
  ComparePrice?:   number;
  Quantity:        number;
  Name:            string;
  Variant:         string;
  Images:          string;
  OrderStatus:     number;
  [key: string]: unknown;
}

interface RawOrderHistoryGroup {
  OrderMasterCode: number;
  OrderNumber:     string;
  OrderedDate:     string;
  Items:           RawOrderHistoryItem[];
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

export const postOrderHistory = async (
  customerprofilecode: number,
  page: number = 1,
  filters: OrderHistoryFilters = {},
): Promise<{ items: any[]; hasMore: boolean; totalRecords: number }> => {
  const payload: OrderHistoryRequest = {
    CustomerProfileCode: customerprofilecode,
    PageNumber:          page,
    PageSize:            10,
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
      Amount:          item.Price ?? 0,
      ComparePrice:    item.ComparePrice,
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
