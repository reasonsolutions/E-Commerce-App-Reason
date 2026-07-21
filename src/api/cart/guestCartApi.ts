import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../config/storageKeys';
import type { VariantInterface } from '../interfaces';
import { effectivePurchaseLimit } from '../../utils/stock';

export interface GuestCartItem {
  inventoryId:  number;
  quantity:     number;
  price:        number;
  comparePrice: number;
  name:         string;
  brandName:    string;
  variant:      string;
  image:        string;
  organisationId: string;
  // Captured at add-to-cart time (ProductScreen still holds the full variant
  // then) — the guest cart is local AsyncStorage, so this is the only chance
  // to know the merchant's per-order limit / stock for this item.
  maxPerOrder?: number | null;
  stock?:       number | null;
  // Needed alongside stock: a Stock: 0 item can still be purchasable if the
  // merchant allows backorder — omitting this makes such items look sold out.
  backOrder?:   VariantInterface['BackOrder'];
}

export const getGuestCart = async (): Promise<GuestCartItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.guestCart);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addToGuestCart = async (item: GuestCartItem): Promise<GuestCartItem[]> => {
  const cart = await getGuestCart();
  const existing = cart.findIndex(i => i.inventoryId === item.inventoryId);
  let updated: GuestCartItem[];
  if (existing >= 0) {
    updated = cart.map((i, idx) => {
      if (idx !== existing) return i;
      // Combining two separate "add to cart" actions on the same item must
      // not silently exceed its per-order/stock limit — same class of bug as
      // the guest-to-server merge on login (Login.tsx).
      const combinedQty = i.quantity + item.quantity;
      const limit = i.maxPerOrder != null || i.stock != null
        ? effectivePurchaseLimit(i.maxPerOrder, i.stock, i.backOrder)
        : Infinity;
      return { ...i, quantity: Math.min(combinedQty, limit) };
    });
  } else {
    updated = [...cart, item];
  }
  await AsyncStorage.setItem(STORAGE_KEYS.guestCart, JSON.stringify(updated));
  return updated;
};

export const updateGuestCartItem = async (inventoryId: number, quantity: number): Promise<GuestCartItem[]> => {
  const cart = await getGuestCart();
  const updated = cart.map(i => i.inventoryId === inventoryId ? { ...i, quantity } : i);
  await AsyncStorage.setItem(STORAGE_KEYS.guestCart, JSON.stringify(updated));
  return updated;
};

export const removeFromGuestCart = async (inventoryId: number): Promise<GuestCartItem[]> => {
  const cart = await getGuestCart();
  const updated = cart.filter(i => i.inventoryId !== inventoryId);
  await AsyncStorage.setItem(STORAGE_KEYS.guestCart, JSON.stringify(updated));
  return updated;
};

export const clearGuestCart = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEYS.guestCart);
};
