import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../config/storageKeys';

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
    updated = cart.map((i, idx) =>
      idx === existing ? { ...i, quantity: i.quantity + item.quantity } : i,
    );
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
