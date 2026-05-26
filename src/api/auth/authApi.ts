import axiosInstance from '../axiosInstance';
import { authEndpoints } from '../endpoints';
import type { createCustomerInterface, postLoginInterface, postUpdateCustomerInterface } from '../interfaces';

export const loginCustomer = async (data: postLoginInterface) => {
  const response = await axiosInstance.post(authEndpoints.postLoginCustomer, data);
  return response.data;
};

export const postCreateCustomer = async (data: createCustomerInterface) => {
  const response = await axiosInstance.post(authEndpoints.postCreateCustomer, data);
  return response.data;
};

export const postConfirmCustomer = async (data: createCustomerInterface & { OTP: string }) => {
  const response = await axiosInstance.post(authEndpoints.postConfirmCustomer, data);
  return response.data;
};

export const postUpdateCustomer = async (data: postUpdateCustomerInterface) => {
  const response = await axiosInstance.post(authEndpoints.postUpdateCustomer, data);
  return response.data;
};
