import { MOCK_MODE } from '../../config/env';
import * as real from './authApi';
import * as mock from './mockAuthApi';

const auth = MOCK_MODE ? mock : real;

export const loginCustomer       = auth.loginCustomer;
export const postCreateCustomer  = auth.postCreateCustomer;
