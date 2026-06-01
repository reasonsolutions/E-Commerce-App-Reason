import * as real from './orderApi';
import type { OrderHistoryItemInterface, OrderDetailResponseInterface } from '../interfaces';

export const placeOrder              = real.placeOrder;
export const postPlacedMultipleOrder = real.postPlacedMultipleOrder;

export async function postOrderHistory(
  customerProfileCode: number,
): Promise<OrderHistoryItemInterface[]> {
  const raw = await real.postOrderHistory(customerProfileCode);
  return raw.result?.OrdHistoryDetails ?? [];
}

export async function postCnfOrderDetail(
  orderNumber: string,
  customerProfileCode: number,
): Promise<OrderDetailResponseInterface> {
  const raw = await real.postCnfOrderDetail(orderNumber, customerProfileCode);
  const result = raw.result ?? { OrderDetails: [], DeliveryDetail: [] };
  result.OrderDetails = (result.OrderDetails ?? []).map((item: any) => ({
    ...item,
    Brand_Name: item.Brand_Name ?? item.BrandName,
  }));
  return result;
}
