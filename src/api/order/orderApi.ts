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
  return response.data;
};

export const postCnfOrderDetail = async (OrderMasterCode: string, CustomerProfileCode: number) => {
  const payload: OrderDetailRequest = { OrderNumber: OrderMasterCode, CustomerProfileCode };
  const response = await axiosInstance.post(orderEndpoints.getOrderStatus, payload);
  return response.data;
};
