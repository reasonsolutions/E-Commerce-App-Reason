import axiosInstance from '../axiosInstance';
import { productEndpoints } from '../endpoints';
import type { ProductInterface } from '../interfaces';
import { SortBy } from '../../config/enum_files/SortBy';

// InventoryID → OrganisationId — populated on every product fetch, used at checkout
const _orgByInventory: Map<number, string> = new Map();

export const getOrgIdForInventory = (inventoryId: number): string =>
  _orgByInventory.get(inventoryId) ?? '';

function cacheOrgIds(products: ProductInterface[]): void {
  for (const p of products) {
    if (!p.OrganisationId) continue;
    for (const v of p.Variants ?? []) {
      _orgByInventory.set(Number(v.InventoryID), p.OrganisationId);
    }
  }
}

export const getAllProducts = async (sortBy?: SortBy) => {
  const response = await axiosInstance.post(productEndpoints.allProducts, {
    brands: [],
    categories: [],
    subCategories: [],
    searchQuery: '%',
    priceRange: { from: null, to: null },
    discount: null,
    sortBy: sortBy ?? null,
    pagination: { pageNumber: 1, pageSize: 10 },
  });
  const products: ProductInterface[] = response.data?.result?.Products ?? [];
  cacheOrgIds(products);
  return products;
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

export const getProductsByCategory = async (
  categoryId: number | string,
  pageNumber = 1,
  pageSize = 20,
  sortBy?: SortBy,
): Promise<ProductInterface[]> => {
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
  const products: ProductInterface[] = response.data?.result?.Products ?? [];
  cacheOrgIds(products);
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
  cacheOrgIds(products);
  return products;
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
