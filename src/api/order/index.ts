import { MOCK_MODE } from '../../config/env';
import * as real from './orderApi';
import * as mock from './mockOrderApi';
import type { OrderHistoryItemInterface, OrderDetailResponseInterface } from '../interfaces';

const order = MOCK_MODE ? mock : real;

export const placeOrder              = order.placeOrder;
export const postPlacedMultipleOrder = order.postPlacedMultipleOrder;

export async function postOrderHistory(
  customerProfileCode: number,
): Promise<OrderHistoryItemInterface[]> {
  const raw = await order.postOrderHistory(customerProfileCode);
  return raw.result?.OrdHistoryDetails ?? [];
}

export async function postCnfOrderDetail(
  orderNumber: string,
  customerProfileCode: number,
): Promise<OrderDetailResponseInterface> {
  const raw = await order.postCnfOrderDetail(orderNumber, customerProfileCode);
  return raw.result ?? { OrderDetails: [], DeliveryDetail: [] };
}
