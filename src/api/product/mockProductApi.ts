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

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const getAllProducts = async () => delay(ok(mockProducts));

export const getBrands = async () => delay(ok(mockBrands));

export const getCategories = async () => delay(ok(mockCategories));

export const getSubCategories = async (_categoryCode: string) => delay(ok([]));

export const getProductsByCategory = async (categorycode: string) => {
  const products = getMockProductsByCategory(categorycode);
  return delay(ok({ productsDetails: products, brandsDetails: mockBrands }));
};

export const getProductsBySubCategory = async (_subcategorycode: string) =>
  delay(ok({ productsDetails: mockProducts, brandsDetails: mockBrands }));

export const selectProduct = async (inventorycode: string) => {
  const id = Number(inventorycode);
  const { detail, variants } = getMockProductDetail(id);
  return delay(ok([detail, variants]));
};

export const searchProducts = async (filterstring: string, _category_id: string) => {
  const results = getMockSearchResults(filterstring);
  return delay(ok(results));
};
