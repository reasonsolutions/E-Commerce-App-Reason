import axios from 'axios';
import { API_BASE_URL } from '@env';
import * as Keychain from 'react-native-keychain';
import { classifyError, apiLog } from './apiError';
import { logRequest, logResponse, logError, TimedAxiosRequestConfig } from './apiLogger';
import { STORAGE_KEYS } from '../config/storageKeys';
import { clearSession } from '../utils/auth';
import { resetToLogin } from '../utils/navigationService';
import { authEndpoints } from './endpoints';

// In-memory token cache — avoids a Keychain read (~100-300ms) on every request.
// Primed by setTokenCache() after login, cleared by clearTokenCache() on logout.
let _cachedToken: string | null = null;
// Prevents multiple concurrent requests from each triggering their own refresh.
let _refreshPromise: Promise<string | null> | null = null;

export function setTokenCache(token: string): void {
  _cachedToken = token;
}

export function clearTokenCache(): void {
  _cachedToken = null;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const creds = await Keychain.getGenericPassword({ service: STORAGE_KEYS.refreshToken });
    if (!creds) return null;
    const response = await axios.get(`${API_BASE_URL}${authEndpoints.getEcommAccessToken}`, {
      headers: { Authorization: `Bearer ${creds.password}` },
    });
    const data = response.data;
    if (data?.statusCode !== 1 || !data?.result?.AccessToken) return null;
    const newToken: string = data.result.AccessToken;
    _cachedToken = newToken;
    await Keychain.setGenericPassword('token', newToken, {
      service: STORAGE_KEYS.authToken,
      securityLevel: Keychain.SECURITY_LEVEL.ANY,
    });
    return newToken;
  } catch {
    return null;
  }
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'content-type': 'application/json',
  },
});

// ── Request interceptor ───────────────────────────────────────────────────────

axiosInstance.interceptors.request.use(
  async config => {
    (config as TimedAxiosRequestConfig)._startTime = Date.now();
    logRequest(config as TimedAxiosRequestConfig);
    const isAuthEndpoint = config.url?.startsWith('token/') ||
      config.url?.includes('postCreateCustomer') ||
      config.url?.includes('postConfirmCustomer');
    if (!isAuthEndpoint) {
      if (_cachedToken) {
        config.headers.Authorization = `Bearer ${_cachedToken}`;
      } else {
        const credentials = await Keychain.getGenericPassword({ service: STORAGE_KEYS.authToken });
        if (credentials) {
          _cachedToken = credentials.password;
          config.headers.Authorization = `Bearer ${credentials.password}`;
        } else {
        }
      }
    }
    return config;
  },
  err => {
    logError(err);
    return Promise.reject(classifyError(err));
  },
);

// ── Response interceptor ──────────────────────────────────────────────────────

axiosInstance.interceptors.response.use(
  response => {
    logResponse(response);
    // Successful HTTP response — return data as-is so all existing callers
    // that read response.data continue to work without changes.
    //
    // Uncomment to auto-raise application-level failures (statusCode !== 1)
    // before the response reaches the screen:
    //
    //   import { applicationError } from './apiError';
    //   const envelope = response.data;
    //   if (envelope && typeof envelope.statusCode === 'number' && envelope.statusCode !== 1) {
    //     return Promise.reject(applicationError(envelope));
    //   }
    //
    return response;
  },
  async err => {
    logError(err);
    const config = err?.config;
    const is401 = err?.response?.status === 401;
    const isRefreshEndpoint = config?.url?.includes('getEcommAccessToken');

    if (is401 && !isRefreshEndpoint && !config?._retried) {
      config._retried = true;
      if (!_refreshPromise) {
        _refreshPromise = refreshAccessToken().finally(() => { _refreshPromise = null; });
      }
      const newToken = await _refreshPromise;
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance.request(config);
      }
      await clearSession();
      resetToLogin();
      const classified = classifyError(err);
      apiLog(config?.url ?? 'unknown endpoint', classified);
      return Promise.reject(classified);
    }

    if (is401) {
      await clearSession();
      resetToLogin();
    }
    const classified = classifyError(err);
    apiLog(config?.url ?? 'unknown endpoint', classified);
    return Promise.reject(classified);
  },
);

export default axiosInstance;
