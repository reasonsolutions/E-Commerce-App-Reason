import { MOCK_DELAY_MS } from '../../config/env';
import type {
  postCreateDeliveryAddressInterface,
  postUpdateDeliveryAddressInterface,
} from '../interfaces';
import { ok, mockDeliveryAddresses } from '../mock/mockData';

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

let _addresses = [...mockDeliveryAddresses];
let _nextAddressCode = 100;

export const getDeliveryAddresses = async (_customerprofilecode: number) =>
  delay(ok(_addresses));

export const getDeliveryAddressForUpdate = async (
  orderdeliveryaddresscode: number,
  _customerprofilecode: number,
) => {
  const found = _addresses.find(a => a.OrderDeliveryAddressCode === orderdeliveryaddresscode);
  return delay(ok(found ? [found] : []));
};

export const postCreateDeliveryAddress = async (data: postCreateDeliveryAddressInterface) => {
  const newAddress = {
    OrderDeliveryAddressCode: _nextAddressCode++,
    CustomerName:             data.CustomerName,
    MobileNumber:             Number(data.MobileNumber),
    FullAddress:              data.FullAddress,
    CustomerProfileCode:      data.CustomerProfileCode,
    CreatedDate:              new Date().toISOString(),
    UpdatedDate:              null,
  };
  _addresses = [..._addresses, newAddress];
  return delay(ok(true, 'Address created successfully.'));
};

export const postUpdateDeliveryAddress = async (data: postUpdateDeliveryAddressInterface) => {
  _addresses = _addresses.map(a =>
    a.OrderDeliveryAddressCode === data.OrderDeliveryAddressCode
      ? {
          ...a,
          CustomerName: data.CustomerName,
          MobileNumber: data.MobileNumber,
          FullAddress:  data.FullAddress,
          UpdatedDate:  new Date().toISOString(),
        }
      : a,
  );
  return delay(ok(true, 'Address updated successfully.'));
};

export const postDeleteDeliveryAddress = async (OrderDeliveryAddressCode: number) => {
  _addresses = _addresses.filter(a => a.OrderDeliveryAddressCode !== OrderDeliveryAddressCode);
  return delay(ok(true, 'Address deleted.'));
};
