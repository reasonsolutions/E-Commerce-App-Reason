import { MOCK_MODE } from '../../config/env';
import * as real from './addressApi';
import * as mock from './mockAddressApi';

const address = MOCK_MODE ? mock : real;

export const getDeliveryAddresses        = address.getDeliveryAddresses;
export const getDeliveryAddressForUpdate = address.getDeliveryAddressForUpdate;
export const postCreateDeliveryAddress   = address.postCreateDeliveryAddress;
export const postUpdateDeliveryAddress   = address.postUpdateDeliveryAddress;
export const postDeleteDeliveryAddress   = address.postDeleteDeliveryAddress;
