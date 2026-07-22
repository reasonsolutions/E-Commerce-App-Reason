import type { OrderStatus } from '../components/ui';
import { OrderStatusCode, type OrderEventInterface } from '../api/interfaces';

const STATUS_MAP: Record<OrderStatusCode, OrderStatus> = {
  [OrderStatusCode.New]:        'New',
  [OrderStatusCode.Confirmed]:  'Confirmed',
  [OrderStatusCode.Processing]: 'Processing',
  [OrderStatusCode.Fulfilled]:  'Fulfilled',
  [OrderStatusCode.Shipped]:    'Shipped',
  [OrderStatusCode.Delivered]:  'Delivered',
  [OrderStatusCode.Cancelled]:  'Cancelled',
  [OrderStatusCode.Returned]:   'Returned',
};

export function orderStatusLabel(code: number): OrderStatus {
  return STATUS_MAP[code as OrderStatusCode] ?? 'New';
}

// Events is the more granular, per-step source of truth from getOrderStatus —
// OrderStatus is a single snapshot field that can lag behind it or disagree
// with the timeline. Derive the current status from the highest completed
// event's StatusCode so the badge, progress bar, and cancellable check all
// agree with what the timeline shows; fall back to OrderStatus only when
// there's no event data to derive from.
export function currentOrderStatus(
  orderStatus: number,
  events: OrderEventInterface[] | null | undefined,
): OrderStatusCode {
  const completed = (events ?? []).filter(e => e.IsCompleted);
  if (!completed.length) return orderStatus as OrderStatusCode;
  return completed.reduce(
    (max, e) => (e.StatusCode > max ? e.StatusCode : max),
    completed[0].StatusCode,
  ) as OrderStatusCode;
}

// Customer-facing display copy — used in StatusHero on OrderDetailScreen.
// Codes match OrderStatusCode enum exactly (New=1 … Returned=8).
export const ORDER_STATUS_LABELS: Record<number, string> = {
  [OrderStatusCode.New]:        'Order Placed',
  [OrderStatusCode.Confirmed]:  'Order Confirmed',
  [OrderStatusCode.Processing]: 'Being Prepared',
  [OrderStatusCode.Fulfilled]:  'Packed',
  [OrderStatusCode.Shipped]:    'Shipped',
  [OrderStatusCode.Delivered]:  'Delivered',
  [OrderStatusCode.Cancelled]:  'Order Cancelled',
  [OrderStatusCode.Returned]:   'Return Initiated',
};
