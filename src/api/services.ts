/**
 * API service router.
 *
 * All exports are routed through a single `api` object selected by MOCK_MODE.
 * When MOCK_MODE is true  → every call hits the in-memory mock layer (mockIntegrations).
 * When MOCK_MODE is false → every call hits the real HTTP layer (integrations).
 *
 * Integration checklist before disabling MOCK_MODE:
 *   [ ] Confirm base URL is HTTPS and reachable from device
 *   [ ] Confirm ATS exception (iOS Info.plist) or cleartext flag (Android manifest) if still on HTTP
 *   [ ] Confirm wishlist endpoints are live (see TODO in integrations.ts)
 *   [ ] Confirm axiosInstance interceptors are wired for auth headers if required
 *   [ ] Run the app once in release mode and verify network calls in a proxy (Charles / mitmproxy)
 */
import { MOCK_MODE } from '../config/env';
import * as real from './integrations';
import * as mock from './mock/mockIntegrations';
import type { OrderHistoryItemInterface, OrderDetailResponseInterface } from './interfaces';

const api = MOCK_MODE ? mock : real;

// ─── Products ─────────────────────────────────────────────────────────────────
export const getAllProducts           = api.getAllProducts;
export const getBrands               = api.getBrands;
export const getCategories           = api.getCategories;
export const getSubCategories        = api.getSubCategories;
export const getProductsByCategory   = api.getProductsByCategory;
export const getProductsBySubCategory = api.getProductsBySubCategory;
export const selectProduct           = api.selectProduct;
export const searchProducts          = api.searchProducts;

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const getSavedCartItems   = api.getSavedCartItems;
export const postSaveCartItems   = api.postSaveCartItems;
export const postDeleteCartItem  = api.postDeleteCartItem;
export const quantityIncrement   = api.quantityIncrement;
export const quantityDecrement   = api.quantityDecrement;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const postCreateCustomer  = api.postCreateCustomer;
export const loginCustomer       = api.loginCustomer;

// ─── Addresses ────────────────────────────────────────────────────────────────
export const postCreateDeliveryAddress   = api.postCreateDeliveryAddress;
export const postDeleteDeliveryAddress   = api.postDeleteDeliveryAddress;
export const getDeliveryAddresses        = api.getDeliveryAddresses;
export const getDeliveryAddressForUpdate = api.getDeliveryAddressForUpdate;
export const postUpdateDeliveryAddress   = api.postUpdateDeliveryAddress;

// ─── Orders ───────────────────────────────────────────────────────────────────
export const postPlacedSingleOrder   = api.postPlacedSingleOrder;
export const postPlacedMultipleOrder = api.postPlacedMultipleOrder;

export async function postOrderHistory(customerProfileCode: number): Promise<OrderHistoryItemInterface[]> {
  const raw = await api.postOrderHistory(customerProfileCode);
  return raw.result?.OrdHistoryDetails ?? [];
}

export async function postCnfOrderDetail(
  orderNumber: string,
  customerProfileCode: number,
): Promise<OrderDetailResponseInterface> {
  const raw = await api.postCnfOrderDetail(orderNumber, customerProfileCode);
  return raw.result ?? { OrderDetails: [], DeliveryDetail: [] };
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────
// TODO: Real endpoints not yet finalized. See integrations.ts for stub signatures.
// In MOCK_MODE these call the in-memory mock layer.
// In production (MOCK_MODE=false) they will call integrations.ts, which currently
// throws — the real endpoint implementations must be added there before going live.
export const getWishlist        = api.getWishlist;
export const addToWishlist      = api.addToWishlist;
export const removeFromWishlist = api.removeFromWishlist;
