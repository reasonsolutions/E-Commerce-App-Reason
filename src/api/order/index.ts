import * as real from './orderApi';
import type { OrderHistoryItemInterface, OrderDetailResponseInterface, OrderDetailItemExtendedInterface } from '../interfaces';
export type { OrderHistoryFilters } from './orderApi';

export const placeOrder              = real.placeOrder;
export const postPlacedMultipleOrder = real.postPlacedMultipleOrder;
export const cancelOrder             = real.cancelOrder;
export const getReturnReasons        = real.getReturnReasons;
export const postReturnRequest       = real.postReturnRequest;

export async function postOrderHistory(
  customerProfileCode: number,
  page: number = 1,
  filters: real.OrderHistoryFilters = {},
): Promise<{ items: OrderHistoryItemInterface[]; hasMore: boolean; totalRecords: number }> {
  return real.postOrderHistory(customerProfileCode, page, filters);
}

export async function postCnfOrderDetail(
  orderNumber: string,
  customerProfileCode: number,
): Promise<OrderDetailResponseInterface> {
  const rawRes = await real.postCnfOrderDetail(orderNumber, customerProfileCode);
  const result = rawRes.result ?? { OrderDetails: [], DeliveryDetail: [] };
  // PaymentInfo can arrive at the top level (sibling of OrderDetails/DeliveryDetail)
  // instead of duplicated on every item — fall back to it so orders using that
  // shape (e.g. COD) still populate the per-item PaymentInfo the screen reads.
  const orderLevelPaymentInfo = (rawRes.result as { PaymentInfo?: unknown } | undefined)?.PaymentInfo;
  result.OrderDetails = (result.OrderDetails ?? []).map((item: OrderDetailItemExtendedInterface) => {
    const raw = item as OrderDetailItemExtendedInterface & { InventoryID?: number; ItemID?: number; BrandName?: string; BrandID?: number; SubOrder?: { Code: number; Number: string }; PaymentInfo?: any; Events?: any[]; PricingDetails?: { GrossAmount?: number } };
    return {
      ...item,
      Inventory_Id: item.Inventory_Id ?? raw.InventoryID ?? 0,
      Item_Id:      item.Item_Id      ?? raw.ItemID      ?? 0,
      SubOrder:     item.SubOrder     ?? raw.SubOrder    ?? { Code: 0, Number: '' },
      Brand_Name:   item.Brand_Name   ?? raw.BrandName   ?? '',
      Brand_Id:     item.Brand_Id     ?? raw.BrandID     ?? 0,
      // Gross (pre-discount) line total — never net, so the discount line in the
      // payment summary stays visible instead of being silently baked in.
      // Backend's flat Amount field is deprecated in favor of PricingDetails.
      Amount:       raw.PricingDetails?.GrossAmount ?? 0,
      PaymentInfo:  raw.PaymentInfo   ?? orderLevelPaymentInfo ?? undefined,
      Events:       raw.Events        ?? [],
    };
  });
  return result;
}
