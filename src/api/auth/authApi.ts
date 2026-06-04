import axiosInstance from '../axiosInstance';
import { authEndpoints } from '../endpoints';
import type { createCustomerInterface, postLoginInterface, postUpdateCustomerInterface, ChangePasswordInterface } from '../interfaces';

export const loginCustomer = async (data: Pick<postLoginInterface, 'LoginID' | 'Password'>) => {
  const response = await axiosInstance.post(authEndpoints.postLoginCustomer, {
    ...data,
    ClientType: 'MOB-RN-2F9A',
  } satisfies postLoginInterface);
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

export const changePassword = async (data: ChangePasswordInterface) => {
  const response = await axiosInstance.post(authEndpoints.changePassword, data);
  return response.data;
};

export const forgotPassword = async (emailAddress: string) => {
  const response = await axiosInstance.post(authEndpoints.forgotPassword, { emailAddress });
  return response.data;
};

export const verifyForgotPasswordOTP = async (emailAddress: string, otp: string) => {
  const response = await axiosInstance.post(authEndpoints.verifyForgotPasswordOTP, { emailAddress, otp });
  return response.data;
};
