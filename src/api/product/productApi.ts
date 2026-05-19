import axiosInstance from '../axiosInstance';
import { productEndpoints } from '../endpoints';

export const getAllProducts = async () => {
  const response = await axiosInstance.post(productEndpoints.allProducts, {
    brands: [],
    categories: [],
    subCategories: [],
    searchQuery: '%',
    priceRange: { from: null, to: null },
    discount: '%',
    pagination: { pageNumber: 1, pageSize: 10 },
  });
  return response.data?.result?.Products ?? [];
};

export const getBrands = async () => {
  const response = await axiosInstance.get(productEndpoints.getBrands);
  return response.data;
};

export const getCategories = async () => {
  const response = await axiosInstance.get(
    `${productEndpoints.getCategory}?pageNumber=1&pageSize=50`,
  );
  return response.data;
};

export const getSubCategories = async (categoryCode: string) => {
  const response = await axiosInstance.get(
    `${productEndpoints.getSubCategoryByCategory}?CategoryId=${categoryCode}`,
  );
  return response.data;
};

export const getProductsByCategory = async (categorycode: string) => {
  const response = await axiosInstance.get(
    `${productEndpoints.getProductsByCategory}?categorycode=${categorycode}`,
  );
  return response.data;
};

export const getProductsBySubCategory = async (subcategorycode: string) => {
  const response = await axiosInstance.get(
    `${productEndpoints.getProductsBySubCategory}?subcategorycode=${subcategorycode}`,
  );
  return response.data;
};

export const selectProduct = async (inventorycode: string) => {
  const response = await axiosInstance.get(
    `${productEndpoints.selectProduct}?inventorycode=${inventorycode}`,
  );
  return response.data;
};

export const searchProducts = async (
  filterstring: string,
  category_id: string,
) => {
  const response = await axiosInstance.get(
    `${productEndpoints.searchProduct}?filterstring=${filterstring}&Category_Id=${category_id}`,
  );
  return response.data;
};
