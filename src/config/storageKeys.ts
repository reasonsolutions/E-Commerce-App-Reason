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
  /** Keychain service key for JWT refresh token. */
  refreshToken: 'refreshToken',
  /** Recent search terms — JSON array of strings, max 8 entries. */
  recentSearches: 'recentSearches',
  /** Guest cart — JSON array of GuestCartItem, cleared after login merge. */
  guestCart: 'guestCart',
  /** Recently viewed products — JSON array of ProductInterface snapshots, max 8, newest-first. */
  recentlyViewed: 'recentlyViewed',
  /** Order ID from placeOrder — used by PaymentScreen to initialise MIPS payment zone. */
  orderId: 'orderId',
  /** Set to '1' after a user's first wishlist fetch returns empty — distinguishes FTU from returning empty. */
  wishlistSeen: 'wishlist_seen',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Returns a user-scoped AsyncStorage key for data that must not bleed between
 * accounts on a shared device (recently viewed, recent searches).
 *
 * Logged-in:  `recentlyViewed_100094`
 * Guest:      `recentlyViewed_guest`
 */
export function scopedKey(
  base: 'recentlyViewed' | 'recentSearches' | 'wishlistSeen',
  profileCode: number | null | undefined,
): string {
  return `${STORAGE_KEYS[base]}_${profileCode ?? 'guest'}`;
}
