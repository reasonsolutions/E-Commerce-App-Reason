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
  const existing = _cartItems.find(item => item.Inventory_Id === data.Inventory_Id);

  if (existing) {
    _cartItems = _cartItems.map(item =>
      item.Inventory_Id === data.Inventory_Id
        ? { ...item, Quantity: item.Quantity + data.Quantity }
        : item,
    );
  } else {
    const product = mockProducts.find(p => p.Variants?.[0]?.InventoryID === String(data.Inventory_Id));
    if (product) {
      const variant = product.Variants?.[0];
      _cartItems = [
        ..._cartItems,
        {
          CartDetailsCode: _nextCartDetailsCode++,
          CartMasterCode:  159,
          Inventory_Id:    data.Inventory_Id,
          Quantity:        data.Quantity,
          Images:          product.Images,
          Name:            product.Name,
          Price:           variant?.PriceDetails.Price ?? product.MinPrice,
          ComparePrice:    variant?.PriceDetails.ComparePrice ?? product.MaxComparePrice,
          Count:           variant?.Stock ?? 0,
          Variant:         variant?.Variant ?? '',
          Brand_Name:      product.BrandName,
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
