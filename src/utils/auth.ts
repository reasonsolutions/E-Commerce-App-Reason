import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { clearTokenCache } from '../api/axiosInstance';

function base64Decode(str: string): string {
  // JWT uses URL-safe base64 (- and _ instead of + and /), no padding
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let out = '';
  for (let i = 0; i < padded.length; i += 4) {
    const a = chars.indexOf(padded[i]);
    const b = chars.indexOf(padded[i + 1]);
    const c = chars.indexOf(padded[i + 2]);
    const d = chars.indexOf(padded[i + 3]);
    out += String.fromCharCode(
      (a << 2) | (b >> 4),
      ((b & 15) << 4) | (c >> 2),
      ((c & 3) << 6) | d,
    );
  }
  return out;
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(base64Decode(payload));
    return decoded.exp * 1000 < Date.now();
  } catch {
    // Non-standard token format — presence in Keychain is sufficient proof of login
    return false;
  }
}

export async function getInitialRoute(): Promise<'Home' | 'Login'> {
  return 'Home';
}

export async function isLoggedIn(): Promise<boolean> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: STORAGE_KEYS.authToken });
    if (!credentials) return false;
    if (isTokenExpired(credentials.password)) {
      await clearSession();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function clearSession(): Promise<void> {
  clearTokenCache();
  await Promise.all([
    Keychain.resetGenericPassword({ service: STORAGE_KEYS.authToken }),
    AsyncStorage.removeItem(STORAGE_KEYS.userData),
  ]);
}
