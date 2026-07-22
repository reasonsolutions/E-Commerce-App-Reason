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
