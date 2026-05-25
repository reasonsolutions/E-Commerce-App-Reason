import axios from 'axios';
import { API_BASE_URL } from '@env';
import * as Keychain from 'react-native-keychain';
import { classifyError, apiLog } from './apiError';
import { logRequest, logResponse, logError, TimedAxiosRequestConfig } from './apiLogger';
import { STORAGE_KEYS } from '../config/storageKeys';

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
      const credentials = await Keychain.getGenericPassword({ service: STORAGE_KEYS.authToken });
      if (credentials) {
        config.headers.Authorization = `Bearer ${credentials.password}`;
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
    // TODO: When screens migrate to centralized error handling, uncomment the
    // block below to auto-raise application-level failures (statusCode !== 1)
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
  err => {
    logError(err);
    // All HTTP / network / timeout errors flow here.
    // Classify into a structured ApiError and log in dev only.
    const classified = classifyError(err);
    apiLog(err?.config?.url ?? 'unknown endpoint', classified);
    return Promise.reject(classified);
  },
);

export default axiosInstance;
