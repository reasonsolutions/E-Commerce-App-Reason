import * as real from './productApi';
import * as mock from './mockProductApi';

// Product domain uses real API — other domains remain on mock via global MOCK_MODE
const product = false ? mock : real;

export const getAllProducts            = product.getAllProducts;
export const getBrands                = product.getBrands;
export const getCategories            = product.getCategories;
export const getSubCategories         = product.getSubCategories;
export const getProductsByCategory    = product.getProductsByCategory;
export const getProductsByBrand       = product.getProductsByBrand;
export const getProductsBySubCategory = product.getProductsBySubCategory;
export const selectProduct            = product.selectProduct;
export const searchProducts           = product.searchProducts;
export const getProductByItemId       = product.getProductByItemId;
export { getOrgIdForInventory } from './productApi';
