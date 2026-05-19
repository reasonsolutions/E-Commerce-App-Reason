import { MOCK_DELAY_MS } from '../../config/env';
import { ok, mockWishlistItems, mockProducts } from '../mock/mockData';
import type { WishlistItemInterface } from '../interfaces';

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

let _wishlist = [...mockWishlistItems];
let _nextWishlistCode = 10;

export const getWishlist = async (_customerprofilecode: number) => delay(ok(_wishlist));

export const addToWishlist = async (customerprofilecode: number, inventory_id: number) => {
  const product = mockProducts.find(p => p.Variants?.[0]?.InventoryID === String(inventory_id));
  if (!product) return delay(ok(false, 'Product not found.'));
  const already = _wishlist.some(w => w.Inventory_Id === inventory_id);
  if (already) return delay(ok(true, 'Already in wishlist.'));
  const variant = product.Variants?.[0];
  const newItem: WishlistItemInterface = {
    WishlistItemCode:    _nextWishlistCode++,
    CustomerProfileCode: customerprofilecode,
    Inventory_Id:        inventory_id,
    Item_Id:             product.ItemID,
    Name:                product.Name,
    Images:              product.Images,
    Price:               variant?.PriceDetails.Price ?? product.MinPrice,
    ComparePrice:        variant?.PriceDetails.ComparePrice ?? product.MaxComparePrice,
    Variant:             variant?.Variant ?? '',
    Brand_Name:          product.BrandName,
    AddedDate:           new Date().toISOString(),
  };
  _wishlist = [..._wishlist, newItem];
  return delay(ok(true, 'Added to wishlist.'));
};

export const removeFromWishlist = async (_customerprofilecode: number, wishlistItemCode: number) => {
  _wishlist = _wishlist.filter(w => w.WishlistItemCode !== wishlistItemCode);
  return delay(ok(true, 'Removed from wishlist.'));
};
