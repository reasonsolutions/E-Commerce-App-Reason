import axiosInstance from '../axiosInstance';
import { addressEndpoints } from '../endpoints';
import type {
  postCreateDeliveryAddressInterface,
  postUpdateDeliveryAddressInterface,
} from '../interfaces';
import { AddressLabel } from '../../config/enum_files/AddressLabel';

export const getDeliveryAddresses = async (customerprofilecode: number, addressLabel?: AddressLabel) => {
  const query = addressLabel
    ? `?CustomerProfileCode=${customerprofilecode}&AddressLabel=${addressLabel}`
    : `?CustomerProfileCode=${customerprofilecode}`;
  const response = await axiosInstance.get(`${addressEndpoints.getDeliveryAddress}${query}`);
  return response.data;
};

export const getDeliveryAddressForUpdate = async (
  orderdeliveryaddresscode: number,
  customerprofilecode: number,
) => {
  const response = await axiosInstance.get(
    `${addressEndpoints.getDeliveryAddressForUpdate}?CustomerProfileCode=${customerprofilecode}&OrderDeliveryAddressCode=${orderdeliveryaddresscode}`,
  );
  return response.data;
};

export const postCreateDeliveryAddress = async (data: postCreateDeliveryAddressInterface) => {
  const response = await axiosInstance.post(addressEndpoints.postCreateDeliveryAddress, data);
  return response.data;
};

export const postUpdateDeliveryAddress = async (data: postUpdateDeliveryAddressInterface) => {
  const response = await axiosInstance.post(addressEndpoints.postUpdateDeliveryAddress, data);
  return response.data;
};

export const postDeleteDeliveryAddress = async (OrderDeliveryAddressCode: number) => {
  const response = await axiosInstance.post(addressEndpoints.postDeleteDeliveryAddress, {
    OrderDeliveryAddressCode,
  });
  return response.data;
};
