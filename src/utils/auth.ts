import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { clearTokenCache } from '../api/axiosInstance';
import { wishlistCache } from './wishlistCache';
import { resetCartCount } from '../context/CartContext';
import { resetWishlistMap } from '../context/WishlistContext';
import { clearHomeCache } from './homeCache';
import { clearHomeScreenCache } from '../screens/homeScreenCache';
import { clearResultScreenCache } from '../screens/resultScreenCache';
import { bumpSessionGeneration } from './sessionGeneration';

export async function getInitialRoute(): Promise<'MainTabs'> {
  return 'MainTabs';
}

export async function isLoggedIn(): Promise<boolean> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: STORAGE_KEYS.authToken });
    return !!credentials;
  } catch {
    return false;
  }
}

export async function clearSession(): Promise<void> {
  // 1. Invalidate the active session generation first — any request already
  // in flight (Home fetches, wishlist refresh) captured the previous
  // generation before it started, so as soon as this line runs, their
  // eventual shared-cache/Context writes are rejected on arrival, regardless
  // of how long clearSession() itself takes to finish below.
  bumpSessionGeneration();

  // 2. Clear user Context state and in-memory caches.
  wishlistCache.invalidate();
  resetWishlistMap();
  resetCartCount();
  clearHomeCache();
  clearHomeScreenCache();
  clearResultScreenCache();

  // 3. Clear tokens and persistent active-session data.
  clearTokenCache();
  await Promise.all([
    Keychain.resetGenericPassword({ service: STORAGE_KEYS.authToken }),
    Keychain.resetGenericPassword({ service: STORAGE_KEYS.refreshToken }),
    AsyncStorage.removeItem(STORAGE_KEYS.userData),
  ]);
}
