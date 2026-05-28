import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { clearTokenCache } from '../api/axiosInstance';

function base64Decode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const padded = str + '==='.slice((str.length + 3) % 4);
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
    return true;
  }
}

export async function getInitialRoute(): Promise<'Home' | 'Login'> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: STORAGE_KEYS.authToken });
    if (!credentials) return 'Login';
    if (isTokenExpired(credentials.password)) {
      await clearSession();
      return 'Login';
    }
    return 'Home';
  } catch {
    return 'Login';
  }
}

export async function clearSession(): Promise<void> {
  clearTokenCache();
  await Promise.all([
    Keychain.resetGenericPassword({ service: STORAGE_KEYS.authToken }),
    AsyncStorage.removeItem(STORAGE_KEYS.userData),
  ]);
}
