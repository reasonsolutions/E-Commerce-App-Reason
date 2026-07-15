import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { getWishlist } from '../api/wishlist';
import type { WishlistItemInterface } from '../api/interfaces';

interface WishlistState {
  wishlistMap: Map<number, number>;
  getWishlistCode: (inventoryId: number) => number | null;
  setWishlistCode: (inventoryId: number, wishlistCode: number | null) => void;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistState | null>(null);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistMap, setWishlistMap] = useState<Map<number, number>>(new Map());

  const getWishlistCode = useCallback(
    (inventoryId: number) => wishlistMap.get(inventoryId) ?? null,
    [wishlistMap],
  );

  const setWishlistCode = useCallback((inventoryId: number, wishlistCode: number | null) => {
    setWishlistMap(prev => {
      const next = new Map(prev);
      if (wishlistCode === null) {
        next.delete(inventoryId);
      } else {
        next.set(inventoryId, wishlistCode);
      }
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
    const profileCode: number | null = raw ? (JSON.parse(raw).CustomerProfileCode ?? null) : null;
    if (!profileCode) {
      setWishlistMap(new Map());
      return;
    }
    const res = await getWishlist(profileCode);
    if (res?.statusCode === 1 && Array.isArray(res.result)) {
      const map = new Map<number, number>();
      for (const item of res.result as WishlistItemInterface[]) {
        if (item.InventoryID != null && item.WishlistCode != null) {
          map.set(item.InventoryID, item.WishlistCode);
        }
      }
      setWishlistMap(map);
    }
  }, []);

  const value = {
    wishlistMap,
    getWishlistCode,
    setWishlistCode,
    refresh,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistState => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
