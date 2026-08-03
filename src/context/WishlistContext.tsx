import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { getWishlist } from '../api/wishlist';
import type { WishlistItemInterface } from '../api/interfaces';
import { getSessionGeneration } from '../utils/sessionGeneration';

interface WishlistState {
  wishlistMap: Map<number, number>;
  getWishlistCode: (inventoryId: number) => number | null;
  setWishlistCode: (inventoryId: number, wishlistCode: number | null) => void;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistState | null>(null);

// Module-level escape hatch so clearSession() (plain, non-component code) can
// reset the actual wishlistMap on logout — mirrors CartContext.js's
// cartCountSetter pattern for the same "React state, non-React caller"
// problem. Kept separate from wishlistCache.ts on purpose: wishlistCache only
// tracks a freshness timestamp, this only resets the Context-owned map.
let wishlistMapSetter: ((map: Map<number, number>) => void) | null = null;

export function resetWishlistMap(): void {
  if (wishlistMapSetter) wishlistMapSetter(new Map());
}

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistMap, setWishlistMap] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    wishlistMapSetter = setWishlistMap;
    return () => {
      // Only clear the registration if it's still this instance's setter —
      // guards against a stale cleanup from an earlier instance clobbering a
      // newer instance's registration if mount/unmount ordering ever changed.
      if (wishlistMapSetter === setWishlistMap) wishlistMapSetter = null;
    };
  }, []);

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
    // Captured before any await — if a logout (or another login) happens
    // while this request is in flight, the generation will have moved on by
    // the time the response comes back, and the write below is skipped.
    const requestGeneration = getSessionGeneration();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
    const profileCode: number | null = raw ? (JSON.parse(raw).CustomerProfileCode ?? null) : null;
    if (!profileCode) {
      if (requestGeneration !== getSessionGeneration()) return;
      setWishlistMap(new Map());
      return;
    }
    const res = await getWishlist(profileCode);
    if (requestGeneration !== getSessionGeneration()) return;
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
