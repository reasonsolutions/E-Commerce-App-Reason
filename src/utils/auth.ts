import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { clearTokenCache } from '../api/axiosInstance';
import { wishlistCache } from './wishlistCache';

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
  clearTokenCache();
  wishlistCache.invalidate();
  await Promise.all([
    Keychain.resetGenericPassword({ service: STORAGE_KEYS.authToken }),
    Keychain.resetGenericPassword({ service: STORAGE_KEYS.refreshToken }),
    AsyncStorage.removeItem(STORAGE_KEYS.userData),
  ]);
}
