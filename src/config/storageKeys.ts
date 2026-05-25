/**
 * Centralized AsyncStorage key registry.
 *
 * Every key used across the app must be declared here.
 * Never use bare string literals for storage access — import from this file.
 *
 * Integration note: when adding server-side session tokens, JWT refresh tokens,
 * or device IDs, add them here so all storage accesses are auditable in one place.
 */
export const STORAGE_KEYS = {
  /** Full user profile object returned by loginCustomer. Shape: LoggedInCustomerInterface. */
  userData: 'userData',
  /** Keychain service key for JWT access token. */
  authToken: 'authToken',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
