import type { OrderStatus } from '../components/ui';
import { OrderStatusCode } from '../api/interfaces';

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
