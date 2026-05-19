import axios from 'axios';
import { API_BASE_URL } from '@env';
import { classifyError, apiLog } from './apiError';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'content-type': 'application/json',
  },
});

// ── Request interceptor ───────────────────────────────────────────────────────

axiosInstance.interceptors.request.use(
  config => {
    // TODO: Inject auth token here once the backend requires it.
    // Example:
    //   const token = await AsyncStorage.getItem(STORAGE_KEYS.authToken);
    //   if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  err => {
    // Request setup failures (e.g. bad config) — classify and forward.
    return Promise.reject(classifyError(err));
  },
);

// ── Response interceptor ──────────────────────────────────────────────────────

axiosInstance.interceptors.response.use(
  response => {
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
    // All HTTP / network / timeout errors flow here.
    // Classify into a structured ApiError and log in dev only.
    const classified = classifyError(err);
    apiLog(err?.config?.url ?? 'unknown endpoint', classified);
    return Promise.reject(classified);
  },
);

export default axiosInstance;
