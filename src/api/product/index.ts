import * as real from './productApi';

const product = real;

export const ON_SALE_DISCOUNT_RANGE   = real.ON_SALE_DISCOUNT_RANGE;
export const getAllProducts            = product.getAllProducts;
export const getBrands                = product.getBrands;
export const getCategories            = product.getCategories;
export const getSubCategories         = product.getSubCategories;
export const getProductsByCategory    = product.getProductsByCategory;
export const getProductsByBrand       = product.getProductsByBrand;
export const getBrandProductCount      = product.getBrandProductCount;
export const getCategoryProductCount   = product.getCategoryProductCount;
export const getProductByItemId       = product.getProductByItemId;
