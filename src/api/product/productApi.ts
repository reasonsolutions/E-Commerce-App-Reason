import axiosInstance from '../axiosInstance';
import { productEndpoints } from '../endpoints';
import type { ProductInterface } from '../interfaces';
import { ProductByCategoryProductDetails } from '../interfaces';

export const getAllProducts = async () => {
  const response = await axiosInstance.post(productEndpoints.allProducts, {
    brands: [],
    categories: [],
    subCategories: [],
    searchQuery: '%',
    priceRange: { from: null, to: null },
    discount: null,
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

export const getProductsByCategory = async (
  categoryId: number | string,
  pageNumber = 1,
  pageSize = 20,
): Promise<ProductByCategoryProductDetails[]> => {
  const response = await axiosInstance.post(productEndpoints.allProducts, {
    brands: [],
    categories: [Number(categoryId)],
    subCategories: [],
    searchQuery: '%',
    priceRange: { from: null, to: null },
    discount: null,
    pagination: { pageNumber, pageSize },
  });
  const products: ProductInterface[] = response.data?.result?.Products ?? [];

  return products.map(p => ({
    Item_Id:        p.ItemID,
    Name:           p.Name,
    Price:          p.MinPrice,
    ComparePrice:   p.MaxComparePrice,
    Description:    p.Description,
    SubCategory_Id: Number(p.SubcategoryID),
    Images:         p.Images,
    Date_Created:   p.CreatedDate,
    Brand_Id:       Number(p.BrandID),
    ApprovedBy:     null,
    ApprovedOn:     null,
    VendorID:       0,
    Brand_Name:     p.BrandName,
    Category_Id:    Number(p.CategoryID),
    CategoryName:   p.CategoryName,
    CategoryImage:  p.CategoryImage,
    SCName:         p.SCName,
    Inventory_Id:   p.Variants?.[0] ? Number(p.Variants[0].InventoryID) : 0,
    Variant:        p.Variants?.[0]?.Variant ?? '',
    Count:          p.Variants?.[0]?.Stock ?? 0,
    Date_Updated:   p.CreatedDate,
  }));
};

export const getProductsByBrand = async (
  brandId: number | string,
  pageNumber = 1,
  pageSize = 20,
): Promise<ProductByCategoryProductDetails[]> => {
  const response = await axiosInstance.post(productEndpoints.allProducts, {
    brands: [Number(brandId)],
    categories: [],
    subCategories: [],
    searchQuery: '%',
    priceRange: { from: null, to: null },
    discount: null,
    pagination: { pageNumber, pageSize },
  });
  const products: ProductInterface[] = response.data?.result?.Products ?? [];

  return products.map(p => ({
    Item_Id:        p.ItemID,
    Name:           p.Name,
    Price:          p.MinPrice,
    ComparePrice:   p.MaxComparePrice,
    Description:    p.Description,
    SubCategory_Id: Number(p.SubcategoryID),
    Images:         p.Images,
    Date_Created:   p.CreatedDate,
    Brand_Id:       Number(p.BrandID),
    ApprovedBy:     null,
    ApprovedOn:     null,
    VendorID:       0,
    Brand_Name:     p.BrandName,
    Category_Id:    Number(p.CategoryID),
    CategoryName:   p.CategoryName,
    CategoryImage:  p.CategoryImage,
    SCName:         p.SCName,
    Inventory_Id:   p.Variants?.[0] ? Number(p.Variants[0].InventoryID) : 0,
    Variant:        p.Variants?.[0]?.Variant ?? '',
    Count:          p.Variants?.[0]?.Stock ?? 0,
    Date_Updated:   p.CreatedDate,
  }));
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

export const getProductByItemId = async (itemId: number | string) => {
  const response = await axiosInstance.get(
    `${productEndpoints.getProductByItemId}?ItemId=${itemId}`,
  );
  return response.data;
};
