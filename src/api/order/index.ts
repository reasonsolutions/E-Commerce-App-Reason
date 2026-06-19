import * as real from './orderApi';
import type { OrderHistoryItemInterface, OrderDetailResponseInterface, OrderDetailItemExtendedInterface } from '../interfaces';
export type { OrderHistoryFilters } from './orderApi';

export const placeOrder              = real.placeOrder;
export const postPlacedMultipleOrder = real.postPlacedMultipleOrder;
export const cancelOrder             = real.cancelOrder;

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
  const rawRes = await real.postCnfOrderDetail(orderNumber, customerProfileCode);
  const result = rawRes.result ?? { OrderDetails: [], DeliveryDetail: [] };
  result.OrderDetails = (result.OrderDetails ?? []).map((item: OrderDetailItemExtendedInterface) => {
    const raw = item as OrderDetailItemExtendedInterface & { InventoryID?: number; ItemID?: number; BrandName?: string; BrandID?: number; SubOrder?: { Code: number; Number: string }; PaymentInfo?: any; Events?: any[] };
    return {
      ...item,
      Inventory_Id: item.Inventory_Id ?? raw.InventoryID ?? 0,
      Item_Id:      item.Item_Id      ?? raw.ItemID      ?? 0,
      SubOrder:     item.SubOrder     ?? raw.SubOrder    ?? { Code: 0, Number: '' },
      Brand_Name:   item.Brand_Name   ?? raw.BrandName   ?? '',
      Brand_Id:     item.Brand_Id     ?? raw.BrandID     ?? 0,
      PaymentInfo:  raw.PaymentInfo   ?? undefined,
      Events:       raw.Events        ?? [],
    };
  });
  return result;
}
