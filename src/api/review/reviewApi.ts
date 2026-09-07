import axiosInstance from '../axiosInstance';
import { reviewEndpoints } from '../endpoints';
import type {
  AddProductReviewInterface,
  AddProductReviewResultInterface,
  EditProductReviewInterface,
  GetProductReviewRequest,
  GetProductReviewResultInterface,
} from '../interfaces';

export const addProductReview = async (payload: AddProductReviewInterface): Promise<{
  statusCode:  number;
  result:      AddProductReviewResultInterface;
  userMessage: string;
}> => {
  const response = await axiosInstance.post(reviewEndpoints.addProductReview, payload);
  return response.data;
};

export const editProductReview = async (payload: EditProductReviewInterface): Promise<{
  statusCode:  number;
  result:      AddProductReviewResultInterface;
  userMessage: string;
}> => {
  const response = await axiosInstance.post(reviewEndpoints.editProductReview, payload);
  return response.data;
};

export const getProductReview = async (payload: GetProductReviewRequest): Promise<{
  statusCode:  number;
  result:      GetProductReviewResultInterface;
  userMessage: string;
}> => {
  const response = await axiosInstance.post(reviewEndpoints.getProductReview, {
    ItemId:              payload.ItemId,
    CustomerProfileCode: payload.CustomerProfileCode ?? null,
    PageNumber:          payload.PageNumber ?? 1,
    PageSize:            payload.PageSize ?? 10,
  });
  return response.data;
};
