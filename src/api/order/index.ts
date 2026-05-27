import * as real from './orderApi';
import * as mock from './mockOrderApi';
import type { OrderHistoryItemInterface, OrderDetailResponseInterface } from '../interfaces';

// placeOrder + postOrderHistory use real API; postCnfOrderDetail remains on mock
const order = mock;
const orderReal = real;

export const placeOrder              = orderReal.placeOrder;
export const postPlacedMultipleOrder = orderReal.postPlacedMultipleOrder;

export async function postOrderHistory(
  customerProfileCode: number,
): Promise<OrderHistoryItemInterface[]> {
  const raw = await orderReal.postOrderHistory(customerProfileCode);
  return raw.result?.OrdHistoryDetails ?? [];
}

export async function postCnfOrderDetail(
  orderNumber: string,
  customerProfileCode: number,
): Promise<OrderDetailResponseInterface> {
  const raw = await order.postCnfOrderDetail(orderNumber, customerProfileCode);
  return raw.result ?? { OrderDetails: [], DeliveryDetail: [] };
}
