import { MOCK_DELAY_MS } from '../../config/env';
import {
  ok,
  mockCategories,
  mockBrands,
  mockProducts,
  getMockProductDetail,
  getMockSearchResults,
  getMockProductsByCategory,
} from '../mock/mockData';
import { ProductByCategoryProductDetails } from '../interfaces';

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const getAllProducts = async () => delay(ok(mockProducts));

export const getBrands = async () => delay(ok(mockBrands));

export const getCategories = async () => delay(ok(mockCategories));

export const getSubCategories = async (_categoryCode: string) => delay(ok([]));

export const getProductsByCategory = async (categorycode: string): Promise<ProductByCategoryProductDetails[]> => {
  const products = getMockProductsByCategory(categorycode);
  return delay(products as unknown as ProductByCategoryProductDetails[]);
};

export const getProductsByBrand = async (_brandId: number | string): Promise<ProductByCategoryProductDetails[]> =>
  delay([] as ProductByCategoryProductDetails[]);

export const getProductsBySubCategory = async (_subcategorycode: string) =>
  delay(ok({ productsDetails: mockProducts, brandsDetails: mockBrands }));

export const selectProduct = async (inventorycode: string) => {
  const id = Number(inventorycode);
  const { detail } = getMockProductDetail(id);
  return delay(ok(detail));
};

export const searchProducts = async (filterstring: string, _category_id: string) => {
  const results = getMockSearchResults(filterstring);
  return delay(ok(results));
};

export const getProductByItemId = async (itemId: number | string) => {
  const id = Number(itemId);
  const { detail } = getMockProductDetail(id);
  return delay(ok(detail));
};
