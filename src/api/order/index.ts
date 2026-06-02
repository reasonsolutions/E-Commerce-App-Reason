import * as real from './orderApi';
import type { OrderHistoryItemInterface, OrderDetailResponseInterface, OrderDetailItemExtendedInterface } from '../interfaces';
export type { OrderHistoryFilters } from './orderApi';

export const placeOrder              = real.placeOrder;
export const postPlacedMultipleOrder = real.postPlacedMultipleOrder;

export async function postOrderHistory(
  customerProfileCode: number,
  page: number = 1,
  filters: real.OrderHistoryFilters = {},
): Promise<{ items: OrderHistoryItemInterface[]; hasMore: boolean }> {
  return real.postOrderHistory(customerProfileCode, page, filters);
}

export async function postCnfOrderDetail(
  orderNumber: string,
  customerProfileCode: number,
): Promise<OrderDetailResponseInterface> {
  const raw = await real.postCnfOrderDetail(orderNumber, customerProfileCode);
  const result = raw.result ?? { OrderDetails: [], DeliveryDetail: [] };
  result.OrderDetails = (result.OrderDetails ?? []).map((item: OrderDetailItemExtendedInterface) => ({
    ...item,
    Brand_Name: item.Brand_Name ?? (item as OrderDetailItemExtendedInterface & { BrandName?: string }).BrandName,
  }));
  return result;
}
