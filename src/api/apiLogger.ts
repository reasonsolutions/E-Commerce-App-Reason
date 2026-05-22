import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const MAX_PAYLOAD_LENGTH = 1000;

const SENSITIVE_KEYS = new Set([
  'token',
  'password',
  'authorization',
  'otp',
  'accesstoken',
  'refreshtoken',
]);

// ── Timing metadata ───────────────────────────────────────────────────────────

export interface TimedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _startTime?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskSensitive(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '••••••' : value;
  }
  return result;
}

function truncate(value: unknown): string {
  const str = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  if (!str || str.length <= MAX_PAYLOAD_LENGTH) return str ?? '';
  return str.slice(0, MAX_PAYLOAD_LENGTH) + `\n… [truncated ${str.length - MAX_PAYLOAD_LENGTH} chars]`;
}

function shortUrl(url: string | undefined): string {
  if (!url) return 'unknown';
  const match = url.match(/^https?:\/\/[^/]+(\/.*)?$/);
  return match ? (match[1] || '/') : url;
}

// ── Request logger ────────────────────────────────────────────────────────────

export function logRequest(config: TimedAxiosRequestConfig): void {
  if (!__DEV__) return;

  const method = (config.method ?? 'GET').toUpperCase();
  const url = config.url ?? 'unknown';
  const params = config.params;
  const body = config.data
    ? maskSensitive(typeof config.data === 'string' ? JSON.parse(config.data) : config.data)
    : undefined;

  console.group?.(`🚀 [API] ${method} ${shortUrl(url)}`);
  console.log('URL     :', url);
  if (params) console.log('Params  :', truncate(maskSensitive(params)));
  if (body)   console.log('Body    :', truncate(body));
  console.groupEnd?.();
}

// ── Response logger ───────────────────────────────────────────────────────────

export function logResponse(response: AxiosResponse): void {
  if (!__DEV__) return;

  const config = response.config as TimedAxiosRequestConfig;
  const method = (config.method ?? 'GET').toUpperCase();
  const url = config.url ?? 'unknown';
  const status = response.status;
  const duration = config._startTime ? `${Date.now() - config._startTime}ms` : '–';

  console.group?.(`✅ [API] ${method} ${shortUrl(url)} · ${status} · ${duration}`);
  console.log('Status  :', status, response.statusText);
  console.log('Time    :', duration);
  console.log('Response:', truncate(response.data));
  console.groupEnd?.();
}

// ── Error logger ──────────────────────────────────────────────────────────────

export function logError(error: unknown): void {
  if (!__DEV__) return;

  const err = error as any;
  const config = err?.config as TimedAxiosRequestConfig | undefined;
  const method = config?.method?.toUpperCase() ?? 'REQUEST';
  const url = config?.url ?? 'unknown';
  const status = err?.response?.status ?? 'NO_RESPONSE';
  const duration = config?._startTime ? `${Date.now() - config._startTime}ms` : '–';

  console.group?.(`❌ [API] ${method} ${shortUrl(url)} · ${status} · ${duration}`);
  console.log('Status  :', status);
  console.log('Time    :', duration);
  console.log('Message :', err?.message ?? 'unknown error');
  if (err?.response?.data) console.log('Body    :', truncate(err.response.data));
  console.groupEnd?.();
}
