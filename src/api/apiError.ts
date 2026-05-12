/**
 * Normalized API error infrastructure.
 *
 * All axios errors are classified into one of four kinds so screens can branch
 * on kind rather than inspecting raw axios internals. The error object is a
 * plain class that extends Error, so it works with instanceof and serializes
 * cleanly for logging.
 *
 * Usage in screens (future migration):
 *   import { isApiError, userFacingMessage } from '../api/apiError';
 *   catch (err) {
 *     if (isApiError(err)) setErrorMsg(userFacingMessage(err));
 *   }
 */

import axios, { AxiosError, AxiosResponse } from 'axios';
import { MOCK_MODE } from '../config/env';

// ── Error kinds ───────────────────────────────────────────────────────────────

export type ApiErrorKind =
  | 'timeout'      // Request exceeded the configured timeout
  | 'network'      // No response received (offline, DNS failure, refused)
  | 'server'       // HTTP 4xx / 5xx with a response body
  | 'application'; // HTTP 200 but statusCode !== 1 in the API envelope

// ── Normalized error class ────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status code, present only for 'server' errors. */
  readonly httpStatus?: number;
  /** Raw server envelope, present for 'server' and 'application' errors. */
  readonly responseData?: unknown;
  /** Human-readable message safe to show in the UI. */
  readonly userMessage: string;

  constructor(opts: {
    kind: ApiErrorKind;
    message: string;
    userMessage: string;
    httpStatus?: number;
    responseData?: unknown;
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.kind = opts.kind;
    this.httpStatus = opts.httpStatus;
    this.responseData = opts.responseData;
    this.userMessage = opts.userMessage;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

// ── Classifier ────────────────────────────────────────────────────────────────

/**
 * Converts any caught value into an ApiError.
 * Call this inside catch blocks or the axios error interceptor.
 */
export function classifyError(err: unknown): ApiError {
  if (isApiError(err)) return err;

  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError;

    // Timeout
    if (axiosErr.code === 'ECONNABORTED' || axiosErr.message?.includes('timeout')) {
      return new ApiError({
        kind: 'timeout',
        message: `Request timed out: ${axiosErr.config?.url ?? 'unknown'}`,
        userMessage: 'The request took too long. Please check your connection and try again.',
      });
    }

    // No response — offline or network unreachable
    if (!axiosErr.response) {
      return new ApiError({
        kind: 'network',
        message: `Network error: ${axiosErr.message}`,
        userMessage: 'Unable to connect. Please check your internet connection.',
      });
    }

    // HTTP error response
    const { status, data } = axiosErr.response as AxiosResponse;
    const serverMsg =
      (data as any)?.userMessage ||
      (data as any)?.message ||
      `HTTP ${status}`;

    return new ApiError({
      kind: 'server',
      message: `Server error ${status}: ${serverMsg}`,
      userMessage: status >= 500
        ? 'Something went wrong on our end. Please try again later.'
        : serverMsg,
      httpStatus: status,
      responseData: data,
    });
  }

  // Non-axios error (e.g. JSON.parse failure, programming error)
  const message = err instanceof Error ? err.message : String(err);
  return new ApiError({
    kind: 'application',
    message,
    userMessage: 'An unexpected error occurred. Please try again.',
    responseData: err,
  });
}

/**
 * Wraps an application-level failure: HTTP 200 but statusCode !== 1 in the
 * API envelope. Screens can use this when they check `response.statusCode`.
 *
 * TODO: Once screens migrate to the interceptor layer, the response interceptor
 * can raise this automatically for every envelope failure, eliminating the
 * per-screen statusCode check.
 */
export function applicationError(responseData: unknown, fallback?: string): ApiError {
  const msg =
    (responseData as any)?.userMessage ||
    fallback ||
    'The server returned an unexpected response.';
  return new ApiError({
    kind: 'application',
    message: msg,
    userMessage: msg,
    responseData,
  });
}

// ── User-facing message extractor ─────────────────────────────────────────────

/**
 * Returns the safest string to show the user for any caught value.
 * Falls back gracefully for plain Error objects or unknown throws.
 */
export function userFacingMessage(err: unknown): string {
  if (isApiError(err)) return err.userMessage;
  if (err instanceof Error) return 'Something went wrong. Please try again.';
  return 'An unexpected error occurred.';
}

// ── Safe logger ───────────────────────────────────────────────────────────────

/**
 * Logs only in dev builds. In production this is a no-op, so sensitive stack
 * traces and URLs never reach the console (or log aggregators via RN's
 * console bridge).
 *
 * TODO: Replace the __DEV__ branch with a structured logger (Sentry, Datadog)
 * once an error-tracking SDK is integrated. Example:
 *   Sentry.captureException(err, { extra: { context } });
 */
export function apiLog(context: string, err: unknown): void {
  if (!MOCK_MODE && !__DEV__) return;

  if (isApiError(err)) {
    console.warn(`[API:${err.kind.toUpperCase()}] ${context} — ${err.message}`);
  } else {
    console.warn(`[API:UNKNOWN] ${context}`, err);
  }
}
