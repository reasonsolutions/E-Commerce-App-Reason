import axiosInstance from '../axiosInstance';
import { orderEndpoints } from '../endpoints';
import type {
  PlaceOrderInterface,
  OrderHistoryRequest,
  OrderDetailRequest,
} from '../interfaces';

interface RawOrderHistoryItem {
  InventoryID: number;
  ItemID:      number;
  BrandID:     number;
  BrandName:   string;
  Price:       number;
  [key: string]: unknown;
}

interface RawOrderHistoryGroup {
  OrderNumber: string;
  OrderedDate: string;
  Items:       RawOrderHistoryItem[];
}

export interface OrderHistoryFilters {
  sortBy?:   'asc' | 'desc';
  dateFrom?: string | null;
  dateTo?:   string | null;
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
): Promise<{ items: any[]; hasMore: boolean }> => {
  const payload: OrderHistoryRequest = {
    CustomerProfileCode: customerprofilecode,
    PageNumber:          page,
    PageSize:            10,
    SortBy:              filters.sortBy ?? 'desc',
    DateFrom:            filters.dateFrom ?? null,
    DateTo:              filters.dateTo ?? null,
  };
  const response = await axiosInstance.post(orderEndpoints.getOrderHistory, payload);
  const raw = response.data;

  if (!Array.isArray(raw?.result) || raw.result.length === 0) {
    return { items: [], hasMore: false };
  }

  const items = raw.result.flatMap((order: RawOrderHistoryGroup) =>
    (order.Items ?? []).map((item: RawOrderHistoryItem) => ({
      ...item,
      OrderNumber:  order.OrderNumber,
      OrderedDate:  order.OrderedDate,
      Inventory_Id: item.InventoryID,
      Item_Id:      item.ItemID,
      Brand_Id:     item.BrandID,
      Brand_Name:   item.BrandName,
      Amount:       item.Price ?? 0,
    })),
  );

  return { items, hasMore: items.length > 0 };
};

export const postCnfOrderDetail = async (OrderMasterCode: string, CustomerProfileCode: number) => {
  const payload: OrderDetailRequest = { OrderNumber: OrderMasterCode, CustomerProfileCode };
  const response = await axiosInstance.post(orderEndpoints.getOrderStatus, payload);
  return response.data;
};
