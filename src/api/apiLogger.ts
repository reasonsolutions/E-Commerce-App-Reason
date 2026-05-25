import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const MAX_PAYLOAD_LENGTH = 1000;

const SENSITIVE_KEYS = new Set([
  'token',
  'authorization',
  'accesstoken',
  'refreshtoken',
]);

// ── Timing metadata ───────────────────────────────────────────────────────────

export interface TimedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _startTime?: number;
  _logId?: number;
}

// ── Per-request store — holds request info until response arrives ─────────────
interface PendingLog {
  method: string;
  url: string;
  payload?: string;
}

let _nextId = 1;
const _pending = new Map<number, PendingLog>();

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

  const id = _nextId++;
  config._logId = id;

  const method = (config.method ?? 'GET').toUpperCase();
  const url = config.url ?? 'unknown';
  const body = config.data
    ? maskSensitive(typeof config.data === 'string' ? JSON.parse(config.data) : config.data)
    : undefined;
  const params = config.params
    ? maskSensitive(config.params)
    : undefined;

  const payloadStr = body
    ? truncate(body)
    : params
    ? truncate(params)
    : undefined;

  _pending.set(id, { method, url: shortUrl(url), payload: payloadStr });
}

// ── Response logger ───────────────────────────────────────────────────────────

export function logResponse(response: AxiosResponse): void {
  if (!__DEV__) return;

  const config = response.config as TimedAxiosRequestConfig;
  const id = config._logId;
  const pending = id != null ? _pending.get(id) : undefined;
  if (id != null) _pending.delete(id);

  const method = pending?.method ?? (config.method ?? 'GET').toUpperCase();
  const url = pending?.url ?? shortUrl(config.url);
  const duration = config._startTime ? `${Date.now() - config._startTime}ms` : '–';
  const status = response.status;

  console.log(
    `\n─────────────────────────────────────────\n` +
    `🚀  ${method} ${url}\n` +
    (pending?.payload ? `📤  Payload  : ${pending.payload}\n` : '') +
    `✅  Status   : ${status} · ${duration}\n` +
    `📥  Response : ${truncate(response.data)}\n` +
    `─────────────────────────────────────────`,
  );
}

// ── Error logger ──────────────────────────────────────────────────────────────

export function logError(error: unknown): void {
  if (!__DEV__) return;

  const err = error as any;
  const config = err?.config as TimedAxiosRequestConfig | undefined;
  const id = config?._logId;
  const pending = id != null ? _pending.get(id) : undefined;
  if (id != null) _pending.delete(id);

  const method = pending?.method ?? config?.method?.toUpperCase() ?? 'REQUEST';
  const url = pending?.url ?? shortUrl(config?.url);
  const status = err?.response?.status ?? 'NO_RESPONSE';
  const duration = config?._startTime ? `${Date.now() - config._startTime}ms` : '–';

  console.log(
    `\n─────────────────────────────────────────\n` +
    `🚀  ${method} ${url}\n` +
    (pending?.payload ? `📤  Payload  : ${pending.payload}\n` : '') +
    `❌  Status   : ${status} · ${duration}\n` +
    `💬  Message  : ${err?.message ?? 'unknown error'}\n` +
    (err?.response?.data ? `📥  Response : ${truncate(err.response.data)}\n` : '') +
    `─────────────────────────────────────────`,
  );
}
