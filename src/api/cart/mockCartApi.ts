import { MOCK_DELAY_MS } from '../../config/env';
import type { PostCartSaveInterface } from '../interfaces';
import { ok, mockCartItems, mockProducts } from '../mock/mockData';

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

let _cartItems = [...mockCartItems];
let _nextCartDetailsCode = 400;

export const getSavedCartItems = async (_customerprofilecode: number) =>
  delay(ok(_cartItems));

export const postSaveCartItems = async (data: PostCartSaveInterface) => {
  const existing = _cartItems.find(item => item.InventoryId === data.InventoryId);

  if (existing) {
    _cartItems = _cartItems.map(item =>
      item.InventoryId === data.InventoryId
        ? { ...item, Quantity: item.Quantity + data.Quantity }
        : item,
    );
  } else {
    const product = mockProducts.find(p => p.Variants?.[0]?.InventoryID === String(data.InventoryId));
    if (product) {
      const variant = product.Variants?.[0];
      _cartItems = [
        ..._cartItems,
        {
          CartDetailsCode: _nextCartDetailsCode++,
          CartMasterCode:  159,
          InventoryId:     data.InventoryId,
          Quantity:        data.Quantity,
          IsPurchased:     false,
          Images:          product.Images,
          Name:            product.Name,
          Price:           variant?.PriceDetails.Price ?? product.MinPrice,
          PriceDetails:    { Price: variant?.PriceDetails.Price ?? product.MinPrice, ComparePrice: variant?.PriceDetails.ComparePrice ?? product.MaxComparePrice },
          Count:           variant?.Stock ?? 0,
          Variant:         variant?.Variant ?? '',
          BrandName:       product.BrandName,
        },
      ];
    }
  }
  return delay(ok(true, 'Item added to cart.'));
};

export const postDeleteCartItem = async (cartdetailscode: number) => {
  _cartItems = _cartItems.filter(item => item.CartDetailsCode !== cartdetailscode);
  return delay(ok(true, 'Cart item deleted.'));
};

export const quantityIncrement = async (cartdetailscode: number, _inventory_id: number) => {
  _cartItems = _cartItems.map(item =>
    item.CartDetailsCode === cartdetailscode
      ? { ...item, Quantity: item.Quantity + 1 }
      : item,
  );
  return delay(ok(true));
};

export const quantityDecrement = async (cartdetailscode: number, _inventory_id: number) => {
  _cartItems = _cartItems.map(item =>
    item.CartDetailsCode === cartdetailscode && item.Quantity > 1
      ? { ...item, Quantity: item.Quantity - 1 }
      : item,
  );
  return delay(ok(true));
};
