import axiosInstance from '../axiosInstance';
import { cartEndpoints } from '../endpoints';
import type { PostCartSaveInterface, CartQuantityRequest, deleteCartInterface } from '../interfaces';

export const updateCartItemQuantity = async (cartDetailsCode: number, inventoryId: number, quantity: number) => {
  const response = await axiosInstance.post(cartEndpoints.updateCartItem, {
    CartDetailsCode: cartDetailsCode,
    InventoryId: inventoryId,
    Quantity: quantity,
  });
  return response.data;
};

export const getSavedCartItems = async (customerprofilecode: number) => {
  const response = await axiosInstance.get(
    `${cartEndpoints.getSavedCartItems}?CustomerProfileCode=${customerprofilecode}`,
  );
  return response.data;
};

export const postSaveCartItems = async (data: PostCartSaveInterface) => {
  const response = await axiosInstance.post(cartEndpoints.postSaveCartItems, data);
  return response.data;
};

export const postDeleteCartItem = async (cartdetailscode: number) => {
  const payload: deleteCartInterface = { CartDetailsCode: cartdetailscode, IsPurchased: false };
  const response = await axiosInstance.post(cartEndpoints.deleteCartItem, payload);
  return response.data;
};

export const quantityIncrement = async (cartdetailscode: number, inventory_id: number) => {
  const payload: CartQuantityRequest = { CartDetailsCode: cartdetailscode, Inventory_Id: inventory_id };
  const response = await axiosInstance.post(cartEndpoints.quantityIncrement, payload);
  return response.data;
};

export const quantityDecrement = async (cartdetailscode: number, inventory_id: number) => {
  const payload: CartQuantityRequest = { CartDetailsCode: cartdetailscode, Inventory_Id: inventory_id };
  const response = await axiosInstance.post(cartEndpoints.quantityDecrement, payload);
  return response.data;
};
