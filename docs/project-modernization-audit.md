# Project Modernization Audit — E-Commerce React Native App

**Last updated:** 2026-05-20
**Branch:** `dev` (canonical)
**TypeScript status:** 0 errors, 51+ files compiled clean

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

The app is a React Native e-commerce client (iOS + Android) supporting: product browsing, category/search results, product detail, cart, checkout with address management, order history, order detail, wishlist, and profile. Authentication is username/password with the customer profile code persisted via AsyncStorage.

**Current state:**
- Feature/domain-organized API layer, no centralized services.ts
- Product domain is live against the real server; all other domains mock in dev
- Design token system, shared UI and system component library, premium motion vocabulary
- NativeWind v4 + semantic primitives layer for new component work
- Gluestack overlay stack abandoned; local component ownership adopted
- `useAsyncState` cancellation-safe async hook across all data-fetching screens
- Server-authoritative cart badge via `CartContext`
- 5 screens frozen as the visual standard (Login, Home, ProductScreen, OrderSuccessScreen, CartScreen)
- Phase 3 redesign pending: ResultScreen, WishlistScreen, OrderHistoryScreen, ProfileScreen, AddressScreen, OrderDetailScreen

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native 0.81.4 |
| Language | TypeScript 5.8.3 (mixed with JS in legacy files — do not add TS to JS files unless explicitly requested) |
| Navigation | React Navigation v7 (Stack) |
| HTTP | Axios — `src/api/axiosInstance.ts`, base URL from `.env` via `react-native-dotenv` |
| State | Context API + useState (local), AsyncStorage (auth), server-authoritative cart count |
| Styling | NativeWind v4 (Tailwind v3) for layout/static; `StyleSheet.create()` for dynamic/animated; design tokens via `src/theme/` |
| Icons | react-native-vector-icons |
| Animations | Animated API (`useEntrance`, `useTactile`), lottie-react-native |
| Toast | sonner-native (`useAppToast` hook) |
| Bottom sheets | @gorhom/bottom-sheet v5 (replaces Gluestack overlay stack) |
| Dev tooling | Reactotron (`src/config/reactotron.ts`) |
| Testing | Jest 29 with React Native preset |

---

## 3. Current Project Structure

```
/
├── App.tsx                          — Root: SafeAreaProvider, CartProvider, AppNavigator, Toaster
├── index.js                         — Entry point: AppRegistry, Reactotron import
├── .env                             — API_BASE_URL=http://122.175.15.28:8110/api/ecomm/
├── babel.config.js                  — nativewind/babel preset, react-native-dotenv plugin
├── tailwind.config.js               — NativeWind config, mirrors token system
└── src/
    ├── api/
    │   ├── axiosInstance.ts         — Axios base URL from @env, interceptors
    │   ├── endpoints.ts             — as const typed endpoint constants (per domain)
    │   ├── interfaces.ts            — All TypeScript interfaces + DTO types
    │   ├── apiError.ts              — Error classification hierarchy
    │   ├── product/
    │   │   ├── index.ts             — Router: product always real (false ? mock : real)
    │   │   ├── productApi.ts        — Real HTTP implementations
    │   │   └── mockProductApi.ts    — Mock implementations
    │   ├── cart/
    │   │   ├── index.ts             — Router: MOCK_MODE = __DEV__
    │   │   ├── cartApi.ts
    │   │   └── mockCartApi.ts
    │   ├── wishlist/
    │   │   ├── index.ts
    │   │   ├── wishlistApi.ts
    │   │   └── mockWishlistApi.ts
    │   ├── order/
    │   │   ├── index.ts             — Router + unwrap helpers (postOrderHistory, postCnfOrderDetail)
    │   │   ├── orderApi.ts
    │   │   └── mockOrderApi.ts
    │   ├── address/
    │   │   ├── index.ts
    │   │   ├── addressApi.ts
    │   │   └── mockAddressApi.ts
    │   ├── auth/
    │   │   ├── index.ts
    │   │   ├── authApi.ts
    │   │   └── mockAuthApi.ts
    │   └── mock/
    │       └── mockData.ts          — Shared in-memory dataset for all mock domains
    ├── components/
    │   ├── primitives/              — NativeWind-ready RN wrappers (Box, Text, VStack, etc.)
    │   ├── gluestack/               — Local overrides replacing broken Gluestack packages
    │   │   ├── Actionsheet.tsx      — @gorhom/bottom-sheet implementation
    │   │   └── provider.tsx
    │   ├── ui/                      — Presentational primitives (no side effects)
    │   ├── system/                  — Application-state components (ErrorState, etc.)
    │   ├── ProductCard.tsx
    │   └── CategoryItem.tsx
    ├── config/
    │   ├── env.ts                   — MOCK_MODE = __DEV__, MOCK_DELAY_MS
    │   ├── storageKeys.ts           — Typed STORAGE_KEYS constant
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
    │   └── useAppToast.ts           — sonner-native toast wrapper
    ├── navigation/
    │   └── AppNavigator.js          — Stack navigator, 11 routes
    ├── screens/                     — 11 screens
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
    │   └── env.d.ts                 — declare module '@env' { API_BASE_URL: string }
    └── utils/
        ├── formatDate.ts            — ISO date → display string
        └── orderStatus.ts           — OrderStatusCode → label
```

---

## 4. API Layer

### 4.1 Domain-organized structure

The API is organized by feature domain. There is no central `services.ts` or `integrations.ts` — those files were deleted. Each domain folder owns its real implementation, mock implementation, and mock/real router.

**Screens import directly from the domain:**
```typescript
import { getAllProducts, getCategories } from '../api/product';
import { getSavedCartItems, postSaveCartItems } from '../api/cart';
import { postOrderHistory } from '../api/order';
```

Never import from an implementation file (`productApi.ts`, `mockProductApi.ts`) directly — always import from the domain's `index.ts` barrel.

### 4.2 Domain MOCK_MODE ownership

Each domain's `index.ts` owns its own mock/real routing:

```typescript
// Product domain — always real (live API, not gated by MOCK_MODE)
const product = false ? mock : real;

// All other domains — mock in dev
import { MOCK_MODE } from '../../config/env';
const cart = MOCK_MODE ? mock : real;
```

`MOCK_MODE` is `__DEV__` in `src/config/env.ts`. Dev builds mock; release builds real. Product domain bypasses this — it is always live.

### 4.3 Environment variables

- `.env` at project root: `API_BASE_URL=http://122.175.15.28:8110/api/ecomm/`
- `react-native-dotenv` babel plugin configured in `babel.config.js`
- Type declarations in `src/types/env.d.ts`
- `axiosInstance.ts` imports `API_BASE_URL` from `@env`
- `url.js` was deleted — all base URL config lives in `.env`

### 4.4 Axios instance

**`src/api/axiosInstance.ts`:**
- Base URL: `API_BASE_URL` from `@env`
- Timeout: 10,000ms
- Header: `content-type: application/json` (lowercase, matching Postman)
- Request interceptor: TODO placeholder for auth token injection
- Response interceptor: classifies all HTTP/network/timeout errors via `classifyError()`, logs via `apiLog()`

### 4.5 Error classification

**`src/api/apiError.ts`:**

```typescript
type ApiErrorKind = 'timeout' | 'network' | 'server' | 'application'
```

- `timeout` — request exceeded the 10-second timeout
- `network` — no response received (offline, DNS failure)
- `server` — HTTP 4xx/5xx
- `application` — HTTP 200 but `statusCode !== 1` in the response envelope

`classifyError(err)` converts any caught value into a structured `ApiError`. `userFacingMessage(err)` extracts a human-readable string — this is what `useAsyncState` stores in its `error` field so screens receive a ready-to-display string.

### 4.6 Endpoints

**`src/api/endpoints.ts`** — per-domain `as const` typed objects:

```typescript
export const productEndpoints = { allProducts: 'allProducts', ... } as const;
export const cartEndpoints    = { postCartSaveItem: 'postCartSaveItem', ... } as const;
export const orderEndpoints   = { ... } as const;
// auth, address, wishlist domains follow same pattern
```

### 4.7 Backend API envelope

All responses follow:
```json
{ "statusCode": 1, "result": [...], "userMessage": "..." }
```

`statusCode === 1` means success. Domain `index.ts` files handle unwrapping where needed (see `order/index.ts` which unwraps `postOrderHistory` and `postCnfOrderDetail` before returning to screens).

### 4.8 ProductInterface — current live API shape

The `ProductInterface` was rewritten to match the live API response from the `allProducts` endpoint:

```typescript
export interface ProductVariant {
    InventoryID: string;
    Variant: string;
    Stock: number;
    SKU: string;
    PriceDetails: { Price: number; ComparePrice: number; };
}

export interface ProductInterface {
    ItemID: number;
    Name: string;
    Description: string;
    SubcategoryID: string;
    Images: string;           // relative path — full URL resolution TBD from backend
    CreatedDate: string;
    BrandID: string;
    BrandName: string;
    SCName: string;
    CategoryID: string;
    CategoryName: string;
    CategoryImage: string;    // full Cloudinary URL
    MinPrice: number;
    MaxComparePrice: number;
    Variants: ProductVariant[];
}
```

Old flat fields (`Item_Id`, `Brand_Name`, `Price`, `ComparePrice`, `Inventory_Id`) from the pre-live API shape are gone.

### 4.9 Adapter/domain normalization layer — intentionally absent

A Phase 4A experiment added `src/api/adapters/orderAdapter.ts` and `src/api/adapters/sessionAdapter.ts` to normalize DTOs into clean domain models (`Order`, `UserSession`). These were subsequently removed. The current architecture decision:

- Screens consume DTOs directly from the API
- No adapter/normalization layer, no domain model separation
- Reduces indirection for the current team/scope
- `useSession` returns `LoggedInCustomerInterface | null` directly — the raw DTO type, not a normalized domain model
- If complexity warrants it, adapters can be reintroduced per-domain — but not as the default pattern

### 4.10 Mock layer

**`src/api/mock/mockData.ts`** — complete in-memory dataset: products, categories, brands, cart items, delivery addresses, order history, wishlist items, customer profile.

Each domain's `mock*.ts` file has stateful in-memory arrays (cart items, wishlist items, addresses) that mutate across mock API calls within a session. `MOCK_DELAY_MS = 600` in `src/config/env.ts` simulates network latency.

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

`Type.*` presets are `satisfies TextStyle`-typed and broadly adopted across all Phase 2 frozen screens. Always use a matching preset before writing inline `fontSize`/`fontWeight`.

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

Font files installed in `assets/fonts/`, registered in `ios/EcommerceApp/Info.plist` and `android/app/src/main/assets/fonts/`.

### 5.4 Motion vocabulary (`src/theme/motion.ts`)

Three curves, three durations. Every animation must bind to one — ad-hoc durations are a review failure.

```
Motion.duration.tap    = 120ms  — press states, icon fills, badge bumps
Motion.duration.settle = 320ms  — list entrances, screen-in, sheet rise
Motion.duration.carry  = 560ms  — hero parallax, success draw, image scrub
Motion.spring.settle   — damping 18, stiffness 80 (list entrances)
Motion.spring.snap     — damping 14, stiffness 180 (badge pops, tight snaps)
Motion.pressScale      = 0.98   — press-in scale target
```

### 5.5 Tailwind config (`tailwind.config.js`)

The NativeWind Tailwind config mirrors the token system — all token colors are available as Tailwind class names:

```
bg-surface, bg-surfaceDeep, bg-accent, text-ink1, text-ink3, border-rule, etc.
```

This allows className-based styling in new NativeWind work to use the same semantic names as `Colors.*` token imports.

---

## 6. Component Library

### 6.1 Primitives layer (`src/components/primitives/`)

Thin NativeWind-ready wrappers over React Native core components. Enables `className` prop on primitives used in NativeWind-migrated screens. Exported: `Box`, `VStack`, `HStack`, `Text`, `Pressable`, `Button`/`ButtonText`/`ButtonSpinner`, `Divider`, `ScrollView`, `Image`.

These are structural primitives — they have no design opinions. Use `className` for layout/static styling, `style={}` for dynamic/runtime values.

### 6.2 UI components (`src/components/ui/`)

Presentational components with no side effects:

| Component | Status | Notes |
|---|---|---|
| `Button` | Active | Variant/size system. Phase 2 frozen screens use `PrimaryButton` / `TextLinkButton` for CTAs. Use `Button` for secondary/ghost/destructive. |
| `PrimaryButton` | Active | Full-width ink pill CTA wrapping `useTactile`. Canonical primary action. |
| `TextLinkButton` | Active | Underlined text-link secondary action. |
| `HeroNavButton` | Active | Glass-circle icon button for floating hero overlays (ProductScreen back/wishlist/cart). |
| `ProductIdentity` | Active | Brand label + serif name + price as a reusable semantic unit. |
| `VariantSheet` | Active | Bottom-sheet variant picker. Uses local `Actionsheet` (gorhom/bottom-sheet). |
| `BottomNavBar` | Active | Badge reads `cartCount` from CartContext, ember accent dot. |
| `EmptyState` | Active | Use editorial copy (e.g. "Nothing saved yet." not "No items found."). |
| `ErrorBanner` | Active | Inline error within loaded screens. |
| `Skeleton` / `SkeletonRow` | Active | Loading placeholders. |
| `ScreenHeader` | Active | Plain and transparent variants. |
| `QuantityStepper` | Active | sm/md sizes. Phase 2 CartScreen uses inline minimal control instead. |
| `StatusBadge` | Active | 5 order statuses. |
| `SearchBar` | Active | |
| `Price` | Active | Currency `$`, `size` prop (sm/base/lg/xl). Use on light backgrounds only. |
| `FloatingLabelInput` | Active | Static-label underline input. Used in Login; safe for AddressScreen. |
| `DarkHeader` | Active | Dark editorial header. Props: `eyebrow`, `title`, `titleFont`, `onBack`, `rightSlot`, `paddingTop`. Used by WishlistScreen, OrderHistoryScreen, OrderDetailScreen, ResultScreen. |
| `FadeImage` | Active | `Animated.Image` with opacity fade-in on load. Uses `Motion.duration.settle`. |
| `Toast` | Active | App-level toast component (rendered via sonner-native). |
| `Rating` | **Deprecated** | `@deprecated` JSDoc present. Zero screen usage. Adopt before use. |
| `SectionLabel` | **Deprecated** | `@deprecated` JSDoc present. Zero screen usage. |

### 6.3 System components (`src/components/system/`)

| Component | Status | Notes |
|---|---|---|
| `ErrorState` | Active | Full-screen error + retry. Used in 7 screens. |
| `RetryButton` | Active | Internal dependency of `ErrorState`. |
| `InlineError` | **Deprecated** | `@deprecated` JSDoc present. Use `ErrorBanner` instead. |

### 6.4 Gluestack component overrides (`src/components/gluestack/`)

These exist because Gluestack's overlay packages depend on `react-dom`/`react-aria`/`react-transition-group` — web-only dependencies that cannot be bundled in RN CLI without ejecting. The local overrides preserve the same import surface while using compatible native implementations:

- `Actionsheet.tsx` — reimplemented with `@gorhom/bottom-sheet` v5
- `provider.tsx` — minimal provider stub

**Do not add Gluestack overlay/modal/actionsheet packages as dependencies.** The incompatibility is fundamental to the bare RN CLI architecture. See §8.3 for the full decision record.

---

## 7. Established Patterns

### Pattern 1 — Screen API imports from domain index

```typescript
// Correct
import { getAllProducts } from '../api/product';
import { getSavedCartItems } from '../api/cart';

// Never do this — implementation files are internal
import { getAllProducts } from '../api/product/productApi';
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

### Pattern 3 — Error and empty states, never silent failures

Every data-fetching screen must render:
- `<ErrorState>` for full-page fetch failures
- `<EmptyState>` for successful fetch with zero results
- `<Skeleton>` / `<SkeletonRow>` for initial fetch loading

```tsx
if (isError) return <ErrorState title="..." message={error ?? ''} onRetry={fetchFn} retryLoading={loading} />;
if (loading && !data?.length) return <Skeleton height={...} />;
```

Inline mutation errors use `ErrorBanner`:
```tsx
{mutationError ? <ErrorBanner message={mutationError} onDismiss={() => setMutationError(null)} /> : null}
```

### Pattern 4 — Design token imports, never hardcoded values

```typescript
import { Colors, Space, Radius, Shadow } from '../theme';

// Correct
backgroundColor: Colors.surface,
padding: Space[4],

// Never do this
backgroundColor: '#F8F7F4',
padding: 16,
```

### Pattern 5 — Optimistic mutations with server correction on error

```typescript
const handleMutation = async (item) => {
  setLocalState(prev => optimisticallyUpdate(prev, item)); // immediate
  try {
    await serverMutation(item);
  } catch {
    fetchData(); // restore server-authoritative state
  }
};
```

### Pattern 6 — Storage keys from typed constant

```typescript
import { STORAGE_KEYS } from '../config/storageKeys';
AsyncStorage.getItem(STORAGE_KEYS.userData);
// Never: AsyncStorage.getItem('userData')
```

### Pattern 7 — Cart badge via `setCartCount`

CartContext stores only a count integer. Never add items to CartContext:

```typescript
const { setCartCount } = useCart();
// After confirmed server add:
setCartCount(prev => prev + quantity);
// After cart fetch:
setCartCount(items.reduce((sum, item) => sum + item.Quantity, 0));
```

### Pattern 8 — NativeWind for static layout, `style={}` for dynamic values

```tsx
// Static layout → className
<Box className="flex-1 bg-surface px-5">

// Dynamic/animated/conditional → inline style
<Animated.View style={[animatedStyle, { backgroundColor: isSelected ? Colors.ink1 : 'transparent' }]}>
```

### Pattern 9 — Haptic bindings

```typescript
const haptic = useHaptic();
haptic.light()    // variant select, row tap, wishlist toggle, qty tap
haptic.success()  // add-to-cart confirmed, order placed, checkmark draw
haptic.warning()  // login failure shake, destructive confirm
```

### Pattern 10 — Press-scale animation on primary CTAs

```typescript
const { animatedStyle, handlers } = useTactile();
// <Animated.View style={animatedStyle}>
//   <TouchableOpacity activeOpacity={1} {...handlers}>
// Or use PrimaryButton which wires useTactile internally.
```

---

## 8. Architecture Decisions

### 8.1 No Redux / Zustand / React Query

The app's global state is a single integer cart count and auth status. These libraries would add boilerplate and dependency weight for zero product gain. Context API + `useAsyncState` is the right tool at this scale. Revisit React Query if cross-screen cache sharing becomes a real need (e.g., product list cached across navigation).

### 8.2 No full cart store in CartContext

Storing cart items in CartContext creates a three-way sync problem: context, server, CartScreen local state. The lightweight counter (single integer, set by CartScreen fetch and mutations) achieves the visible goal — a correct badge — at minimal surface area. Fix for cold-start zero badge is tracked in §9 (P1-01).

### 8.3 NativeWind-first, not Gluestack ecosystem

NativeWind v4 + Tailwind v3 is the styling direction for new component work. The Gluestack overlay ecosystem (`@gluestack-ui/modal`, `@gluestack-ui/actionsheet`, etc.) was attempted but is fundamentally incompatible with bare RN CLI:

- The packages ship ESM-only (`lib/index.jsx`) which Metro cannot consume without transpilation
- They depend on `react-dom`, `react-aria`, and `react-transition-group` — web-only packages
- These cannot be bundled in React Native without ejecting to Expo or adding custom Metro config

**Resolution:**
- NativeWind-first for all static/layout styling
- Local component ownership for overlays and interactions
- `@gorhom/bottom-sheet` for bottom sheets (Reanimated-native, no web deps)
- CommonJS stubs in `src/stubs/` to silence Metro resolver errors for incompatible packages
- Keep only `@gluestack-ui/nativewind-utils` and `@gluestack-ui/actionsheet` (covered by local override)
- ProductScreen is the reference implementation for the NativeWind migration pattern

### 8.4 No TypeScript migration of plain-JS files mid-phase

`CartContext.js`, `AppNavigator.js`, `mockData.js` remain JS. Migrating them during premium UX work would expand scope without product value. TypeScript compiles cleanly with the mixed setup.

### 8.5 No enterprise design-system abstraction

The two-tier `ui/` + `system/` split is the right level of abstraction for this codebase size. The primitives layer adds a third tier only because NativeWind requires `className` support, not to introduce new abstraction.

### 8.6 No adapter/domain normalization layer by default

See §4.9. Screens consume DTOs directly. The extra indirection of adapter functions + domain types adds maintenance cost without clear benefit at current scale. `useSession` returns `LoggedInCustomerInterface | null`, not a `UserSession` domain model.

---

## 9. Known Technical Debt

### P1 — Must fix before production

| ID | Item | Files |
|---|---|---|
| P1-01 | Cart badge cold-start zero — `cartCount` starts at 0, badge shows 0 until CartScreen is visited. Fix: fetch cart count post-login. | `App.tsx`, `Login.tsx`, `CartContext.js` |
| P1-02 | Quantity mutation is single-unit — `quantityIncrement`/`quantityDecrement` adjust by one unit per call. Multi-step changes diverge from server. | `CartScreen.tsx`, `cart/cartApi.ts` |
| P1-03 | `selectProduct` is mock in dev — ProductScreen calls `selectProduct` (mock), so price shows $0.00 in dev. Product domain index routes to real `getAllProducts` but `selectProduct` mock returns flat DTO without `Variants[].PriceDetails`. | `ProductScreen.tsx`, `product/index.ts` |
| P1-04 | Product `Images` field is relative path — backend returns e.g. `MER_ORG/Products/...jpg` not a full URL. `CategoryImage` already returns full Cloudinary URL. Backend fix needed. | Backend issue |
| P1-05 | HTTP not HTTPS — iOS ATS exception required, Android `usesCleartextTraffic="true"` required. Both are production security concerns. | `.env`, backend |

### P2 — Address before scaling

| ID | Item | Notes |
|---|---|---|
| P2-01 | No auth token injection | Axios interceptor has TODO. Wire before any authenticated endpoint. |
| P2-02 | `AppNavigator.js` untyped JS | Route names are strings, `navigation.navigate()` calls unchecked at compile time. |
| P2-03 | Wishlist real backend | `wishlistApi.ts` stubs return silent empty envelopes. Real endpoints not yet available. |
| P2-04 | `heroBanner` from legacy `src/data/mockData.js` | HomeScreen still imports from the old mock file. Should migrate to `api/mock/mockData.ts`. |
| P2-05 | No error boundary at app root | Render exceptions crash the whole app. Add one in `App.tsx`. |
| P2-06 | No unit test coverage | `useAsyncState`, `apiError`, domain routers, CartContext have no tests. Jest config exists. |
| P2-07 | `allProducts` empty `subCategories` backend bug | Empty array in payload causes intermittent "Manufacturer format error" on page 1. Workaround: pass `subCategories: [7]` or document as backend bug. |
| P2-08 | Session reads bypass `useSession` in several screens | AddressScreen, OrderHistoryScreen, OrderDetailScreen, WishlistScreen still read `AsyncStorage` directly. Adopt `useSession` per-screen as each enters Phase 3 scope. ProfileScreen already migrated. |

### Resolved (for reference)

| Item | Resolution |
|---|---|
| `endpoints.js` plain JS | Migrated to `endpoints.ts` with `as const` domain objects |
| `url.js` base URL config | Deleted — base URL lives in `.env` via `react-native-dotenv` |
| Centralized `services.ts` / `integrations.ts` | Deleted — domain-organized API layer |
| `mockIntegrations.ts` | Deleted — mock implementations live in domain folders |
| Login 55KB inline SVG | Eliminated — pure RN gradient composition |
| `postDeleteCartItem` string type | Corrected to `number` |
| Wishlist stubs throwing in prod | Changed to silent empty-result envelopes |
| Cart NaN badge | CartContext rewritten to server-authoritative integer |
| `useEntrance` duplicated in 6 screens | Extracted to `src/hooks/useEntrance.ts` |
| `Price` currency `₹` mismatch | Corrected to `$`, formatting normalized |
| `Colors.star` hardcoded in Rating | Added as named token |

---

## 10. Screen Status

| Screen | Design Tokens | useAsyncState | Server Mutations | Error States | Skeleton | Phase 2 | NativeWind |
|---|---|---|---|---|---|---|---|
| Login | ✅ | — | ✅ login | ✅ inline | — | **FROZEN** | Partial |
| HomeScreen | ✅ | ✅ | — | ✅ | ✅ | **FROZEN** | No |
| ProductScreen | ✅ | ✅ | ✅ | ✅ | ✅ | **FROZEN** | **Yes (reference)** |
| CartScreen | ✅ | ✅ | ✅ | ✅ | — | **FROZEN** | No |
| OrderSuccessScreen | ✅ | — | — | — | — | **FROZEN** | No |
| ResultScreen | ✅ | Partial | — | ✅ | ✅ | Pending Phase 3 | No |
| WishlistScreen | ✅ | Partial | ❌ stubs | Partial | — | Pending Phase 3 | No |
| OrderHistoryScreen | ✅ | Partial | — | Partial | — | Pending Phase 3 | No |
| ProfileScreen | ✅ | — | — | — | — | Pending Phase 3 | No |
| AddressScreen | ✅ | Partial | ✅ | Partial | — | Pending Phase 3 | No |
| OrderDetailScreen | ✅ | ✅ | — | ✅ | ✅ | Pending Phase 3 | No |

**Frozen screens define the visual standard — do not modify Login, Home, ProductScreen, OrderSuccessScreen, CartScreen.**

**Phase 3 priority order:** ResultScreen → WishlistScreen → OrderHistoryScreen → ProfileScreen → AddressScreen → OrderDetailScreen.

---

## 11. Live API Integration

### Current integration status

| Domain | Mode | Notes |
|---|---|---|
| Product | **LIVE** | `getAllProducts`, `getCategories`, `getBrands`, `getProductsByCategory` hit real server. `selectProduct` is still mock in dev. |
| Cart | Mock in dev | `MOCK_MODE = __DEV__` |
| Auth | Mock in dev | |
| Orders | Mock in dev | |
| Address | Mock in dev | |
| Wishlist | Mock in dev (stubs in prod) | Real endpoints do not exist yet |

### allProducts endpoint specifics

- Method: POST to `allProducts`
- Payload: `{ brands: [], categories: [], subCategories: [], searchQuery: '%', priceRange: { from: null, to: null }, discount: '%', pagination: { pageNumber: 1, pageSize: 10 } }`
- Known backend issue: empty `subCategories: []` causes intermittent "Manufacturer format error" on page 1 — this is a server-side bug, not an app bug
- Response wrapped: `{ statusCode: 1, result: { TotalRecords: N, Products: [...] } }`
- Unwrapped in `productApi.ts` as `response.data?.result?.Products ?? []`
- `Images` field returns relative path (e.g. `MER_ORG/Products/123.jpg`) — backend needs to return full Cloudinary URL (as `CategoryImage` already does)

### Switching domains from mock to real

1. In the domain's `index.ts`, change `const MOCK_MODE = __DEV__` to `const MOCK_MODE = false` (or remove the guard)
2. Verify the real API shape matches the interfaces in `src/api/interfaces.ts`
3. Unwrap or normalize the response in `index.ts` if needed (see `order/index.ts` pattern)
4. Test with Reactotron to inspect the real request/response payload

### Backend API envelope

```json
{ "statusCode": 1, "result": { ... }, "userMessage": "Success" }
```

`statusCode !== 1` is an application-level failure. The axios response interceptor has a commented-out block to auto-raise these — uncomment when all screens are on `useAsyncState`.

---

## 12. NativeWind + Primitives Layer

### Architecture

NativeWind v4 is configured with `nativewind/babel` preset. The `tailwind.config.js` extends the color scale to mirror `Colors.*` tokens.

The `src/components/primitives/` folder provides thin wrappers over RN core components that pass all props through unchanged — their only purpose is to enable `className` prop support without installing Gluestack's full runtime. These are not abstractions; they are pass-throughs.

### Styling rules

- `className` for static layout (flex, padding, margins, background colors, borders)
- `style={}` for dynamic runtime values (animations, conditional colors, calculated sizes)
- Never mix NativeWind and `StyleSheet.create()` for the same concern on the same element
- Design tokens in `tailwind.config.js` mean `bg-surface` === `Colors.surface` — use Tailwind class names in NativeWind contexts, token imports in StyleSheet contexts

### Gluestack overlay incompatibility

Gluestack's overlay ecosystem (Modal, ActionSheet, Toast overlays, Popover) ships ESM-only and depends on `react-dom`, `react-aria`, and `react-transition-group`. These are web-only. Metro cannot bundle them in a bare RN CLI project without ejecting.

**What was done:**
- CommonJS stubs in `src/stubs/` silence Metro resolver errors for the problematic packages
- `src/components/gluestack/Actionsheet.tsx` re-implements the actionsheet surface using `@gorhom/bottom-sheet` — same export API, native implementation
- `VariantSheet` imports from the local `../gluestack/Actionsheet`, not from the npm package

**Rule:** Do not add `@gluestack-ui/modal`, `@gluestack-ui/popover`, `@gluestack-ui/menu`, or any other overlay-based Gluestack package. Use `@gorhom/bottom-sheet` for bottom sheets, React Native `Modal` for modals, and local implementations for anything else.

### ProductScreen as reference implementation

ProductScreen is the first screen fully migrated to NativeWind. It uses:
- Primitives (`Box`, `VStack`, `HStack`, `Divider`, `Text`, `Pressable`, `ScrollView`, `Image`) imported from `../components/primitives`
- `className` on all primitives for layout and static colors
- `style={}` + `Animated.Value` for animation states, conditional border widths, calculated dimensions
- `PrimaryButton` and `TextLinkButton` components for CTAs
- `HeroNavButton` for hero floating buttons
- `VariantSheet` (with local Actionsheet) for variant selection

---

## 13. Reactotron Setup

**`src/config/reactotron.ts`** — dev-only network inspector, imported in `index.js` before `AppRegistry`.

```typescript
Reactotron
  .configure({ host: '10.0.2.2', name: 'E-Commerce App' })
  .useReactNative({ networking: true })
  .connect();
```

`host: '10.0.2.2'` is the Android emulator alias for the host machine. For iOS simulator, `localhost` would also work but `10.0.2.2` is intentional for Android-first dev.

Use Reactotron to inspect real API requests and responses when switching a domain from mock to live. The network inspector shows the full request payload and response body.

---

## 14. Repository and Branch Strategy

| Branch | Role |
|---|---|
| `main` | Historical baseline — frozen at pre-modernization state. Do not modify. |
| `dev` | Canonical engineering branch. All work happens here. |

---

## 15. Cart Architecture

### Why a lightweight count, not a full item store

`CartContext.js` stores a single `cartCount` integer. It does not store cart items, prices, or line totals.

Storing cart items in context creates a three-way sync problem: context, server, and CartScreen's local `cartItems` state. Resolving this correctly would require either treating context as the sole source of truth (eliminating CartScreen's local state) or event-based invalidation — both are significant rewrites with no product benefit today.

The lightweight counter achieves the visible goal (correct badge) at minimal surface area.

### Badge sync points

| Event | Who sets cartCount | How |
|---|---|---|
| CartScreen fetch (on focus) | CartScreen | `items.reduce((sum, item) => sum + item.Quantity, 0)` |
| Quantity change (optimistic) | CartScreen | `setCartCount(prev => prev + delta)` |
| Item remove (optimistic) | CartScreen | `setCartCount(prev => Math.max(0, prev - item.Quantity))` |
| Clear cart | CartScreen | `setCartCount(0)` |
| Add to cart (confirmed) | ProductScreen | `setCartCount(prev => prev + quantity)` |

### Known limitation

`cartCount` starts at `0` on cold start. Badge shows 0 until CartScreen is visited. Fix: fetch cart count in `App.tsx` or the Login success handler (P1-01).

---

## 16. Premium UX Refinement — Frozen Patterns (Phase 2)

These patterns define the visual and interaction standard. Phase 3 work must follow them. Do not modify frozen screens.

### 16.1 New infrastructure (Phase 2)

#### `src/theme/fonts.ts`
```typescript
FontFamily.serif       // 'InstrumentSerif-Regular' — editorial roles
FontFamily.serifItalic // 'InstrumentSerif-Italic' — wordmarks, taglines
FontFamily.mono        // 'JetBrainsMono-Regular' — labels, order numbers, meta
FontFamily.sans        // undefined — system sans, body copy and UI text
```

#### `src/theme/motion.ts`
Three durations, all animations must bind to one:
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
Press-scale animator. Returns `{ animatedStyle, handlers }`. Wrap in `Animated.View`, spread `handlers` on `TouchableOpacity`, set `activeOpacity={1}`. Used on all primary CTAs in frozen screens. Or use `PrimaryButton` which wires this internally.

#### `src/components/ui/FloatingLabelInput.tsx`
Static-label underline input. Label always visible at `Type.label` scale. Only the underline animates on focus (1→2px, Tap curve). Used in Login; safe for AddressScreen form fields.

### 16.2 Frozen screens — key decisions

#### Login — FROZEN
Dark hero / light form panel split. 5-layer `LinearGradient` atmospheric composition. No images, no SVG. Staggered spring entrance. Failure as inline caption + button shake + `haptic.warning()`.

#### HomeScreen — FROZEN
Architecture exception: HomeScreen retains its own local `useEntrance` (500ms/440ms, `initialY=14`) — do not replace with the shared hook. Serif wordmark hero, category pill rail, `ProductCard` with ember badge.

#### ProductScreen — FROZEN
NativeWind reference implementation. Clean full-bleed hero, identity plate below the image (brand `Type.label` → name `Type.heading` → price `Type.priceLarge`). Ember discount marker. Hairline variant chips with ink stroke on selected. `HeroNavButton` for floating nav. `PrimaryButton` + `TextLinkButton` CTA pair. `VariantSheet` for variant selection.

#### OrderSuccessScreen — FROZEN
72px ember ring scales from 0.52→1.0 on Carry curve. `haptic.success()` at completion. Staggered Settle content entrance. Editorial copy. Primary + text-link CTA hierarchy.

#### CartScreen — FROZEN
No card boxing — hairline `Colors.rule` dividers. 4:5 portrait image ratio. Inline `−  N  +` mono qty control. `Colors.surfaceDeep` summary panel. `Shadow.sm` only. Editorial empty state copy.

### 16.3 Binding patterns for Phase 3

**Type hierarchy:**
- White-on-dark (hero): `serifItalic` wordmarks/headlines; `Type.label` mono eyebrows; raw `'#FFFFFF'`
- Light surface: `Type.heading`/`Type.title` serif for names; `Type.priceLarge`/`Type.price` serif for prices; `Type.label` mono for brands/eyebrows; `Type.body`/`Type.caption` sans for copy

**CTA hierarchy:**
- Primary: full-width ink pill, 52px height, `Type.bodyStrong` white, `useTactile` (or `PrimaryButton`)
- Secondary: `Type.caption` underlined text link, no pill, `Colors.ink3` (or `TextLinkButton`)
- Never two equal-weight CTAs side by side

**Price display:**
- Current price: `Type.priceLarge` or `Type.price` (serif) — never sans bold
- Was-price: `Type.caption` + `FontFamily.mono` + `textDecorationLine: 'line-through'` + `Colors.ink4`
- Discount badge: `Colors.accentTint` fill + `Colors.accent` border + `Type.label` — never `Colors.danger`

**Elevation:** No `Shadow.md`/`Shadow.lg` on inline cards. `Shadow.sm` only on sticky overlapping surfaces. Depth through surface tone (`surface` → `surfaceSoft` → `surfaceDeep`), not shadow.

**Dividers:** `Colors.rule` hairline only. No rounded-corner card boxing for list items.

**Anti-patterns to never reintroduce:**
- `Colors.danger` for discount badges → use `Colors.accentTint`/`Colors.accent`
- `FontWeight.bold`/`semibold` on product names/prices → use `FontFamily.serif`
- `Shadow.md`/`Shadow.lg` on inline cards
- `Colors.success` (green) for success moments → use `Colors.accent` (ember)
- Equal-weight dual CTA buttons → primary pill + subordinate text link
- `Alert.alert()` for form errors → inline error + shake animation

### 16.4 `useEntrance` shared hook

`src/hooks/useEntrance.ts` — `useEntrance(delay = 0, withScale = false, initialY = 10)`.

Used by: CartScreen, WishlistScreen, OrderHistoryScreen, ProfileScreen, ResultScreen.

**Exception:** HomeScreen retains its own local `useEntrance` (different durations: 500ms/440ms, `initialY=14`). Do not replace — the different timing is intentional for the hero's heavier feel.

### 16.5 Phase 3 priority order

1. ResultScreen — high visibility, `ProductCard` already frozen
2. WishlistScreen — emotional screen, current grid reads as marketplace not curated edit
3. OrderHistoryScreen — hairline rows, `StatusBadge` retone
4. ProfileScreen — flat hairline layout, serif header, quick win
5. AddressScreen — `FloatingLabelInput` already exists, reuse for address form
6. OrderDetailScreen — `DetailRow` flat layout, SafeAreaView fix bundled

---

*This document is the canonical engineering reference. `docs/ui-audit.md` is historical only (pre-modernization state). For the premium UX spec, see `docs/premium-ux-refinement-spec.md`.*
