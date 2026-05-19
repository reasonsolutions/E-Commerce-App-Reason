import { MOCK_DELAY_MS } from '../../config/env';
import type {
  postPlacedMultipleOrderInterface,
  PlaceOrderInterface,
} from '../interfaces';
import { ok, mockOrderHistory, mockOrderDetail } from '../mock/mockData';

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const placeOrder = async (_data: PlaceOrderInterface) =>
  delay(ok({ OrderNumber: `ORDNO_MOCK_${Date.now()}` }, 'Order placed successfully.'));

export const postPlacedMultipleOrder = async (_data: postPlacedMultipleOrderInterface) =>
  delay(ok({ OrderNumber: `ORDNO_MOCK_${Date.now()}` }, 'Order placed successfully.'));

export const postOrderHistory = async (_customerprofilecode: number) =>
  delay(ok({ OrdHistoryDetails: mockOrderHistory }));

export const postCnfOrderDetail = async (_orderNumber: string, _customerProfileCode: number) =>
  delay(ok(mockOrderDetail));
