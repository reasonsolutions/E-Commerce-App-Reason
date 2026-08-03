import axiosInstance from '../axiosInstance';
import { productEndpoints } from '../endpoints';
import type { ProductInterface, CategoryFeedProduct } from '../interfaces';
import { SortBy } from '../../config/enum_files/SortBy';

// Shared "on sale" range for the allProducts discount filter — 40% off or
// more, so it actually reads as a deal. Home's Best Deals shelf and
// ResultScreen's "On sale" filter chip both send this same range so
// "on sale" means one consistent thing across the app.
export const ON_SALE_DISCOUNT_RANGE = '40-100';

export const getAllProducts = async (
  sortBy?: SortBy,
  discount?: string,
  pageNumber = 1,
  pageSize = 10,
) => {
  const response = await axiosInstance.post(productEndpoints.allProducts, {
    brands: [],
    categories: [],
    subCategories: [],
    searchQuery: '%',
    priceRange: { from: null, to: null },
    discount: discount ?? null,
    sortBy: sortBy ?? null,
    pagination: { pageNumber, pageSize },
  });
  const products: ProductInterface[] = response.data?.result?.Products ?? [];
  return products;
};

export const getBrands = async (pageNumber = 1, pageSize = 50) => {
  const response = await axiosInstance.get(
    `${productEndpoints.getBrands}?pageNumber=${pageNumber}&pageSize=${pageSize}`,
  );
  return response.data;
};

export const getCategories = async (pageNumber = 1, pageSize = 50) => {
  const response = await axiosInstance.get(
    `${productEndpoints.getCategory}?pageNumber=${pageNumber}&pageSize=${pageSize}`,
  );
  return response.data;
};

export const getSubCategories = async (categoryCode: string, pageNumber = 1, pageSize = 50) => {
  const response = await axiosInstance.get(
    `${productEndpoints.getSubCategoryByCategory}?CategoryId=${categoryCode}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
  );
  return response.data;
};

export const getProductsByCategory = async (
  categoryId: number | string,
  pageNumber = 1,
  pageSize = 20,
  sortBy?: SortBy,
): Promise<CategoryFeedProduct[]> => {
  const response = await axiosInstance.post(productEndpoints.allProducts, {
    brands: [],
    categories: [Number(categoryId)],
    subCategories: [],
    searchQuery: '%',
    priceRange: { from: null, to: null },
    discount: null,
    sortBy: sortBy ?? null,
    pagination: { pageNumber, pageSize },
  });
  const products: CategoryFeedProduct[] = response.data?.result?.Products ?? [];
  return products;
};

export const getProductsByBrand = async (
  brandId: number | string,
  pageNumber = 1,
  pageSize = 20,
  sortBy?: SortBy,
): Promise<ProductInterface[]> => {
  const response = await axiosInstance.post(productEndpoints.allProducts, {
    brands: [Number(brandId)],
    categories: [],
    subCategories: [],
    searchQuery: '%',
    priceRange: { from: null, to: null },
    discount: null,
    sortBy: sortBy ?? null,
    pagination: { pageNumber, pageSize },
  });
  const products: ProductInterface[] = response.data?.result?.Products ?? [];
  return products;
};


export const getCategoryProductCount = async (categoryId: number | string): Promise<number> => {
  const response = await axiosInstance.post(productEndpoints.allProducts, {
    brands: [],
    categories: [Number(categoryId)],
    subCategories: [],
    searchQuery: '%',
    priceRange: { from: null, to: null },
    discount: null,
    sortBy: null,
    pagination: { pageNumber: 1, pageSize: 1 },
  });
  return response.data?.result?.TotalRecords ?? 0;
};

export const getBrandProductCount = async (brandId: number | string): Promise<number> => {
  const response = await axiosInstance.post(productEndpoints.allProducts, {
    brands: [Number(brandId)],
    categories: [],
    subCategories: [],
    searchQuery: '%',
    priceRange: { from: null, to: null },
    discount: null,
    sortBy: null,
    pagination: { pageNumber: 1, pageSize: 1 },
  });
  return response.data?.result?.TotalRecords ?? 0;
};

export const getProductByItemId = async (itemId: number | string) => {
  const response = await axiosInstance.get(
    `${productEndpoints.getProductByItemId}?ItemId=${itemId}`,
  );
  return response.data;
};
