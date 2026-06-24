import { MOCK_DELAY_MS } from '../../config/env';
import {
  ok,
  mockCategories,
  mockBrands,
  mockProducts,
  getMockProductDetail,
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

export const getProductsByCategory = async (categorycode: string | number, _pageNumber = 1, _pageSize = 20): Promise<ProductByCategoryProductDetails[]> => {
  const products = getMockProductsByCategory(String(categorycode));
  return delay(products as unknown as ProductByCategoryProductDetails[]);
};

export const getProductsByBrand = async (_brandId: number | string): Promise<ProductByCategoryProductDetails[]> =>
  delay([] as ProductByCategoryProductDetails[]);

export const getBrandProductCount = async (_brandId: number | string): Promise<number> => delay(0);
export const getCategoryProductCount = async (_categoryId: number | string): Promise<number> => delay(0);


export const getProductByItemId = async (itemId: number | string) => {
  const id = Number(itemId);
  const { detail } = getMockProductDetail(id);
  return delay(ok(detail));
};
