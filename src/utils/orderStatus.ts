import type { OrderStatus } from '../components/ui';

const STATUS_MAP: Record<number, OrderStatus> = {
  1: 'Confirmed',
  2: 'Shipped',
  3: 'Delivered',
  4: 'Cancelled',
};

export function orderStatusLabel(code: number): OrderStatus {
  return STATUS_MAP[code] ?? 'Confirmed';
}
