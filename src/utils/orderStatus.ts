import type { OrderStatus } from '../components/ui';

export type OrderStatusCode = 1 | 2 | 3 | 4;

const STATUS_MAP: Record<OrderStatusCode, OrderStatus> = {
  1: 'Confirmed',
  2: 'Shipped',
  3: 'Delivered',
  4: 'Cancelled',
};

export function orderStatusLabel(code: OrderStatusCode): OrderStatus {
  return STATUS_MAP[code];
}
