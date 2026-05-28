import axiosInstance from '../axiosInstance';
import { orderEndpoints } from '../endpoints';
import type {
  PlaceOrderInterface,
  OrderHistoryRequest,
  OrderDetailRequest,
} from '../interfaces';

export const placeOrder = async (data: PlaceOrderInterface) => {
  const response = await axiosInstance.post(orderEndpoints.placeOrder, data);
  return response.data;
};

// Kept so AddressScreen compiles without changes — delegates to placeOrder
export const postPlacedMultipleOrder = placeOrder;

export const postOrderHistory = async (customerprofilecode: number) => {
  const payload: OrderHistoryRequest = { CustomerProfileCode: customerprofilecode };
  const response = await axiosInstance.post(orderEndpoints.getOrderHistory, payload);
  const raw = response.data;
  if (raw?.result?.OrdHistoryDetails) {
    raw.result.OrdHistoryDetails = raw.result.OrdHistoryDetails.map((item: any) => ({
      ...item,
      Inventory_Id: item.InventoryID,
      Item_Id:      item.ItemID,
      Brand_Id:     item.BrandID,
      Brand_Name:   item.BrandName,
      Amount:       item.Price ?? 0,
    }));
  }
  return raw;
};

export const postCnfOrderDetail = async (OrderMasterCode: string, CustomerProfileCode: number) => {
  const payload: OrderDetailRequest = { OrderNumber: OrderMasterCode, CustomerProfileCode };
  const response = await axiosInstance.post(orderEndpoints.getOrderStatus, payload);
  return response.data;
};
