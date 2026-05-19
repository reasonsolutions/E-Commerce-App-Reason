import { MOCK_DELAY_MS } from '../../config/env';
import type { createCustomerInterface, postLoginInterface } from '../interfaces';
import { ok, mockLoggedInCustomer } from '../mock/mockData';

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const loginCustomer = async (data: postLoginInterface) => {
  if (data.LoginID === 'ishaan' && data.Password === 'reason1') {
    return delay(ok(mockLoggedInCustomer));
  }
  return delay({ statusCode: 0, exception: null, userMessage: 'Invalid email or password.', result: null });
};

export const postCreateCustomer = async (_data: createCustomerInterface) =>
  delay(ok(true, 'Account created successfully.'));
