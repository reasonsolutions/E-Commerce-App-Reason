import axiosInstance from '../axiosInstance';
import { wishlistEndpoints } from '../endpoints';
import type { PostAddToWishlistInterface, PostDeleteWishlistInterface } from '../interfaces';

export const getWishlist = async (customerprofilecode: number) => {
  const response = await axiosInstance.get(
    `${wishlistEndpoints.getWishlist}?customerProfileCode=${customerprofilecode}&pageNumber=1&pageSize=50`,
  );
  return response.data;
};

export const addToWishlist = async (customerprofilecode: number, inventory_id: number) => {
  const payload: PostAddToWishlistInterface = {
    CustomerProfileCode: customerprofilecode,
    InventoryId:         inventory_id,
  };
  const response = await axiosInstance.post(wishlistEndpoints.postAddToWishlist, payload);
  return response.data;
};

export const removeFromWishlist = async (
  customerprofilecode: number,
  wishlistItemCode: number,
) => {
  const payload: PostDeleteWishlistInterface = {
    WishlistCode:        wishlistItemCode,
    CustomerProfileCode: customerprofilecode,
  };
  const response = await axiosInstance.post(wishlistEndpoints.postDeleteWishlist, payload);
  return response.data;
};
