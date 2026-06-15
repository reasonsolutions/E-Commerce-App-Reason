# Project Modernization Audit — E-Commerce React Native App

**Last updated:** 2026-06-11 (rev 3)
**Branch:** `dev` (canonical)
**TypeScript status:** 0 errors, clean compile

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack](#2-tech-stack)
3. [Current Project Structure](#3-current-project-structure)
4. [API Layer](#4-api-layer)
5. [Design System](#5-design-system)
6. [Component Library](#6-component-library)
7. [Established Patterns](#7-established-patterns)
8. [Architecture Decisions](#8-architecture-decisions)
9. [Known Technical Debt](#9-known-technical-debt)
10. [Screen Status](#10-screen-status)
11. [Live API Integration](#11-live-api-integration)
12. [NativeWind + Primitives Layer](#12-nativewind--primitives-layer)
13. [Reactotron Setup](#13-reactotron-setup)
14. [Repository and Branch Strategy](#14-repository-and-branch-strategy)
15. [Cart Architecture](#15-cart-architecture)
16. [Premium UX Refinement — Frozen Patterns (Phase 2)](#16-premium-ux-refinement--frozen-patterns-phase-2)

---

## 1. Executive Summary

This document is the canonical engineering reference for the E-Commerce React Native app. It reflects the current architecture as-built. Historical migration narrative has been removed — this is an onboarding and reference document, not a change log.

The app is a React Native e-commerce client (iOS + Android) supporting: product browsing, category/search results, product detail, cart, checkout with address management, order history, order detail, wishlist, profile, registration, and OTP verification. Authentication is username/password with JWT stored in Keychain; session validity is checked at startup to determine the initial route.

**Current state:**
- Feature/domain-organized API layer — all domains fully on real APIs including `postCnfOrderDetail` and `cancelOrder`.
- Auth token injection fully implemented — Keychain-backed Bearer token on all non-auth requests, with in-memory cache to avoid repeated Keychain reads.
- Refresh token flow implemented — 401 → `token/getEcommAccessToken` → retry. Concurrent 401s deduplicated. Both tokens cleared on logout/failed refresh.
- `getInitialRoute()` always returns `'Home'` — token expiry handled reactively via 401, no clock-based checks.
- Design token system, shared UI and system component library, premium motion vocabulary.
- NativeWind v4 + semantic primitives layer for new component work.
- Gluestack overlay stack abandoned; local component ownership adopted.
- `useAsyncState` cancellation-safe async hook across all data-fetching screens.
- Server-authoritative cart badge via `CartContext`.
- Phase 3 redesign complete: all 14 screens done. Frozen reference screens: Login, HomeScreen, ProductScreen, OrderSuccessScreen, CartScreen.
- Cancel order flow implemented and confirmed working — `SubOrder: { Code, Number }` from `getOrderStatus`, cancel payload uses `SubOrder.Code`. Success shown via styled `Modal` (not native Alert).
- Order detail tracking timeline — `Events` array from `getOrderStatus` rendered as vertical spine timeline.
- Order detail payment summary — `PaymentInfo` from `getOrderStatus` rendered (amount paid, discount, delivery, coupon, total).
- Order history re-fetches on every focus — stale status after cancel resolved.
- Full enum library in `src/config/enum_files/` — 27 enums matching backend `Enums.cs`. `OrderStatusCode` defined in `enum_files/OrderStatus.ts`, re-exported from `interfaces.ts`.
- COD payment method on `AddressScreen` — payment picker (Card / Cash on Delivery) in footer. COD calls `placeOrder` directly with `PaymentModes.CashOnDelivery` → `OrderSuccess`. Card proceeds to MIPS as before.
- `AddressScreen` `submitting` state split into `savingAddress` (add address form) and `orderSubmitting` (place order CTA) — were incorrectly shared.
- `OrderProgressBar` component added — segmented 6-step bar (Placed → Delivered) with ember active step. Shown inline on active order cards in `OrderHistoryScreen` and inside `StatusHero` on `OrderDetailScreen`.
- `orderStatus.ts` extended with `ORDER_STATUS_LABELS` record (customer-facing display copy per status code) alongside the existing `orderStatusLabel()` function.
- State experience sprint complete — `SkeletonGrid`, `TrustLine` components added; `EmptyState` gains `trustLine` prop; `ErrorState` wired to HomeScreen, ResultScreen, SearchScreen; dual empty states (filter vs. collection) on ResultScreen; FTU state on WishlistScreen and SearchScreen; AddressScreen empty state separated from form; all skeleton states break correctly on API error or empty response.
- User-scoped AsyncStorage keys — `scopedKey()` utility in `storageKeys.ts` scopes `recentlyViewed`, `recentSearches`, `wishlistSeen` per `CustomerProfileCode` (or `_guest`). Prevents data bleeding between accounts on a shared device.
- Header consistency — `AddressScreen` and `AddressManagementScreen` migrated from dark editorial header to light surface header matching WishlistScreen/CartScreen.
- HomeScreen fetch loop fixed — `useFocusEffect` dep array no longer includes `products`/`categories`/`brands`; `fetchInitiated` ref prevents re-firing on state changes. All three fetch functions now guard against `statusCode !== 1` responses and return `[]` instead of `undefined`, preventing indefinite skeleton states.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native 0.81.4 |
| Language | TypeScript 5.8.3 (mixed with JS in legacy files — do not add TS to JS files unless explicitly requested) |
| Navigation | React Navigation v7 (Stack) |
| HTTP | Axios — `src/api/axiosInstance.ts`, base URL from `.env` via `react-native-dotenv` |
| State | Context API + useState (local), AsyncStorage (auth), server-authoritative cart count |
| Styling | StyleSheet.create() + design tokens (primary). NativeWind v4 primitives available. |
| Icons | react-native-vector-icons |
| Animations | Animated API (`useEntrance`, `useTactile`), react-native-reanimated v4, lottie-react-native |
| Overlays | @gorhom/bottom-sheet v5 (Reanimated-native, gesture-native) |
| Dev tooling | Reactotron (`src/config/reactotron.ts`) |
| Testing | Jest 29 with React Native preset |

---

## 3. Current Project Structure

```
/
├── App.tsx                          — Root: SafeAreaProvider, CartProvider, AppNavigator
├── index.js                         — Entry point: AppRegistry, Reactotron import
├── .env                             — API_BASE_URL=http://122.175.15.28:8110/api/ecomm/
├── babel.config.js                  — nativewind/babel preset, react-native-dotenv plugin
├── tailwind.config.js               — NativeWind config, mirrors token system
└── src/
    ├── api/
    │   ├── axiosInstance.ts         — Axios base URL from @env; Keychain-backed Bearer token injection; interceptors
    │   ├── endpoints.ts             — as const typed endpoint constants (per domain)
    │   ├── interfaces.ts            — All TypeScript interfaces + DTO types
    │   ├── apiError.ts              — Error classification hierarchy
    │   ├── apiLogger.ts             — Request/response/timing logger (dev only)
    │   ├── product/
    │   │   ├── index.ts             — Router: product always real (false ? mock : real). Re-exports getOrgIdForInventory.
    │   │   ├── productApi.ts        — Real HTTP implementations. Caches OrganisationID per InventoryID in module-level Map.
    │   │   └── mockProductApi.ts    — Mock implementations
    │   ├── cart/
    │   │   ├── index.ts             — Always real (mock import removed)
    │   │   ├── cartApi.ts
    │   │   └── mockCartApi.ts
    │   ├── wishlist/
    │   │   ├── index.ts             — Always real
    │   │   ├── wishlistApi.ts
    │   │   └── mockWishlistApi.ts
    │   ├── order/
    │   │   ├── index.ts             — placeOrder/postOrderHistory = real; postCnfOrderDetail = mock
    │   │   ├── orderApi.ts
    │   │   └── mockOrderApi.ts
    │   ├── address/
    │   │   ├── index.ts             — Always real
    │   │   ├── addressApi.ts
    │   │   └── mockAddressApi.ts
    │   ├── auth/
    │   │   ├── index.ts             — Always real
    │   │   ├── authApi.ts
    │   │   └── mockAuthApi.ts
    │   └── mock/
    │       └── mockData.ts          — Shared in-memory dataset for all mock domains
    ├── components/
    │   ├── primitives/              — NativeWind-ready RN wrappers (Box, Text, VStack, etc.)
    │   ├── gluestack/               — Local overrides replacing broken Gluestack packages
    │   │   ├── Actionsheet.tsx      — @gorhom/bottom-sheet implementation
    │   │   └── provider.tsx
    │   ├── ui/                      — Presentational components (no side effects)
    │   ├── system/                  — Application-state components (ErrorState, etc.)
    │   ├── ProductCard.tsx
    │   └── CategoryItem.tsx
    ├── config/
    │   ├── env.ts                   — MOCK_MODE = __DEV__, MOCK_DELAY_MS
    │   ├── storageKeys.ts           — Typed STORAGE_KEYS constant + scopedKey(base, profileCode) utility for per-user namespacing
    │   └── reactotron.ts            — Dev-only Reactotron configuration
    ├── constants/
    │   └── storage.ts               — Re-export shim (backward compat — still exists)
    ├── context/
    │   └── CartContext.js           — cartCount integer + setCartCount only
    ├── data/
    │   └── mockData.js              — Legacy mock (heroBanner still used by HomeScreen)
    ├── hooks/
    │   ├── useAsyncState.ts         — Cancellation-safe async state hook
    │   ├── useEntrance.ts           — Shared entrance animation hook
    │   ├── useHaptic.ts             — Haptic feedback wrapper
    │   ├── useTactile.ts            — Press-scale animator
    │   ├── useSession.ts            — AsyncStorage session read → LoggedInCustomerInterface | null
    │   ├── useProfileCode.ts        — Reads CustomerProfileCode from AsyncStorage → number | null
    │   ├── useProductImage.ts       — Resolves Unsplash image URI for a product query (with AsyncStorage cache + fallback chain)
    │   └── useAppToast.ts           — Toast notification hook
    ├── navigation/
    │   └── AppNavigator.js          — Stack navigator, 14 routes, initial route via getInitialRoute()
    ├── screens/                     — 14 screens
    ├── stubs/                       — CommonJS stubs for incompatible ESM packages
    │   ├── gluestack-overlay.js     — Stub for @gluestack-ui/overlay
    │   ├── react-dom.js             — Empty stub to prevent web dep bundle
    │   └── react-transition-group.js
    ├── theme/
    │   ├── tokens.ts                — Colors, Space, Radius, FontSize, FontWeight, Shadow, ZIndex
    │   ├── typography.ts            — Type.* preset system
    │   ├── fonts.ts                 — FontFamily constants (serif/mono/sans)
    │   ├── motion.ts                — Motion vocabulary (Tap/Settle/Carry)
    │   └── index.ts                 — Re-export barrel
    ├── types/
    │   └── env.d.ts                 — declare module '@env' { API_BASE_URL, UNSPLASH_ACCESS_KEY }
    └── utils/
        ├── auth.ts                  — getInitialRoute() (JWT expiry check) + clearSession()
        ├── formatDate.ts            — ISO date → display string
        ├── orderStatus.ts           — orderStatusLabel() (code → OrderStatus string) + ORDER_STATUS_LABELS (code → customer-facing display copy)
        ├── resolveImageUrl.ts       — Prepends base URL to relative API image paths; fallbackImageUrl() for picsum
        ├── toastEmitter.ts          — Pub/sub event emitter for ToastOverlay
        └── unsplashImage.ts         — Unsplash API wrapper with AsyncStorage cache
```

---

## 4. API Layer

### 4.1 Domain-organized structure

The API is organized by feature domain. There is no central `services.ts` — each domain folder owns its real implementation, mock implementation, and mock/real router.

**Screens import directly from the domain:**
```typescript
import { getAllProducts, getCategories } from '../api/product';
import { getSavedCartItems, postSaveCartItems } from '../api/cart';
import { postOrderHistory } from '../api/order';
```

Never import from an implementation file (`productApi.ts`, `mockProductApi.ts`) directly — always import from the domain's `index.ts` barrel.

### 4.2 Domain real API status

All domains except order detail are on the real API:

| Domain | Status | Notes |
|---|---|---|
| `product` | **Real** | All functions. Also re-exports `getOrgIdForInventory`. |
| `auth` | **Real** | All functions: `loginCustomer`, `postCreateCustomer`, `postConfirmCustomer`, `postUpdateCustomer` |
| `cart` | **Real** | All functions |
| `address` | **Real** | All functions |
| `wishlist` | **Real** | All functions |
| `order` | **Real** | All functions real: `placeOrder`, `postPlacedMultipleOrder`, `postOrderHistory`, `postCnfOrderDetail`, `cancelOrder`. `order/index.ts` normalises field name casing (`InventoryID` → `Inventory_Id`, `ItemID` → `Item_Id`, `SubOrderNumber`, `BrandName` → `Brand_Name`, `PaymentInfo`) from `getOrderStatus` response. |

`MOCK_MODE` in `src/config/env.ts` is `__DEV__` but no longer gates any domain — all domains bypass it. The constant remains for `MOCK_DELAY_MS` usage in mock implementations.

### 4.3 Environment variables

- `.env` at project root: `API_BASE_URL`, `UNSPLASH_ACCESS_KEY`
- `react-native-dotenv` babel plugin configured in `babel.config.js`
- Type declarations in `src/types/env.d.ts`

### 4.4 Axios instance

**`src/api/axiosInstance.ts`:**
- Base URL: `API_BASE_URL` from `@env`
- Timeout: 10,000ms
- Header: `content-type: application/json`
- **Request interceptor:** Injects `Authorization: Bearer <token>` on all non-auth endpoints. Reads from in-memory cache (`_cachedToken`) first; falls back to Keychain read (~100–300ms) if cold. Excluded endpoints: `token/postLoginCustomer`, `api/token/getEcommAccessToken`, `postCreateCustomer`, `postConfirmCustomer`.
- **Response interceptor:** On 401 — calls `token/getEcommAccessToken` with refresh token as Bearer header. On success: updates Keychain + in-memory cache, retries the original request. Multiple concurrent 401s share one `_refreshPromise` to avoid duplicate refresh calls. If refresh also fails → `clearSession()` + `resetToLogin()`. Classifies all other errors via `classifyError()`, logs via `apiLog()`. Application-level envelope check (`statusCode !== 1`) remains commented out.

### 4.5 Session management (`src/utils/auth.ts`)

`getInitialRoute()` — always returns `'Home'`. No Keychain read at startup. Token expiry is handled reactively via the 401 interceptor, not by decoding `exp` at startup (clock-skew risk removed).

`isLoggedIn()` — checks Keychain presence only (no expiry check). Returns `true` if a token exists.

`clearSession()` — clears in-memory token cache, access token Keychain entry (`STORAGE_KEYS.authToken`), refresh token Keychain entry (`STORAGE_KEYS.refreshToken`), and `STORAGE_KEYS.userData` from AsyncStorage.

**Token lifecycle:** Access token = 15 min, Refresh token = 7 days. Login requires `ClientType: 'MOB-RN-2F9A'` — injected automatically by `authApi.ts`. Both tokens stored in Keychain on login.

### 4.6 OrganisationID caching (`src/api/product/productApi.ts`)

`placeOrder` requires `OrganisationID` per line item. The product API now caches `OrganisationID` keyed by `InventoryID` in a module-level `Map` when products are fetched (`getAllProducts`, `getProductsByCategory`, `getProductsByBrand`). `getOrgIdForInventory(inventoryId)` reads from this cache — used in `AddressScreen` when building the order payload. The cache is in-memory only (lost on app restart); it is populated whenever products are fetched before checkout.

### 4.7 Error classification

**`src/api/apiError.ts`:**
```typescript
type ApiErrorKind = 'timeout' | 'network' | 'server' | 'application'
```
- `timeout` — request exceeded 10-second timeout
- `network` — no response received (offline, DNS failure)
- `server` — HTTP 4xx/5xx
- `application` — HTTP 200 but `statusCode !== 1` in response envelope

### 4.8 Backend API envelope

All responses follow:
```json
{ "statusCode": 1, "result": {...}, "userMessage": "..." }
```

`statusCode === 1` means success. Domain `index.ts` files handle unwrapping where needed (e.g. `order/index.ts` unwraps `postOrderHistory` before returning to screens).

### 4.9 ProductInterface — live API shape

`ProductInterface` and `ProductVariant` (allProducts) and `ProductDetailInterface` + `VariantInterface` (getProductByItemId) are fully typed in `src/api/interfaces.ts` to match the real API response including: `StockStatus`, `BackOrder`, `PhysicalAttributes`, `PriceDetails.Taxes`, `ComplianceInfo`, `ProductClassification`, `Marketing`, `PolicyInfo`, `AdditionalInfo`, `ShippingInfo`, `DiscountPct`, `OrganisationName`.

Shared sub-interfaces: `VariantTax`, `PhysicalAttributes`, `ProductComplianceInfo`, `ProductDetailComplianceInfo`, `ProductClassification`, `ProductMarketing`, `ProductPolicyInfo`, `ProductShippingInfo`.

### 4.10 Enums (`src/config/enum_files/`)

Server-side enums — one file each, mirroring the backend `Enums.cs`. Import directly from the specific file — no barrel index. All numeric fields in `interfaces.ts` that have a corresponding enum must use it.

**Customer-facing (actively used):** `OrderStatus` (re-exported as `OrderStatusCode`), `CustomerCancellationReason` (+ `CancellationReasonLabel` map), `RefundMode` (+ `RefundModeLabel` map), `CustomerPlatform`, `PaymentModes`, `TaxType`, `SortBy`, `ItemCondition`, `ProductDemographic`, `Season`, `WeightUnit`, `DimensionUnit`, `VolumeUnit`, `WarrantyType`, `HazardClass`, `HazardLabel`, `VATCategory`, `CouponDiscountType`, `VerificationStatus`.

**Merchant/admin (present for shared reference, not used in customer app):** `MerchantStaffRole`, `Status`, `AdjustmentReason`, `AdjustmentType`, `InventoryStockFilter`, `ReceiptSearchFilter`, `MerchantCancellationReason`, `CountFilter`.

### 4.11 SortBy — server-side sorting

`allProducts` endpoint accepts `sortBy: SortBy | null`. All three product fetch functions (`getAllProducts`, `getProductsByCategory`, `getProductsByBrand`) accept an optional `sortBy?: SortBy` parameter. `ResultScreen` maps `price_asc` → `SortBy.LowToHigh`, `price_desc` → `SortBy.HighToLow` server-side; `newest` and `default` remain client-side.

### 4.10 Adapter/domain normalization layer — intentionally absent

Screens consume DTOs directly from the API. No adapter/normalization layer. `useSession` returns `LoggedInCustomerInterface | null` — the raw DTO type.

### 4.11 Mock layer

**`src/api/mock/mockData.ts`** — complete in-memory dataset used by order detail (the only remaining mock domain).

---

## 5. Design System

### 5.1 Token layer (`src/theme/tokens.ts`)

Single source of truth for all visual primitives. Never hardcode hex colors, raw spacing numbers, or raw font sizes.

```
Colors    — accent (#B25A3D ember), surfaces (surface/surfaceSoft/surfaceDeep),
            ink scale (ink1–ink5), semantic (danger/success/warning/info),
            tints, rule, star
Space     — 4px base grid (Space[1]=4px … Space[12]=48px) + named constants:
            screenH=20, gapRow, padCard, padTap
Radius    — xs/sm/md/lg/pill
FontSize  — xs/sm/base/md/lg/xl/2xl/3xl/4xl
FontWeight — regular/medium/semibold/bold (typed string literals)
Shadow    — sm/md/lg (cross-platform)
ZIndex    — base/raised/overlay/modal/toast
```

### 5.2 Typography presets (`src/theme/typography.ts`)

`Type.*` presets are `satisfies TextStyle`-typed. Always use a matching preset before writing inline `fontSize`/`fontWeight`.

| Preset | Role |
|---|---|
| `Type.display` | Hero headlines (serif 40px) |
| `Type.title` | Screen/section titles (serif 28px) |
| `Type.heading` | Product names, card titles (serif 22px) |
| `Type.priceLarge` | Cart total, product hero price (serif 32px) |
| `Type.price` | Standard price figures (serif 22px) |
| `Type.label` | Brand names, eyebrows, section kickers (mono 11px, uppercase) |
| `Type.body` / `Type.bodyStrong` | Body copy / CTA labels (sans 16px) |
| `Type.caption` | Secondary text, metadata (sans 13px) |

### 5.3 Font system (`src/theme/fonts.ts`)

```typescript
FontFamily.serif       // InstrumentSerif-Regular — product names, headlines, prices
FontFamily.serifItalic // InstrumentSerif-Italic — wordmarks, taglines, hero copy
FontFamily.mono        // JetBrainsMono-Regular — brand labels, order numbers, micro-meta
FontFamily.sans        // undefined — system sans (body, captions, UI text)
```

### 5.4 Motion vocabulary (`src/theme/motion.ts`)

Three durations — all animations must bind to one. Ad-hoc durations are a review failure.

```
Motion.duration.tap    = 120ms  — press states, icon fills, badge bumps
Motion.duration.settle = 320ms  — list entrances, screen-in, sheet rise
Motion.duration.carry  = 560ms  — hero parallax, success draw, image scrub
Motion.spring.settle   — damping 18, stiffness 80
Motion.spring.snap     — damping 14, stiffness 180
Motion.pressScale      = 0.98   — press-in scale target
```

### 5.5 Tailwind config (`tailwind.config.js`)

Mirrors the token system — all token colors available as Tailwind class names: `bg-surface`, `bg-surfaceDeep`, `text-ink1`, `border-rule`, etc.

---

## 6. Component Library

### 6.1 Primitives layer (`src/components/primitives/`)

Thin NativeWind-ready wrappers over React Native core components. Enables `className` prop. Exported: `Box`, `VStack`, `HStack`, `Text`, `Pressable`, `Button`/`ButtonText`/`ButtonSpinner`, `Divider`, `ScrollView`, `Image`. Zero logic, zero design opinions.

### 6.2 UI components (`src/components/ui/`)

| Component | Status | Notes |
|---|---|---|
| `PrimaryButton` | Active | Full-width ink pill CTA — `useTactile` + `useHaptic` built in |
| `TextLinkButton` | Active | Secondary underlined text CTA |
| `Button` | Active | Multi-variant (primary/secondary/ghost/destructive) |
| `BottomNavBar` | Active | Reads `cartCount` from CartContext, ember badge |
| `ScreenHeader` | Active | Header for light-surface screens |
| `DarkHeader` | Active | Dark editorial header. Props: `eyebrow`, `title`, `titleFont`, `onBack`, `rightSlot`, `paddingTop` |
| `ProductIdentity` | Active | Brand + name + price stacked block |
| `FadeImage` | Active | `Animated.Image` with opacity fade-in on load (`Motion.duration.settle`) |
| `Price` | Active | Formatted price display — `$`, `size` prop (sm/base/lg/xl), strikethrough was-price |
| `QuantityStepper` | Active | − N + control (sm/md sizes, mono styling) |
| `StatusBadge` | Active | 5 order statuses |
| `SearchBar` | Active | Search input with icon |
| `FloatingLabelInput` | Active | Static-label underline input. Used in Login, RegisterScreen, AddressScreen, AddressManagementScreen |
| `EmptyState` | Active | Props: `icon`, `title`, `body`, `trustLine?` (optional trust signal slot), `action?`. Use `TrustLine` in the `trustLine` slot on checkout/account screens. |
| `ErrorBanner` | Active | Inline error within loaded screens — for mutation errors |
| `Skeleton` / `SkeletonRow` | Active | Skeleton loading placeholders — shimmer sweep 1400ms |
| `SkeletonGrid` | Active | 2-column (or 1-column) product grid skeleton. Props: `cols`, `rows`, `showPriceLine`, `showButton`. Uses `Skeleton` internally. Used by WishlistScreen, ResultScreen, SearchScreen. |
| `TrustLine` | Active | Lock icon + caption text in `ink4`. Used on AddressScreen empty state and WishlistScreen FTU state. |
| `Toast` / `AppToast` | Active | Toast component — rendered via `ToastOverlay` |
| `ToastOverlay` | Active | Portal-style overlay — subscribes to `toastEmitter`, renders `AppToast` at top of screen with spring entrance. Auto-dismisses after 3.5s. Mount once in `App.tsx`. |
| `VariantSheet` | Active | Bottom sheet for variant selection — uses `gluestack/Actionsheet` |
| `FilterSheet` | Active | Bottom sheet for sort/category/brand/price/discount filters. Uses RN `Modal`. Owns all draft filter state via props. |
| `OrderFilterSheet` | Active | Lightweight filter sheet for order history — sort (asc/desc) + date range. Uses RN `Modal`. |
| `OrderProgressBar` | Active | 6-step segmented progress bar (Placed → Delivered). Active step rendered in ember (`Colors.accent`), prior steps in `Colors.ink3`, pending in `Colors.rule`. Shows active step label below. Returns null for terminal statuses (Cancelled, Returned). Used in `OrderHistoryScreen` (active order cards) and `OrderDetailScreen` (`StatusHero`). |
| `HeroNavButton` | Active | Floating nav button (ProductScreen) |
| `Rating` | Deprecated | `@deprecated` JSDoc present. Zero screen usage. Adopt before use. |
| `SectionLabel` | Deprecated | `@deprecated` JSDoc present. Zero screen usage. Migrate HomeScreen section headers here before adopting. |

### 6.3 System components (`src/components/system/`)

| Component | Status | Notes |
|---|---|---|
| `ErrorState` | Active | Full-screen error + retry. Use when async fetch fails. |
| `RetryButton` | Active | Internal dependency of `ErrorState`. |
| `InlineError` | Deprecated | `@deprecated` JSDoc present. Use `ErrorBanner` instead. |

### 6.4 Gluestack component overrides (`src/components/gluestack/`)

- `Actionsheet.tsx` — reimplemented with `@gorhom/bottom-sheet` v5. Preserves Gluestack export surface.
- `provider.tsx` — minimal provider stub.

**Do not add Gluestack overlay/modal/actionsheet packages.** The ESM incompatibility is fundamental to the bare RN CLI architecture.

---

## 7. Established Patterns

### Pattern 1 — Screen API imports from domain index

```typescript
import { getAllProducts } from '../api/product';   // correct
import { getAllProducts } from '../api/product/productApi'; // never
```

### Pattern 2 — `useAsyncState` with focus-aware cancellation

```typescript
const { data, loading, isError, error, run } = useAsyncState<T[]>([]);

useFocusEffect(
  useCallback(() => {
    const cancelled = { current: false };
    run(async () => { /* fetch */ }, cancelled);
    return () => { cancelled.current = true; };
  }, [run]),
);
```

### Pattern 3 — Error and empty states

```tsx
if (isError) return <ErrorState title="..." message={error ?? ''} onRetry={fetchFn} retryLoading={loading} />;
if (loading && !data?.length) return <Skeleton height={...} />;
// Inline mutation error:
{mutationError ? <ErrorBanner message={mutationError} onDismiss={() => setMutationError(null)} /> : null}
```

### Pattern 4 — Design token imports, never hardcoded values

```typescript
import { Colors, Space, Radius } from '../theme';
backgroundColor: Colors.surface,   // correct
backgroundColor: '#F8F7F4',        // never
```

### Pattern 5 — Optimistic mutations with server correction on error

```typescript
setLocalState(prev => optimisticallyUpdate(prev, item));
try { await serverMutation(item); }
catch { fetchData(); } // restore server-authoritative state
```

### Pattern 6 — Storage keys from typed constant

```typescript
import { STORAGE_KEYS } from '../config/storageKeys';
AsyncStorage.getItem(STORAGE_KEYS.userData); // correct
AsyncStorage.getItem('userData');            // never
```

### Pattern 7 — Cart badge via `setCartCount`

```typescript
const { setCartCount } = useCart();
setCartCount(prev => prev + quantity);                          // add-to-cart
setCartCount(items.reduce((sum, i) => sum + i.Quantity, 0));   // after fetch
```

### Pattern 8 — NativeWind for static layout, `style={}` for dynamic values

```tsx
<Box className="flex-1 bg-surface px-5">     // static layout
<Animated.View style={[animatedStyle, ...]>  // animated/conditional
```

### Pattern 9 — Haptic bindings

```typescript
haptic.light()    // variant select, row tap, wishlist toggle, qty change
haptic.success()  // add-to-cart confirmed, order placed
haptic.warning()  // login failure, destructive confirm
```

### Pattern 10 — Press-scale animation on primary CTAs

```typescript
const { animatedStyle, handlers } = useTactile();
// Or use PrimaryButton which wires useTactile internally.
```

### Pattern 11 — Profile code access

Prefer `useProfileCode()` hook over reading `STORAGE_KEYS.userData` directly when only `CustomerProfileCode` is needed:

```typescript
const profileCode = useProfileCode(); // number | null
```

### Pattern 12 — Toast emission

Do not call `useAppToast` for fire-and-forget toasts from outside React components. Use `toastEmitter` directly:

```typescript
import { toastEmitter } from '../utils/toastEmitter';
toastEmitter.emit('success', 'Added to cart');
```

---

## 8. Architecture Decisions

### 8.1 No Redux / Zustand / React Query

Context API + `useAsyncState` is the right tool at this scale.

### 8.2 No full cart store in CartContext

Lightweight integer count. Correct badge with minimal surface area. See §15.

### 8.3 NativeWind-first, not Gluestack ecosystem

Gluestack overlay packages ship ESM-only and depend on `react-dom`, `react-aria`, `react-transition-group` — web-only packages incompatible with bare RN CLI. Resolution: local component ownership, `@gorhom/bottom-sheet` for sheets, RN `Modal` for modals, `ToastOverlay` + `toastEmitter` for toasts.

### 8.4 No TypeScript migration of plain-JS files mid-phase

`CartContext.js`, `AppNavigator.js`, `mockData.js` remain JS.

### 8.5 No adapter/domain normalization layer by default

See §4.10. Screens consume DTOs directly. Adapters were prototyped and removed.

### 8.6 Reactive token expiry — no clock-based checks

Clock-based JWT expiry check removed from `getInitialRoute()` and `isLoggedIn()`. Token validity is determined reactively: if the server returns 401, the interceptor attempts a refresh. This eliminates clock-skew false logouts. `getInitialRoute()` always returns `'Home'` — the app starts there regardless of token state, and the first authenticated API call will trigger refresh/logout if needed.

### 8.7 OrganisationID via product fetch cache

Rather than requiring the backend to add `OrganisationID` to the cart response, the product API caches `OrganisationID` per `InventoryID` in a module-level Map during normal product browsing. `getOrgIdForInventory()` reads from this cache at checkout time. This is in-memory only — if the user somehow reaches checkout without having browsed products (e.g. deep link), the cache may be cold.

---

## 9. Known Technical Debt

### Active debt

| Item | Notes |
|---|---|
| `placeOrder` OrganisationID cache cold-start | If a user deep-links straight to checkout without browsing products, `getOrgIdForInventory()` returns an empty string. Cache is populated only when products are fetched. |
| `postUpdateCustomer` password | `Password` field is required but overwrites the stored password — cannot update profile without setting a new password. Backend fix pending. |
| `useSession` adoption | WishlistScreen and CartScreen migrated to `useProfileCode()`. Still pending: OrderHistoryScreen, OrderDetailScreen. AddressScreen reads AsyncStorage directly by design (needs `profileCode` inside fetch). |
| Tax display in UI | `ProductScreen`, `CartScreen`, `AddressScreen` don't show tax breakdown. Tax data is available in variant response but not rendered. |
| `getSavedCartItems` tax verification | Unconfirmed whether cart API returns `PriceDetails.Taxes` populated — needs real response check before tax display work. |
| API response types | `axiosInstance` responses are untyped (`any`). Incremental hardening deferred. |
| Navigation prop typing | Most screens use `any`-typed navigation props. Should use `StackNavigationProp` generics. |
| `heroBanner` from legacy `src/data/mockData.js` | HomeScreen still imports from the old mock file. Should migrate to `api/mock/mockData.ts`. |
| No error boundary at app root | Render exceptions crash the whole app. Add one in `App.tsx`. |
| No unit test coverage | `useAsyncState`, `apiError`, domain routers, CartContext have no tests. Jest config exists. |
| OTP resend | No resend button on OTPVerificationScreen — user has no recovery if OTP expires. |
| Cart badge on logout | Badge count not reset to 0 on logout — shows stale count until next focus. |

### Resolved (for reference)

| Item | Resolution |
|---|---|
| Auth token injection | Implemented — Keychain-backed Bearer token with in-memory cache in `axiosInstance.ts` |
| Hardcoded initial route to Login | Resolved — `getInitialRoute()` always returns `'Home'`; expiry handled reactively |
| Clock-based JWT expiry check | Removed — replaced with 401-reactive refresh flow |
| Refresh token flow | Implemented — `api/token/getEcommAccessToken` called on 401; concurrent 401s deduplicated; both tokens cleared on logout |
| Tax data in order payload | Fixed — `AddressScreen` maps `PriceDetails.Taxes` from cart items into `PlaceOrderTax[]` |
| `ProductInterface` partial typing | Fully typed against live API — includes `PhysicalAttributes`, `ComplianceInfo`, `Taxes`, `StockStatus`, all nested objects |
| Server-side sorting | Implemented — `allProducts` payload sends `sortBy: SortBy | null`; `ResultScreen` maps sort keys |
| Enum files | 27 enums in `src/config/enum_files/` mirroring backend `Enums.cs`. `OrderStatusCode` moved here, re-exported from `interfaces.ts`. |
| Cancel order | `cancelOrder` endpoint wired and confirmed working. `SubOrder: { Code, Number }` shape from `getOrderStatus`. Uses `SubOrder.Code` as `SubOrder.Id`. Success shown via styled `Modal`. |
| Order tracking timeline | `Events` array from `getOrderStatus` rendered as vertical spine timeline in `OrderDetailScreen`. |
| Order payment summary | `PaymentInfo` from `getOrderStatus` rendered in `OrderDetailScreen` — amount paid, discount, delivery, coupon, total. |
| Order history stale after cancel | `OrderHistoryScreen` now re-fetches on every focus — fixed via removing `hasFetchedOnce` guard. |
| `postCnfOrderDetail` on mock | Switched to real. Field mapping normalised in `order/index.ts` (`InventoryID`, `ItemID`, `SubOrderNumber`, `BrandName`, `PaymentInfo`). |
| Cart/WishlistScreen reading AsyncStorage directly | Migrated to `useProfileCode()` hook |
| `endpoints.js` plain JS | Migrated to `endpoints.ts` with `as const` domain objects |
| `url.js` base URL config | Deleted — base URL lives in `.env` |
| Centralized `services.ts` / `integrations.ts` | Deleted — domain-organized API layer |
| Cart NaN badge | CartContext rewritten to server-authoritative integer |
| `useEntrance` duplicated in 6 screens | Extracted to `src/hooks/useEntrance.ts` |
| `Price` currency `₹` mismatch | Corrected to `$` |
| Login 55KB inline SVG | Eliminated — pure RN gradient composition |
| All domains on mock | auth, cart, wishlist, address now all real |
| P1-01 Cart badge cold-start zero | Fixed in `Login.tsx` — `getSavedCartItems` called post-login to seed `cartCount` before navigating to Home |
| Cancel order `SubOrder.Id` | Resolved — `getOrderStatus` returns `SubOrder: { Code, Number }`. Cancel payload uses `SubOrder.Code` as `SubOrder.Id`. Success shown via styled `Modal`. End-to-end confirmed working. |
| Order progress bar | `OrderProgressBar` (`src/components/ui/OrderProgressBar.tsx`) — 6-step segmented bar shown on active orders in `OrderHistoryScreen` and `StatusHero` in `OrderDetailScreen`. `orderStatus.ts` extended with `ORDER_STATUS_LABELS` record for customer-facing display copy. |
| HomeScreen infinite skeleton | Fixed — fetch functions now guard `statusCode !== 1` and return `[]`; `fetchInitiated` ref prevents re-fetch loop; skeleton branches break on `isError`. |
| Recently viewed / recent searches account bleed | Fixed — `scopedKey(base, profileCode)` in `storageKeys.ts` namespaces keys per user (`recentlyViewed_100094`) or guest (`recentlyViewed_guest`). ProductScreen, HomeScreen, SearchScreen, WishlistScreen updated. |
| Dark header on AddressScreen / AddressManagementScreen | Fixed — both screens now use light surface header (serif 22px, `ink1`, hairline divider) matching WishlistScreen/CartScreen. |
| State experience gaps (HomeScreen, ResultScreen, SearchScreen, WishlistScreen, AddressScreen) | Fixed — full state coverage sprint. `SkeletonGrid` and `TrustLine` added. Dual empty states on ResultScreen. FTU states on WishlistScreen and SearchScreen. |

---

## 10. Screen Status

| Screen | APIs Called | Key Features | Known Gaps |
|---|---|---|---|
| **Login** | `loginCustomer`, `getSavedCartItems` (post-login) | Dark hero / light form split. Staggered spring entrance. Seeds cart count post-login via `getSavedCartItems`. Sets Keychain tokens + AsyncStorage user data. | — |
| **RegisterScreen** | `postCreateCustomer` | `FloatingLabelInput` fields. On success → navigates to `OTPVerification` with phone + profile code params. | — |
| **OTPVerificationScreen** | `postConfirmCustomer`, `postCreateCustomer` (resend) | 6-digit OTP input. Confirms registration → navigates to Login. | No resend button — user has no recovery if OTP expires. |
| **HomeScreen** | `getProductsByCategory`, `getCategories`, `getBrands` | Module-level cache + `fetchInitiated` ref (prevents re-fetch loop on state change). `ErrorState` wired for total fetch failure. Skeleton breaks on `isError` or empty response. Recently viewed uses `scopedKey`. | No banners/promotions. Local entrance animation (500ms/440ms) — intentional exception to shared hook. |
| **SearchScreen** | `allProducts` (via axiosInstance direct) | Recent searches scoped via `scopedKey`. FTU "Popular right now" chips when no recent searches. `EmptyState` for no-results with "Browse All Products" CTA. `ErrorState` for fetch failure with retry. | — |
| **ResultScreen** | `allProducts`, `getCategories`, `getBrands`, `addToWishlist` | Infinite scroll, server-side `SortBy`. Filter sheet. Dual empty states: filter-active ("No matches found." + Clear Filters) vs. collection-empty ("Nothing here yet." + Browse All). `ErrorState` with "Go back" secondary CTA. | — |
| **ProductScreen** | `getProductByItemId`, `postSaveCartItems`, `addToWishlist`, `removeFromWishlist`, `getWishlist`, `addToGuestCart` | Variant picker (`VariantSheet`). Wishlist toggle. Add to cart (auth-guarded). Guest cart support. Writes `recentlyViewed` to AsyncStorage. `useAuthGuard` for protected actions. | No reviews/ratings section. No related/similar products. No size guide. |
| **CartScreen** | `getSavedCartItems`, `postDeleteCartItem`, `updateCartItemQuantity`, `getGuestCart`, `updateGuestCartItem`, `removeFromGuestCart`, `clearGuestCart` | Auth + guest cart support. Qty stepper with optimistic updates. Remove item. `PriceDetails` summary panel. Proceeds to `AddressScreen` (auth-guarded). Merges guest cart on login. | No coupon/promo code input (`CouponAvailed` exists in API). Tax breakdown not shown. |
| **AddressScreen** | `getDeliveryAddresses`, `postCreateDeliveryAddress`, `placeOrder` | Light surface header (consistent with WishlistScreen/CartScreen). Address-row skeleton during fetch. Empty state separated from form — `showForm` state revealed by outline "Add Address" CTA. `TrustLine` on empty state. `savingAddress` and `orderSubmitting` are separate states. Reads AsyncStorage directly for `profileCode` (by design — needed inside fetch). | `OrganisationID` cold-start risk if user reaches checkout without browsing products. |
| **PaymentScreen** | MIPS `token/create`, MIPS `mips/loadPaymentZone`, MIPS `mips/getPaymentStatus`, `placeOrder` | WebView MIPS payment gateway. 5-min countdown. Polls payment status (15s initial delay, 5s interval, 60 max attempts). Finalises order on `StatusCode=1`. Clears cart on success → `OrderSuccess`. | Credentials hardcoded pending backend config. `customerProfileCode` hardcoded to test value pending backend fix. |
| **OrderSuccessScreen** | None (params only) | Ember ring scales 0.52→1.0 on Carry curve. `haptic.success()` at draw completion. Staggered Settle content entrance. Shows order number, items, total, address, timestamp. | — |
| **OrderHistoryScreen** | `postOrderHistory`, `postSaveCartItems` (reorder) | Infinite scroll pagination (page size 10). Pull-to-refresh. Sort + date range filters (`OrderFilterSheet`). `OrderProgressBar` shown inline on active order cards (New/Confirmed/Processing/Fulfilled/Shipped). Left status strip color varies by state (accent/ink3/danger). Reorder button (adds all items to cart). Re-fetches on every focus. Auth-guarded (shows `LoginPromptSheet` for guests). | Order count in header is current-page count, not server total. |
| **OrderDetailScreen** | `postCnfOrderDetail`, `cancelOrder` | `StatusHero` with tinted background (accentTint/successTint/dangerTint per status) + `OrderProgressBar` for active statuses + `ORDER_STATUS_LABELS` display copy. Tracking timeline (`Events` array as vertical spine). Payment summary (`PaymentInfo`). Delivery address section. Cancel order bottom sheet (`CustomerCancellationReason` + `RefundMode` pickers). Cancel only shown for New/Confirmed/Processing. Success shown via styled `Modal`. Copy-to-clipboard on order number. | — |
| **WishlistScreen** | `getWishlist`, `removeFromWishlist`, `postSaveCartItems` | Auth-guarded. `SkeletonGrid` (2×2, shimmer) during load. FTU empty state ("Save things you love." + `TrustLine`) on first visit with empty wishlist — detected via `scopedKey('wishlistSeen', profileCode)`. Return-user empty state ("Nothing saved yet.") on subsequent visits. | — |
| **ProfileScreen** | `getDeliveryAddresses`, AsyncStorage (`userData`) | Shows user info from `userData`. Address count from `getDeliveryAddresses`. Links to Wishlist, Orders, AddressManagement. Logout (clears session). | `postUpdateCustomer` password issue — overwrites stored password, backend fix pending. No order count summary. |
| **AddressManagementScreen** | `getDeliveryAddresses`, `postCreateDeliveryAddress`, `postUpdateDeliveryAddress`, `postDeleteDeliveryAddress` | Full CRUD for delivery addresses. Light surface header (consistent with rest of app). Inline form (`FloatingLabelInput`). Set primary address. `useAsyncState` + `useFocusEffect`. | — |

---

## 11. Live API Integration

### Current domain status

| Domain | Mode | Notes |
|---|---|---|
| Product | **Real** | All functions live. `selectProduct` and `getProductByItemId` are real. |
| Auth | **Real** | login, register (`postCreateCustomer`), OTP confirm (`postConfirmCustomer`), profile update |
| Cart | **Real** | All functions |
| Address | **Real** | All functions |
| Wishlist | **Real** | All functions |
| Order | **Real** | All functions live: `placeOrder`, `postPlacedMultipleOrder`, `postOrderHistory`, `postCnfOrderDetail`, `cancelOrder`. |

### Image resolution

Product `Images` field returns a relative path (e.g. `MER_ORG/Products/123.jpg`). `resolveImageUrl()` in `src/utils/resolveImageUrl.ts` prepends the base URL. `CategoryImage` already returns a full Cloudinary URL and passes through unchanged. As a fallback, `useProductImage` resolves an Unsplash image via query built from product name + brand name.

### Switching a domain from mock to real

1. In the domain's `index.ts`, import `* as real` and export directly (remove `MOCK_MODE` guard).
2. Verify the real API shape matches `src/api/interfaces.ts`.
3. Unwrap the response in `index.ts` if needed (see `order/index.ts` pattern).
4. Use Reactotron to inspect the real request/response.

---

## 12. NativeWind + Primitives Layer

### Architecture

NativeWind v4 configured with `nativewind/babel` preset. `tailwind.config.js` extends the color scale to mirror `Colors.*` tokens. `src/components/primitives/` provides pass-through wrappers — their only purpose is to enable `className` on RN core components.

### Styling rules

- `className` for static layout (flex, padding, margins, background colors, borders)
- `style={}` for dynamic runtime values (animations, conditional colors, calculated sizes)
- Never mix NativeWind and `StyleSheet.create()` for the same concern on the same element

### ProductScreen as reference implementation

ProductScreen is the first fully NativeWind-migrated screen. It is the reference for `className` usage patterns, `HeroNavButton`, `VariantSheet`, `PrimaryButton`/`TextLinkButton` CTA hierarchy, and `useTactile` wiring.

---

## 13. Reactotron Setup

**`src/config/reactotron.ts`** — dev-only network inspector, imported in `index.js` before `AppRegistry`.

```typescript
Reactotron
  .configure({ host: '10.0.2.2', name: 'E-Commerce App' })
  .useReactNative({ networking: true })
  .connect();
```

`host: '10.0.2.2'` is the Android emulator alias for the host machine.

---

## 14. Repository and Branch Strategy

| Branch | Role |
|---|---|
| `main` | Production branch — kept in sync with `dev` via merge. |
| `dev` | Canonical engineering branch. All work happens here. |

---

## 15. Cart Architecture

### Why a lightweight count, not a full item store

`CartContext.js` stores a single `cartCount` integer. Storing cart items in context creates a three-way sync problem: context, server, and CartScreen's local `cartItems` state. The counter achieves the visible goal (correct badge) at minimal surface area.

### Badge sync points

| Event | Who sets cartCount | How |
|---|---|---|
| Login success | Login.tsx | `getSavedCartItems` result length (fire-and-forget) |
| CartScreen fetch (on focus) | CartScreen | `items.reduce((sum, i) => sum + i.Quantity, 0)` |
| Quantity change (optimistic) | CartScreen | `setCartCount(prev => prev + delta)` |
| Item remove (optimistic) | CartScreen | `setCartCount(prev => Math.max(0, prev - item.Quantity))` |
| Clear cart | CartScreen | `setCartCount(0)` |
| Add to cart (confirmed) | ProductScreen | `setCartCount(prev => prev + quantity)` |

---

## 16. Premium UX Refinement — Reference Patterns (Phase 2)

These patterns define the visual and interaction standard. Phase 3 work must follow them.

### 16.1 Infrastructure

#### `src/theme/fonts.ts`
```typescript
FontFamily.serif       // 'InstrumentSerif-Regular' — editorial roles
FontFamily.serifItalic // 'InstrumentSerif-Italic' — wordmarks, taglines
FontFamily.mono        // 'JetBrainsMono-Regular' — labels, order numbers, meta
FontFamily.sans        // undefined — system sans
```

#### `src/theme/motion.ts`
```
Tap     120ms   easeOut          press states, icon fills, badge increments
Settle  320ms   spring(18, 80)   list entrances, screen-in, sheet rise
Carry   560ms   easeInOut        hero parallax, OrderSuccess draw, image scrub
```

#### `src/hooks/useHaptic.ts`
```typescript
haptic.light()    // variant select, row tap, wishlist toggle, qty change
haptic.success()  // add-to-cart confirmed, order placed, checkmark draw
haptic.warning()  // login failure shake, destructive confirm
```

#### `src/hooks/useTactile.ts`
Press-scale animator. Returns `{ animatedStyle, handlers }`. Wrap in `Animated.View`, spread `handlers` on `TouchableOpacity`, set `activeOpacity={1}`. Or use `PrimaryButton` which wires this internally.

#### `src/components/ui/FloatingLabelInput.tsx`
Static-label underline input. Label always visible at `Type.label` scale. Only the underline animates on focus (1→2px, Tap curve). Used in Login, RegisterScreen, AddressScreen, AddressManagementScreen.

### 16.2 Reference screens — key decisions

#### Login
Dark hero / light form panel split. 5-layer `LinearGradient` atmospheric composition. Staggered spring entrance. Failure: inline caption + button shake + `haptic.warning()`.

#### HomeScreen
**Architecture exception:** HomeScreen retains its own local entrance animation (500ms/440ms, `initialY=14`) — do not replace with the shared hook. The different timing is intentional for the hero's heavier feel.

#### ProductScreen
NativeWind reference implementation. Identity plate below image: brand `Type.label` → name `Type.heading` → price `Type.priceLarge`. Ember discount marker. Hairline variant chips. `PrimaryButton` + `TextLinkButton` CTA pair.

#### OrderSuccessScreen
72px ember ring scales from 0.52→1.0 on Carry curve. `haptic.success()` at completion. Staggered Settle content entrance.

#### CartScreen
No card boxing — hairline `Colors.rule` dividers. 4:5 portrait image ratio. Inline `− N +` mono qty control. `Colors.surfaceDeep` summary panel. `Shadow.sm` only.

### 16.3 Binding patterns for Phase 3

**Type hierarchy:**
- Light surface: `Type.heading`/`Type.title` serif for names; `Type.priceLarge`/`Type.price` serif for prices; `Type.label` mono for brands/eyebrows; `Type.body`/`Type.caption` sans for copy.

**CTA hierarchy:**
- Primary: full-width ink pill, 52px height, `Type.bodyStrong` white, `useTactile`
- Secondary: `Type.caption` underlined text link, `Colors.ink3`
- Never two equal-weight CTAs side by side.

**Anti-patterns to never reintroduce:**
- `Colors.danger` for discount badges → use `Colors.accentTint`/`Colors.accent`
- `FontWeight.bold`/`semibold` on product names/prices → use `FontFamily.serif`
- `Shadow.md`/`Shadow.lg` on inline cards
- `Colors.success` (green) for success moments → use `Colors.accent` (ember)
- Equal-weight dual CTA buttons → primary pill + subordinate text link
- `Alert.alert()` for form errors → inline error + shake animation

### 16.4 `useEntrance` shared hook

`src/hooks/useEntrance.ts` — `useEntrance(delay = 0, withScale = false, initialY = 10)`.

Used by: CartScreen, WishlistScreen, OrderHistoryScreen, ProfileScreen, ResultScreen, AddressManagementScreen.

**Exception:** HomeScreen retains its own local entrance. Do not replace.

### 16.5 Phase 3 status

All 14 screens complete. No pending redesign work.

---

*This document is the canonical engineering reference. For the current architecture summary, see `CLAUDE.md`.*
