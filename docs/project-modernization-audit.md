# Project Modernization Audit — E-Commerce React Native App

**Created:** 2026-05-12
**Branch at time of writing:** `dev` (canonical)
**TypeScript status at time of writing:** 0 errors, 51 files compiled clean

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Original Architecture and UI Problems](#2-original-architecture-and-ui-problems)
3. [Design System Modernization](#3-design-system-modernization)
4. [Resilience Architecture Rollout](#4-resilience-architecture-rollout)
5. [Async Orchestration Rollout](#5-async-orchestration-rollout)
6. [API and Error Infrastructure](#6-api-and-error-infrastructure)
7. [Cart Architecture Stabilization](#7-cart-architecture-stabilization)
8. [Current Frontend Architecture State](#8-current-frontend-architecture-state)
9. [Stable Engineering Patterns Now Standard](#9-stable-engineering-patterns-now-standard)
10. [Architecture Decisions Intentionally Avoided](#10-architecture-decisions-intentionally-avoided)
11. [Remaining Technical Debt (P1/P2)](#11-remaining-technical-debt-p1p2)
12. [Backend Integration Readiness](#12-backend-integration-readiness)
13. [Repository and Branch Strategy](#13-repository-and-branch-strategy)
14. [Recommended Future Evolution Path](#14-recommended-future-evolution-path)
15. [Migration Timeline Summary](#15-migration-timeline-summary)

---

## 1. Executive Summary

This document is the canonical engineering reference for the E-Commerce React Native app. It records where the project started, what was broken and why, every architectural decision made during the modernization effort, and what remains to be done.

The app is a React Native e-commerce client (iOS + Android) supporting: product browsing, category/search results, product detail, cart, checkout with address management, order history, order detail, wishlist, and profile. Authentication is username/password with the customer profile code persisted via AsyncStorage.

**What the project was at the start of the modernization effort:**
A working but fragile first-pass implementation. Core flows existed end-to-end but screens were islands — duplicating styles, hardcoding colors, using the API layer inconsistently, and having no shared component library. The cart was architecturally broken: it maintained local state that was never synced to the server, the badge showed NaN, and mutations (quantity change, remove) were optimistic-only with no server calls.

**What the project is now:**
A modernized codebase with a complete design token system, a shared UI and system component library, a structured API error hierarchy, a mock/real API routing layer, a cancellation-safe async state hook, and a server-authoritative cart badge. TypeScript compiles cleanly across all 51 files. The `dev` branch is the single canonical branch.

**What has NOT been done yet (by design):**
Full server synchronization of cart state across all screens, migration of remaining plain-JS files to TypeScript, real wishlist backend endpoints, and a complete error boundary strategy. These are recorded in [Section 11](#11-remaining-technical-debt-p1p2).

---

## 2. Original Architecture and UI Problems

### 2.1 Tech Stack (unchanged — preserved as-is)

| Layer | Choice |
|---|---|
| Framework | React Native 0.81.4 |
| Language | TypeScript 5.8.3 (mixed with JS in some legacy files) |
| Navigation | React Navigation v7 (Stack) |
| HTTP | Axios with centralized instance |
| State | Context API + useState (local) + AsyncStorage (auth) |
| Icons | react-native-vector-icons |
| Animations | lottie-react-native, Animated API |

### 2.2 Original structural problems

**No shared design language.** Every screen defined its own colors as hardcoded hex strings. Seven distinct near-white background values existed across the codebase. Five different blue primaries were in use simultaneously. There was no spacing scale — padding values were arbitrary per-screen.

**No shared component library.** BottomNavBar was copy-pasted across three screens with subtle differences that had already diverged. PrimaryButton, EmptyState, ScreenHeader, and LoadingSkeleton were each reinvented per screen.

**No typography system.** Font sizes were raw numbers. Font weights were raw strings. No semantic hierarchy (display, heading, body, caption) existed.

**Broken CartContext.** `CartContext.js` maintained a local `items[]` array managed by a useReducer. This array was never hydrated from the server. `addToCart()` was called with an empty object literal `{}` from ProductScreen, writing a phantom item with `id: undefined` into the array. `getCartItemsCount()` reduced over this array and returned NaN. The badge on HomeScreen permanently showed NaN or 0. The CartScreen fetched real items from the server independently — the two data sources were entirely disconnected.

**No cart mutation server calls.** CartScreen's quantity +/− and remove actions updated local state only. The server was never informed. On the next CartScreen focus, the refetch would overwrite local state, silently discarding all user interactions.

**No error infrastructure.** Every API call was wrapped in a `try/catch` that called `console.error(...)` and re-threw. Screens had no structured way to show user-facing error messages. Error kinds (timeout, network failure, server 4xx/5xx, application envelope failure) were indistinguishable.

**No async state management.** Each screen managed its own `loading`, `error`, and `data` state with separate `useState` calls. Race conditions were common: a slow fetch returning after a fast subsequent fetch would overwrite newer data. No cancellation mechanism existed.

**No mock/offline layer.** Every screen required a live backend to function at all. Development without network access was impossible.

**API layer called directly from screens.** Screens imported from `integrations.ts` directly. There was no abstraction layer between screens and the HTTP implementation. Switching to mock data required changing every import in every screen.

**Wishlist screen unregistered.** `WishlistScreen.tsx` existed but was not registered in the navigator. It could never be navigated to.

**ProfileScreen wrong route name.** `navigation.navigate('OrderScreen')` — the route does not exist. The registered name is `'Orders'`. Tapping "My Orders" from profile was a silent no-op.

**OrderDetailScreen SafeAreaView absent.** Used `StatusBar.currentHeight` as a content container padding, which is Android-only and broken on iOS.

**Login screen SVG payload.** A 55 KB SVG string was embedded inline inside a WebView render. This inflated the JS bundle and caused a WebView initialization cost on every login screen mount.

### 2.3 Why these problems existed

The app was built feature-first — all flows implemented before any shared abstractions. This is correct for validating product scope but creates compounding debt when the codebase grows past ~5 screens. At 10+ screens, the absence of a design token system, shared components, and structured async patterns produces exponentially increasing maintenance cost.

---

## 3. Design System Modernization

### 3.1 What was introduced

**`src/theme/tokens.ts`** — Single source of truth for all visual primitives:

```
Colors    — accent, surfaces, ink scale (ink1–ink5), semantic (danger, success, warning, info), tints, borders
Space     — 4px base grid (1=4px, 2=8px, … 12=48px) + named density constants (screenH, gapRow, padCard, padTap)
Radius    — xs/sm/md/lg/pill
FontSize  — xs/sm/base/md/lg/xl/2xl/3xl/4xl
FontWeight — regular/medium/semibold/bold (typed string literals)
LineHeight — tight/snug/normal (multipliers, not raw px)
Shadow    — sm/md/lg (cross-platform: iOS shadow props + Android elevation)
ZIndex    — base/raised/overlay/modal/toast
```

**`src/theme/typography.ts`** — Pre-built `TextStyle` presets for semantic type roles:

```
Type.display       — hero headlines, order success, login
Type.title         — screen section titles
Type.heading       — card headings, screen header title
Type.body          — primary body text
Type.bodyStrong    — emphasized body
Type.caption       — descriptions, metadata, secondary info
Type.captionStrong — emphasized secondary
Type.label         — uppercase micro-labels, brand names, field labels
Type.price         — price figures, tabular rhythm
Type.tab           — tab bar labels
```

**`src/theme/index.ts`** — Re-export barrel. All screens import from `'../theme'`.

### 3.2 Why this approach

A single token file eliminates the category of "wrong color in one screen" bugs. When `Colors.danger` needs to change, it changes in one place and propagates to all 51 compiled files. The alternative — hunting through 13 screen files for every hardcoded `#D7263D` — does not scale.

`satisfies TextStyle` is used on every typography preset. This means TypeScript catches invalid style properties at definition time, not at runtime on device.

Platform-specific shadow handling is centralized. Every previous screen had slightly different shadow configurations or omitted them entirely. `Shadow.md` is now the canonical medium shadow regardless of platform.

### 3.3 Shared UI component library

**`src/components/ui/`** — Presentational components with no side effects:

| Component | Purpose |
|---|---|
| `Button` | Primary/secondary/ghost/danger variants, sm/md/lg sizes, loading state |
| `QuantityStepper` | +/− quantity control, min/max bounds, sm/md sizes |
| `Price` | Formatted price display with optional strikethrough "was" price |
| `Rating` | Star rating display |
| `StatusBadge` | Order status chip (Pending/Confirmed/Shipped/Delivered/Cancelled) |
| `SearchBar` | Themed search input |
| `SectionLabel` | Section heading with optional action link |
| `ScreenHeader` | Consistent back button + title header |
| `BottomNavBar` | Tab bar with active state, used on Home/Cart/Orders/Profile |
| `EmptyState` | Icon + title + body + optional CTA action |
| `ErrorBanner` | Inline error with retry, used inside loaded content areas |
| `Skeleton` / `SkeletonRow` | Loading placeholder shapes |

**`src/components/system/`** — State management components with layout:

| Component | Purpose |
|---|---|
| `ErrorState` | Full-screen error with icon, title, message, and retry button |
| `InlineError` | Small inline error message for form fields or section errors |
| `RetryButton` | Standalone retry trigger with loading state |

### 3.4 Why a two-tier component split

`ui/` components are purely presentational — they take props and render. They have no knowledge of navigation, AsyncStorage, or API calls. They can be tested in isolation and composed freely.

`system/` components are opinionated state-rendering components. They own layout decisions for specific application states (full-screen error, inline error). Separating them prevents `ui/` from being polluted with application concerns.

---

## 4. Resilience Architecture Rollout

### 4.1 The problem being solved

Pre-modernization: when an API call failed, screens showed nothing. No error message, no retry button, no loading indicator. The screen silently stayed in a loading state or showed stale/empty data. Users had no signal that something went wrong or any path to recover.

### 4.2 What was introduced

Every data-fetching screen now follows this state model:

```
idle → loading → success (render data)
                → error (render ErrorState with retry)
```

For inline data (within a loaded screen), `ErrorBanner` is used. For full-page fetch failures, `ErrorState` from `components/system` is used with an `onRetry` prop wired to re-trigger the fetch.

Skeleton loading states replace blank screens during initial fetch. `SkeletonRow` groups skeletons for list patterns. This makes the loading state informative rather than an invisible delay.

### 4.3 Why optimistic UI was preserved

Cart quantity changes and item removal use optimistic updates — the UI reflects the change immediately before the server confirms. This is the correct trade-off: cart mutations are low-risk reversals (the item will reappear or the old count will restore on refetch if the server rejects), and the latency of waiting for server confirmation on every tap would make the cart feel slow and broken.

On server error: the optimistic change is shown briefly, then `fetchCart()` is called, which resets both local cart items and the badge to the server-authoritative state.

---

## 5. Async Orchestration Rollout

### 5.1 The problem being solved

Every screen had duplicated async state management:

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

useEffect(() => {
  setLoading(true);
  fetchSomething()
    .then(res => { setData(res); setLoading(false); })
    .catch(err => { setError(err); setLoading(false); });
}, []);
```

This pattern has two silent failure modes:
1. **Race condition:** a slow fetch completes after a subsequent fast fetch, overwriting newer data with stale results.
2. **Unmounted state update:** component unmounts while fetch is in flight, setting state on an unmounted component (warning in development, potential crash in production).

### 5.2 `useAsyncState` — the solution

**`src/hooks/useAsyncState.ts`** — a cancellation-safe async state hook:

```typescript
const { data, loading, isError, error, run, reset } = useAsyncState<T>(initialData);
```

Key properties:
- `run(fn, cancelled?)` — executes `fn`, manages `idle → loading → success/error` transition
- **Cancellation-safe:** accepts a `{ current: boolean }` ref. If `cancelled.current` is true when the async operation resolves, no state update fires. This eliminates both race conditions and unmounted-component warnings.
- **Integrated with `useFocusEffect`:** the standard pattern passes the cancellation ref from the effect cleanup, making screen-focus refetching safe by default.
- **Error messages via `userFacingMessage()`:** errors are always converted to human-readable strings before being stored, so screens never need to inspect raw error objects.

Standard usage pattern across all screens:

```typescript
useFocusEffect(
  useCallback(() => {
    const cancelled = { current: false };
    run(() => fetchData(), cancelled);
    return () => { cancelled.current = true; };
  }, [run]),
);
```

### 5.3 Why not React Query or SWR

React Query and SWR solve the same problems but introduce a significant dependency with its own cache model, query key conventions, and mental model. The project's data fetching needs are straightforward — each screen fetches its own data on focus, with no cross-screen cache sharing required. `useAsyncState` provides the same cancellation safety and state machine with ~90 lines of code and zero dependencies. If the project grows to require cross-screen cache sharing, background refetch, or stale-while-revalidate, React Query becomes the correct upgrade path. That decision was deferred deliberately.

---

## 6. API and Error Infrastructure

### 6.1 Error classification

**`src/api/apiError.ts`** — Structured error hierarchy:

```typescript
type ApiErrorKind = 'timeout' | 'network' | 'server' | 'application'
```

- `timeout` — request exceeded the 10 second axios timeout
- `network` — no response received (offline, DNS failure, connection refused)
- `server` — HTTP 4xx/5xx with a response body
- `application` — HTTP 200 but `statusCode !== 1` in the API response envelope

`classifyError(err)` converts any caught value into a structured `ApiError`. The axios response interceptor in `axiosInstance.ts` calls this automatically for all HTTP/network failures, so screens never need to inspect raw axios errors.

`userFacingMessage(err)` extracts a safe human-readable string from any error type. This is what `useAsyncState` stores in its `error` field — screens receive a ready-to-display string, not a raw Error object.

`apiLog(context, err)` logs only in dev/mock mode. In production, sensitive stack traces and URL paths never reach the console.

### 6.2 The service routing layer

**`src/api/services.ts`** — Single import point for all screens:

```typescript
const api = MOCK_MODE ? mock : real;
export const getAllProducts = api.getAllProducts;
// ... all functions exported uniformly
```

`MOCK_MODE` is driven by `src/config/env.ts`:

```typescript
export const MOCK_MODE: boolean = __DEV__;
```

In Metro dev builds: mock layer. In release builds: real HTTP layer.

**Why this matters:** Screens import from `'../api/services'` exclusively. They have no knowledge of whether they're hitting real HTTP or in-memory mock data. Switching between environments requires changing one constant, not touching 10 screens.

### 6.3 Mock layer

**`src/api/mock/mockData.ts`** — Complete in-memory dataset: products, categories, brands, cart items, delivery addresses, order history, order detail, wishlist items, customer profile.

**`src/api/mock/mockIntegrations.ts`** — Runtime stateful mock: `_cartItems`, `_wishlistItems`, `_addresses` are mutable in-memory arrays that persist across mock API calls within a session. Add-to-cart, remove, quantity changes all mutate these arrays, making the mock layer behave like a real backend for development and testing.

`MOCK_DELAY_MS = 600` simulates network latency to make loading states visible during development.

### 6.4 Axios instance

**`src/api/axiosInstance.ts`** — Centralized axios configuration:

- Base URL: `http://122.175.15.28:8110/api/ecomm/`
- Timeout: 10,000ms
- Request interceptor: placeholder for auth token injection (TODO comment with exact implementation pattern)
- Response interceptor: classifies all HTTP/network errors via `classifyError()`, logs via `apiLog()`
- TODO comment in response interceptor: envelope-level failure auto-raise (currently off to avoid breaking screens that check `statusCode` themselves)

### 6.5 Storage key management

**`src/config/storageKeys.ts`** — Single typed source of truth:

```typescript
export const STORAGE_KEYS = {
  userData: 'userData',
} as const;
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
```

**`src/constants/storage.ts`** — Re-export shim for backward compatibility. New files import from `'../config/storageKeys'`. Legacy files can migrate incrementally.

---

## 7. Cart Architecture Stabilization

### 7.1 The original cart failure chain

```
User taps "Add to Cart"
→ handleAddToCart() called
→ const productToAdd = {}          ← empty object, not real product data
→ postSaveCartItems(requestbody)   ← fire-and-forget, no await
→ navigation.navigate('Cart')      ← fires immediately, before server confirms
→ addToCart(productToAdd)          ← writes {} into CartContext items array
→ CartContext: items = [{id: undefined, quantity: 1, ...}]
→ HomeScreen badge: items.reduce(total + item.quantity) → 1 (phantom count)
→ CartScreen opens, fetches real server cart (getSavedCartItems)
→ CartContext untouched — badge and server cart permanently out of sync
```

Additionally, CartScreen quantity and remove changes only mutated local state. On next CartScreen focus, `useFocusEffect` refetched from server, silently discarding all mutations.

### 7.2 P0 fix — ProductScreen

- Removed `addToCart({})` call entirely. CartContext is no longer written by ProductScreen.
- `handleAddToCart` is now `async`. Navigation to Cart only fires after `await postSaveCartItems()` succeeds.
- `handleBuyNow` no longer double-navigates (previously called `handleAddToCart()` which navigated, then also called `navigation.navigate('Cart')` itself).
- `useCart` import removed from ProductScreen.

### 7.3 P0 fix — CartScreen mutations

`handleUpdateQuantity` now:
1. Computes `delta = quantity - item.Quantity`
2. Applies optimistic local state update immediately
3. Calls `quantityIncrement` or `quantityDecrement` depending on delta sign
4. On server error: calls `fetchCart()` which refetches and resets state to server truth

`handleRemoveItem` now:
1. Applies optimistic local filter immediately
2. Calls `postDeleteCartItem(String(item.CartDetailsCode))`
3. On server error: calls `fetchCart()` to restore the item

`clearCart` now also resets `cartCount` to 0 in context.

### 7.4 Cart badge synchronization — lightweight approach

CartContext was rewritten from a full item-array reducer to a single integer counter:

**Before:** `useReducer` with `items[]`, `ADD_TO_CART`, `REMOVE_FROM_CART`, `UPDATE_QUANTITY`, `CLEAR_CART` — all local, never server-synced.

**After:**
```javascript
const [cartCount, setCartCount] = useState(0);
// exposed: { cartCount, setCartCount }
```

Badge sync points:

| Event | Who sets cartCount | How |
|---|---|---|
| CartScreen fetch (on focus) | CartScreen `useEffect` | `fetched.reduce((sum, item) => sum + item.Quantity, 0)` |
| Quantity change (optimistic) | CartScreen | `setCartCount(prev => prev + delta)` |
| Item remove (optimistic) | CartScreen | `setCartCount(prev => Math.max(0, prev - item.Quantity))` |
| Clear cart | CartScreen | `setCartCount(0)` |
| Add to cart (confirmed) | ProductScreen | `setCartCount(prev => prev + quantity)` |

HomeScreen reads `cartCount` directly: `const { cartCount: cartItemsCount } = useCart()`.

**Why this approach instead of a full cart store:**
The badge needs to show a count. It does not need cart item data for rendering. A full cart store (items, prices, line totals) on CartContext would require keeping it synchronized with every server mutation across every session — a significantly larger surface area. The lightweight counter defers that complexity to a future session while fixing the visible bug now.

### 7.5 Known limitation of the current cart badge approach

`cartCount` starts at `0` on cold start and is only populated when CartScreen is visited. If a user logs in and goes directly to HomeScreen without visiting CartScreen, the badge shows 0 even if the server has items. Fix: either fetch cart count on login/app resume, or lift a `fetchCartCount` call into `App.tsx` post-auth.

---

## 8. Current Frontend Architecture State

### 8.1 File tree

```
src/
├── api/
│   ├── apiError.ts          ← Error classification hierarchy
│   ├── axiosInstance.ts     ← Centralized axios, interceptors
│   ├── endpoints.js         ← Endpoint string constants (JS, not yet migrated)
│   ├── integrations.ts      ← Real HTTP API functions
│   ├── interfaces.ts        ← All TypeScript API interfaces
│   ├── services.ts          ← Mock/real router — all screens import from here
│   ├── url.js               ← Base URL constant (JS, not yet migrated)
│   └── mock/
│       ├── mockData.ts      ← Complete in-memory dataset
│       └── mockIntegrations.ts  ← Stateful mock API functions
├── components/
│   ├── CartItem.js          ← Legacy JS, uses ui/ components internally
│   ├── CategoryItem.tsx     ← Themed, uses design tokens
│   ├── ProductCard.tsx      ← Themed, animated image fade-in, discount badge
│   ├── system/
│   │   ├── ErrorState.tsx   ← Full-screen error + retry
│   │   ├── InlineError.tsx  ← Inline error message
│   │   ├── RetryButton.tsx  ← Retry action
│   │   └── index.ts
│   └── ui/
│       ├── BottomNavBar.tsx, Button.tsx, EmptyState.tsx, ErrorBanner.tsx
│       ├── Price.tsx, QuantityStepper.tsx, Rating.tsx, ScreenHeader.tsx
│       ├── SearchBar.tsx, SectionLabel.tsx, Skeleton.tsx, StatusBadge.tsx
│       └── index.ts
├── config/
│   ├── env.ts               ← MOCK_MODE, MOCK_DELAY_MS
│   └── storageKeys.ts       ← Typed STORAGE_KEYS constant
├── constants/
│   └── storage.ts           ← Re-export shim (backward compat)
├── context/
│   └── CartContext.js       ← cartCount integer + setCartCount only
├── data/
│   └── mockData.js          ← Legacy mock (heroBanner still used by HomeScreen)
├── hooks/
│   └── useAsyncState.ts     ← Cancellation-safe async state hook
├── navigation/
│   └── AppNavigator.js      ← Stack navigator, 11 routes
├── screens/
│   ├── AddressScreen.tsx
│   ├── CartScreen.tsx       ← Server-wired mutations, useAsyncState
│   ├── HomeScreen.tsx       ← Design tokens, useCart badge
│   ├── Login.tsx
│   ├── OrderDetailScreen.tsx
│   ├── OrderHistoryScreen.tsx
│   ├── OrderSuccessScreen.tsx
│   ├── ProductScreen.tsx    ← Server-confirmed add to cart, no phantom writes
│   ├── ProfileScreen.tsx
│   ├── ResultScreen.tsx
│   └── WishlistScreen.tsx
└── theme/
    ├── index.ts             ← Re-export barrel
    ├── tokens.ts            ← All design primitives
    └── typography.ts        ← Semantic TextStyle presets
```

### 8.2 Screen status

| Screen | Uses design tokens | Uses useAsyncState | Server mutations wired | Error states | Skeleton loading |
|---|---|---|---|---|---|
| Login | ✅ | — | ✅ (login) | Partial | — |
| HomeScreen | ✅ | ❌ (useState) | — | ❌ | Partial |
| ProductScreen | ✅ | ✅ | ✅ | ✅ | ✅ |
| CartScreen | ✅ | ✅ | ✅ | ✅ | — |
| ResultScreen | ✅ | Partial | — | ✅ | ✅ |
| AddressScreen | ✅ | Partial | ✅ | Partial | — |
| OrderHistoryScreen | ✅ | Partial | — | Partial | — |
| OrderDetailScreen | ✅ | ✅ | — | ✅ | ✅ |
| OrderSuccessScreen | ✅ | — | — | — | — |
| ProfileScreen | ✅ | — | — | — | — |
| WishlistScreen | ✅ | Partial | ❌ (stubs) | Partial | — |

---

## 9. Stable Engineering Patterns Now Standard

The following patterns are established and should be continued for all new work.

### Pattern 1 — All screens import API functions from `services.ts` only

```typescript
// Correct
import { getAllProducts, getCategories } from '../api/services';

// Never do this
import { getAllProducts } from '../api/integrations';
```

### Pattern 2 — `useAsyncState` for all data fetching with focus-aware cancellation

```typescript
const { data, loading, isError, error, run } = useAsyncState<MyType[]>([]);

useFocusEffect(
  useCallback(() => {
    const cancelled = { current: false };
    run(() => fetchSomething(), cancelled);
    return () => { cancelled.current = true; };
  }, [run]),
);
```

### Pattern 3 — Design token imports, never hardcoded values

```typescript
import { Colors, Space, Radius, Shadow, FontSize, FontWeight } from '../theme';

// Correct
backgroundColor: Colors.surface,
padding: Space[4],
borderRadius: Radius.md,

// Never do this
backgroundColor: '#FFFFFF',
padding: 16,
borderRadius: 12,
```

### Pattern 4 — Error and empty states, never silent failures

Every screen that fetches data must render:
- `ErrorState` (from `components/system`) for full-page fetch failures
- `EmptyState` (from `components/ui`) for successful fetch with zero results
- Skeleton for loading state on initial fetch

### Pattern 5 — Optimistic mutations with server correction on error

```typescript
const handleMutation = async (item) => {
  // 1. Optimistic update — immediate
  setLocalState(prev => optimisticallyUpdate(prev, item));

  try {
    // 2. Server call — awaited
    await serverMutation(item);
  } catch {
    // 3. Server error — refetch authoritative state
    fetchData();
  }
};
```

### Pattern 6 — Storage keys from typed constant, never raw strings

```typescript
// Correct
import { STORAGE_KEYS } from '../config/storageKeys';
AsyncStorage.getItem(STORAGE_KEYS.userData);

// Never do this
AsyncStorage.getItem('userData');
```

### Pattern 7 — Cart badge sync via `setCartCount`, never `addToCart`

CartContext no longer stores cart item data. Do not add items to CartContext. Only update `cartCount`:

```typescript
const { setCartCount } = useCart();
// After confirmed server add:
setCartCount(prev => prev + quantity);
// After server fetch:
setCartCount(items.reduce((sum, item) => sum + item.Quantity, 0));
```

---

## 10. Architecture Decisions Intentionally Avoided

These were considered and rejected. Do not introduce them without re-evaluating the tradeoffs.

### Redux / Redux Toolkit

**Why avoided:** The app's global state needs are limited to a cart badge count and auth status. Redux adds a significant boilerplate surface, a store configuration file, slice definitions, and changes the mental model for all future contributors. The problem being solved did not justify this. If the app adds real-time sync, offline-first support, or cross-device cart sharing, Redux becomes a reasonable consideration.

### React Query / TanStack Query / SWR

**Why avoided:** These libraries solve cache management, background refetch, stale-while-revalidate, and optimistic updates with rollback. The project needs basic cancellation-safe fetching per screen. `useAsyncState` provides exactly that with no dependencies. Introducing React Query before the basic async patterns were stable would have added configuration complexity without resolving the immediate bugs. Revisit when cross-screen cache sharing is needed (e.g., product list cached so navigating back from ProductScreen does not trigger a full reload).

### Full cart store in CartContext

**Why avoided:** Storing cart items in CartContext creates a three-way sync problem: local context, server, and per-screen local state (CartScreen's `cartItems`). Resolving this correctly requires either treating context as the sole source of truth (eliminating CartScreen's local state and requiring context writes on every mutation) or strict single-direction data flow with event-based invalidation. Both approaches are significant rewrites. The lightweight counter achieves the visible goal (correct badge) at minimal surface area, deferring the larger decision to when CartContext's full scope is defined.

### Zustand

**Why avoided:** Same reasoning as Redux. Zustand is lighter but still a new dependency with its own patterns. The current context surface area is small enough not to warrant a store library.

### TypeScript migration of `.js` files mid-session

**Why avoided:** `CartContext.js`, `AppNavigator.js`, `endpoints.js`, `url.js`, `CartItem.js`, `mockData.js` are all plain JS. Migrating them to TypeScript mid-session would have expanded scope significantly and risked introducing type errors in files that were not the target of the current work. TypeScript is satisfied with the current mixed setup — JS files are included in the compilation but not type-checked as strictly.

### React Native Paper / NativeBase / Tamagui

**Why avoided:** Third-party UI kits would have introduced components that don't match the established visual language (dark editorial headers, ink scale, portrait-first product cards) and created a dependency lock. The custom UI component library is small, fully controlled, and consistent with the design system.

---

## 11. Remaining Technical Debt (P1/P2)

### P1 — Must fix before production

**P1-01: Cart badge cold-start zero**
On app launch, `cartCount` is 0. The badge shows 0 until CartScreen is visited. Fix: call `getSavedCartItems` in `App.tsx` or in a post-login effect and call `setCartCount(total)` immediately after auth.
*Files:* `App.tsx`, `src/screens/Login.tsx`, `src/context/CartContext.js`

**P1-02: Quantity mutation only applies one unit per call**
`quantityIncrement` and `quantityDecrement` in `integrations.ts` are designed to adjust by one unit per call. CartScreen calls each once regardless of how large the delta is. If the user taps quantity from 1 to 4, only one increment call fires. The server and client diverge by 3.
*Fix options:* (a) Call the endpoint `|delta|` times sequentially. (b) Request a backend endpoint that accepts a target quantity. (c) Disable multi-step changes until backend provides the endpoint.
*Files:* `src/screens/CartScreen.tsx`, `src/api/integrations.ts`

**P1-03: HomeScreen uses `useState` / `useEffect` directly, not `useAsyncState`**
HomeScreen fetches categories and products with raw `useState` + `useEffect`. It has no loading states, no error states, and is vulnerable to race conditions. All other data-fetching screens have been migrated to `useAsyncState`.
*Files:* `src/screens/HomeScreen.tsx`

**P1-04: ProfileScreen navigates to wrong route**
`navigation.navigate('OrderScreen')` — route does not exist. Should be `'Orders'`.
*File:* `src/screens/ProfileScreen.tsx`

**P1-05: `CartContext.js` is untyped JS**
`setCartCount` is typed as `any` at the context boundary. `(prev: number) => prev + delta` annotations in callers are correct but unenforced. A TypeScript migration of CartContext.js would close this gap.
*File:* `src/context/CartContext.js`

**P1-06: Login screen 55 KB inline SVG**
SVG is rendered inside a WebView on every Login mount. This inflates the JS bundle and incurs WebView initialization cost. Migrate to a static image asset or an `<Image>` component.
*File:* `src/screens/Login.tsx`

### P2 — Address before scaling feature work

**P2-01: `endpoints.js` and `url.js` are untyped JS**
These files export constants but are not TypeScript. Endpoint string typos are undetectable at compile time.
*Fix:* Migrate to `.ts` with `as const`.

**P2-02: `AppNavigator.js` is untyped JS**
Route names are strings with no type checking. `navigation.navigate('OrderScreen')` (the bug in ProfileScreen) cannot be caught at compile time.
*Fix:* Migrate to TypeScript with a typed `RootStackParamList`.

**P2-03: `CartItem.js` is untyped JS**
Uses `Price` and `QuantityStepper` from `components/ui` but passes untyped props.
*Fix:* Migrate to `CartItem.tsx`.

**P2-04: Wishlist endpoints are stubs in production mode**
`getWishlist`, `addToWishlist`, `removeFromWishlist` in `integrations.ts` throw `Error('real endpoint not yet available')`. In `MOCK_MODE` they work via the mock layer. In production, all wishlist actions fail silently (errors are swallowed in most callers).
*Dependency:* Backend must provide and finalize the three wishlist endpoints.

**P2-05: `heroBanner` still imported from `src/data/mockData.js`**
HomeScreen imports `heroBanner` from the old legacy mock file, not from the new `src/api/mock/mockData.ts`. The new mock system is not used for hero banner data.
*Fix:* Move heroBanner data into `mockData.ts` and serve via the mock layer or a dedicated endpoint.

**P2-06: AddressScreen exposes `CustomerProfileCode` in UI**
The raw internal customer profile code is rendered as a visible label in the address card. This is an internal implementation detail that should not be user-facing.
*File:* `src/screens/AddressScreen.tsx`

**P2-07: No auth token injection**
The axios request interceptor has a TODO comment for auth token injection. The backend currently does not require it, but the placeholder must be wired before any authenticated endpoint is introduced.
*File:* `src/api/axiosInstance.ts`

**P2-08: HTTP base URL, not HTTPS**
`src/api/url.js`: `http://122.175.15.28:8110/api/ecomm/`. iOS requires an ATS exception for non-HTTPS traffic. Android requires `android:usesCleartextTraffic="true"`. Both are production security concerns. The backend should move to HTTPS before any public release.

**P2-09: No error boundaries**
React error boundaries are not implemented. An unhandled render exception in any screen will crash the entire app rather than showing a graceful fallback. Add at least one root-level error boundary in `App.tsx`.

**P2-10: No test coverage for new infrastructure**
`useAsyncState`, `apiError`, `services` routing, and CartContext have no unit tests. The Jest configuration exists (`jest.config.js`) but the test suite covers only the initial scaffold (`__tests__/App.test.tsx`).

---

## 12. Backend Integration Readiness

### Current state

The app is fully functional in mock mode (`MOCK_MODE = __DEV__ = true`). The mock layer has stateful in-memory state for cart, wishlist, addresses, and orders that behaves like a real backend within a session.

Switching to real backend requires:

```typescript
// src/config/env.ts
export const MOCK_MODE: boolean = false; // override
```

Or building a release binary (`MOCK_MODE = !__DEV__ = false` automatically).

### What is production-ready

- All product, category, cart, address, and order endpoints are implemented in `integrations.ts`
- Axios timeout, interceptors, and error classification are configured
- The `services.ts` router transparently switches implementations

### What is not production-ready

| Blocker | Severity | Notes |
|---|---|---|
| HTTP not HTTPS | High | ATS / cleartext issues on iOS and Android |
| No auth token injection | High | Axios interceptor has TODO — wire before any authenticated endpoint |
| Wishlist endpoints do not exist | Medium | Three stubs throw in production mode |
| Quantity mutation is single-unit | Medium | See P1-02 — multi-step quantity changes diverge from server |
| No error boundary at app root | Medium | Render errors crash the app |
| `postDeleteCartItem` type mismatch | Low | Backend expects `string`, `CartDetailsCode` is `number` — currently cast with `String()`, works but fragile |

### Backend API envelope

All responses follow:
```json
{ "statusCode": 1, "result": [...], "userMessage": "..." }
```

`statusCode === 1` means success. Any other value is an application-level failure. The axios response interceptor has a commented-out block to auto-raise envelope failures — uncomment this once all screens have been migrated to `useAsyncState` (which handles the resulting errors correctly).

---

## 13. Repository and Branch Strategy

### Branch model

| Branch | Role |
|---|---|
| `main` | Historical baseline — frozen at the pre-modernization state. Never receives new commits. |
| `dev` | Canonical engineering branch. All work happens here. |
| `origin/dev` | Remote tracking. 1 commit behind local at time of writing (CLAUDE.md + audit docs). Push when ready. |

### Why `main` is frozen

The original codebase at `main` represents the state before modernization. It is preserved as a reference point for understanding what changed and why, and as a rollback baseline if needed. It is not a release branch.

### Commit history (ordered newest to oldest)

```
e63d3aa  added claude.md and audit docs      ← cherry-picked from main to dev
bf98fa8  fix: async state                    ← useAsyncState introduced
0c70b00  moving the changes to dev           ← bulk redesign: all UI/API/theme/screens
1bc9fd3  added claude.md and audit docs      ← main only
1a17444  v1                                  ← original v1 on main
33d35f9  Initial commit: Complete React Native E-Commerce App with cart functionality
4ccb1a9  Initial commit
```

### Stash — resolved

The development work existed in two parallel forms: committed to `dev` (via `0c70b00`) and stashed on `main` (the redesign stash). The stash was analyzed and confirmed to contain the same content already in `dev`. The stash was dropped cleanly. There is no divergent work in flight.

---

## 14. Recommended Future Evolution Path

Work is ordered by dependency — later items build on earlier ones.

### Phase 1 — Stabilize (P1 fixes, no new features)

1. Fix cold-start badge zero: fetch cart count post-login, set `cartCount` in context
2. Fix `ProfileScreen` route name (`'Orders'`, not `'OrderScreen'`)
3. Migrate `HomeScreen` to `useAsyncState` with proper loading/error states
4. Fix quantity mutation multi-unit bug (coordinate with backend on endpoint design)
5. Migrate `CartContext.js` to `CartContext.ts` with proper types
6. Add root-level React error boundary in `App.tsx`

### Phase 2 — API hardening

1. Move base URL to HTTPS
2. Wire auth token injection in axios request interceptor
3. Auto-raise envelope failures in the response interceptor (requires Phase 1 `useAsyncState` migration to be complete across all screens)
4. Implement real wishlist endpoints in `integrations.ts` once backend provides them
5. Migrate `endpoints.js`, `url.js`, `AppNavigator.js` to TypeScript with full types

### Phase 3 — Cart full synchronization (if required by product)

If product direction requires real-time cart sync across sessions or devices:
1. Introduce a `CartContext.ts` that stores full cart items, not just count
2. Feed cart data from `CartScreen`'s fetch into context
3. Remove `CartScreen`'s local `cartItems` state — read from context directly
4. Wire `CartItem` component to emit mutations through context actions rather than screen-local handlers
5. At this point, evaluate React Query: if multiple screens need cart data simultaneously (e.g., a cart preview on HomeScreen), React Query's caching is the right tool

### Phase 4 — Test coverage

1. Unit tests for `useAsyncState` (cancellation, error handling, reset)
2. Unit tests for `apiError` (classifyError branches)
3. Unit tests for `services.ts` mock routing
4. Integration tests for cart mutation flow (optimistic + error + refetch)
5. Snapshot tests or Detox E2E for critical paths (login → home → product → cart → checkout)

### Phase 5 — Navigation type safety

Migrate `AppNavigator.js` to TypeScript with `RootStackParamList`:
```typescript
type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Product: { product: string | number };
  Cart: undefined;
  // ...
};
```
This makes all `navigation.navigate()` calls type-checked at compile time, catching route name bugs like the ProfileScreen issue before they ship.

---

## 15. Migration Timeline Summary

| Period | What happened | Key decisions |
|---|---|---|
| Project start | Initial commit — full app scaffolded feature-first | All flows implemented, no shared abstractions |
| v1 | Working app with 10 screens, direct API calls, local CartContext | Accepted as baseline, not production-ready |
| Audit (May 6) | `docs/ui-audit.md` produced — full audit of bugs, color chaos, component duplication | Established modernization priority order |
| Redesign | `src/theme/`, `src/components/ui/`, `src/components/system/`, `src/api/apiError.ts`, `src/api/services.ts`, `src/api/mock/`, `src/hooks/useAsyncState.ts`, `src/config/`, `src/constants/`, 11 screens redesigned, WishlistScreen added, AppNavigator updated | Committed in one batch as `0c70b00` to dev |
| Async fix | `fix: async state` — `useAsyncState.ts` refined, HomeScreen patched to use `items.reduce` instead of broken `getCartItemsCount()` | `bf98fa8` on dev |
| Stash recovery | Stash discovered on main from parallel redesign work — analyzed, confirmed identical to dev, dropped cleanly | No content lost, stash deleted |
| Cart P0 (May 12) | Removed `addToCart({})` phantom write, made add-to-cart async/awaited, wired `quantityIncrement`/`quantityDecrement`/`postDeleteCartItem` to CartScreen mutations | Source of NaN badge eliminated |
| Badge sync (May 12) | CartContext rewritten from item-array reducer to single `cartCount` integer. Badge now server-authoritative via CartScreen fetch and confirmed mutations | Previous: NaN always. Now: correct after first CartScreen visit |
| This document | `docs/project-modernization-audit.md` written as canonical engineering blueprint | Supersedes `docs/ui-audit.md` |

---

*This document supersedes `docs/ui-audit.md`. The ui-audit captures the original state assessment; this document captures the full engineering history, decisions, and forward plan. Both are preserved for reference.*

---

## Post-Stabilization Design-System Audit

**Date:** May 12, 2026  
**Scope:** `src/components/ui/`, `src/components/system/`, `src/theme/`, all 11 screens  
**Method:** Full component reads + grep-based import analysis across every screen  
**Purpose:** Classify every design-system artifact before premium UX refinement begins. This is documentation only — no files were modified.

---

### A. Canonical Design-System Inventory

#### Theme tokens (`src/theme/`)

| Token file | Exports | Status |
|---|---|---|
| `Colors.ts` | Semantic + raw palette | **Keep** — well-structured, semantically named |
| `Space.ts` | 4px-grid array (0–12 index) | **Keep** — used consistently across all screens |
| `Radius.ts` | `sm / md / lg / xl / full` | **Keep** |
| `FontSize.ts` | Named scale (`xs` → `display`) | **Keep** |
| `FontWeight.ts` | Named weights (`regular` → `black`) | **Keep** |
| `Shadow.ts` | `sm / md / lg` presets | **Keep** |
| `ZIndex.ts` | `base / raised / modal / overlay / toast` | **Keep** |
| `Typography.ts` | `Type.*` preset system (`satisfies TextStyle`) | **Standardize** — see §D |

All token files are imported directly in screens as named destructures: `import { Colors, Space, FontSize } from '../theme'`. No screen imports the theme barrel `index.ts` — they import each token file individually, which is fine.

#### UI components (`src/components/ui/`)

| Component | Used in screens | Classification |
|---|---|---|
| `Button` | OrderHistoryScreen, CartScreen, OrderSuccessScreen | **Keep** |
| `BottomNavBar` | HomeScreen, CartScreen, WishlistScreen, OrderHistoryScreen, ProfileScreen | **Keep** |
| `EmptyState` | OrderHistoryScreen, CartScreen, AddressScreen | **Keep** |
| `ErrorBanner` | ProductScreen | **Keep** |
| `Skeleton` / `SkeletonRow` | HomeScreen, ProductScreen, CartScreen, OrderDetailScreen, ResultScreen | **Keep** |
| `ScreenHeader` | ProductScreen, CartScreen, AddressScreen, OrderDetailScreen | **Keep** |
| `QuantityStepper` | ProductScreen, CartScreen | **Keep** |
| `StatusBadge` | OrderHistoryScreen | **Keep** |
| `SearchBar` | HomeScreen | **Keep** |
| `Price` | **No screen** | **Migrate** — see §D |
| `Rating` | **No screen** | **Deprecate** — see §E |
| `SectionLabel` | **No screen** | **Deprecate** — see §E |

#### System components (`src/components/system/`)

| Component | Used in screens | Classification |
|---|---|---|
| `ErrorState` | HomeScreen, ProductScreen, CartScreen, WishlistScreen, OrderHistoryScreen, OrderDetailScreen, ResultScreen | **Keep** |
| `RetryButton` | Only by `ErrorState` and `InlineError` internally | **Keep** (internal dependency) |
| `InlineError` | **No screen** | **Deprecate** — see §E |

---

### B. Usage Matrix — Screens vs. Components

Screens not listed for a component do not import it.

| Screen | Button | BottomNavBar | EmptyState | ErrorBanner | Skeleton | ScreenHeader | QuantityStepper | StatusBadge | SearchBar | ErrorState | Price | Rating | SectionLabel | InlineError |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| HomeScreen | — | ✓ | — | — | ✓ | — | — | — | ✓ | — | — | — | — | — |
| ProductScreen | — | — | — | ✓ | ✓ | — | ✓ | — | — | ✓ | — | — | — | — |
| CartScreen | ✓ | — | ✓ | — | — | ✓ | ✓ | — | — | — | — | — | — | — |
| WishlistScreen | — | ✓ | — | — | ✓ | — | — | — | — | ✓ | — | — | — | — |
| OrderHistoryScreen | ✓ | ✓ | ✓ | — | — | — | — | ✓ | — | ✓ | — | — | — | — |
| OrderDetailScreen | — | — | — | — | ✓ | ✓ | — | — | — | ✓ | — | — | — | — |
| ProfileScreen | — | ✓ | — | — | — | — | — | — | — | — | — | — | — | — |
| AddressScreen | — | — | ✓ | — | — | ✓ | — | — | — | — | — | — | — | — |
| ResultScreen | — | — | — | — | ✓ | — | — | — | — | ✓ | — | — | — | — |
| OrderSuccessScreen | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | — |

`Price`, `Rating`, `SectionLabel`, `InlineError` — **zero screen imports across all 10 audited screens**.

---

### C. Components to Keep (solid, no action needed)

These components are well-implemented, actively used, and consistent with project patterns:

**`Button`** — variant/size system (`primary / secondary / ghost / danger`; `sm / md / lg`), loading state with ActivityIndicator, accessibility roles. No violations.

**`BottomNavBar`** — spring animation via `useRef(new Animated.Value)`, badge overlaid on cart icon reads `cartCount` from `CartContext`. Five tabs wired to navigation. No violations.

**`EmptyState`** — icon + title + body + optional `action` slot. Used correctly in 3 screens. No violations.

**`ErrorBanner`** — inline error banner with `dangerTint` background. Used in ProductScreen for mutation errors. No violations. The single-use pattern is appropriate — this is a form-level error, not a full-screen error.

**`Skeleton` / `SkeletonRow`** — opacity pulse animation (`useRef` + `Animated.loop`). Used in 5 screens with consistent `height/width/radius` prop patterns. Note: uses opacity pulse, not shimmer — an intentional simplification. Acceptable for current quality level; shimmer would be a premium upgrade.

**`ScreenHeader`** — `plain` (white bg, title + back button) and `transparent` variants. Safe-area aware via insets. Used in 4 screens.

**`QuantityStepper`** — `sm/md` sizes, `min/max` bounds, `onQuantityChange` callback. Used in ProductScreen (size `md`) and CartScreen (size `sm`). No violations.

**`StatusBadge`** — dot indicator + label for 5 order statuses (`pending / processing / shipped / delivered / cancelled`). Used only in OrderHistoryScreen. Clean.

**`SearchBar`** — functional search input with `onPress` override for navigation. Used only in HomeScreen. The `onPress` override pattern (tap navigates instead of typing) is correct for the current flow.

**`ErrorState`** — full-screen error with icon, message, and retry. Used in 7 screens. This is the most widely used system component and the most consistently applied. The `onRetry` prop wires directly to `fetchCart()` / `fetchProduct()` etc. No violations.

**`RetryButton`** — standalone retry with loading state. Used internally by `ErrorState` and `InlineError`. Not intended for direct screen use. Keep as internal dependency.

---

### D. Standardize / Migrate (adopt more consistently)

These components exist, work correctly, but are being bypassed in favor of inline implementations:

#### D1. `Price` component — migrate to all price display sites

**Current state:** `Price` is exported from `components/ui/` but imported by zero screens. Every screen that displays prices renders them inline with `Text` + inline `StyleSheet` rules.

**Screens bypassing `Price`:**
- `WishlistScreen` — inline `Text` for current price and compare price with manual strikethrough logic
- `ProductScreen` — inline `Text` for `heroPrice` / `heroWas` with manual discount% calculation
- `ResultScreen` — inline `Text` for `heroCardPrice` / `heroCardWas`, `gridPrice` / `gridWas`, `spanPrice`

**Impact of bypass:** Three separate implementations of the same discount/strikethrough/currency logic. Any currency or formatting change requires touching 3+ files. Currency symbol is hardcoded as `$` in all inline sites (the `Price` component uses `₹` as default — **a symbol mismatch exists today**).

**Action:** Before premium UX work, migrate all price display to `<Price amount={...} compareAmount={...} />`. Resolve the `$` vs `₹` currency question first — this is a product decision.

#### D2. `Type.*` typography presets — adopt beyond OrderSuccessScreen

**Current state:** `src/theme/Typography.ts` exports a `Type` preset object (`Type.display`, `Type.title`, `Type.headingLg`, `Type.headingSm`, `Type.bodyLg`, `Type.bodySm`, `Type.caption`, `Type.label`, `Type.overline`). **Only `OrderSuccessScreen` uses `Type.*` presets** — every other screen assembles `fontSize`/`fontWeight` from raw tokens inline.

**Impact of bypass:** Font scale and weight are inconsistently applied across screens. `HomeScreen` and `ProductScreen` define dozens of inline `fontSize`/`fontWeight` rules that partially overlap with the preset definitions.

**Action:** Do not refactor in this pass. Flag as the highest-priority design-system task for the premium UX phase. When refactoring screens, replace inline text style objects with `Type.*` presets. This will also enable consistent dark-mode text styling in the future.

#### D3. `useEntrance` animation hook — extract to `src/hooks/`

**Current state:** `useEntrance(delay, withScale?)` is defined as a private `function` inside **6 screens**: `HomeScreen`, `CartScreen`, `WishlistScreen`, `ProfileScreen`, `OrderHistoryScreen`, `ResultScreen`. Each definition is character-for-character identical (modulo `HomeScreen`'s optional `withScale` parameter).

**Exact duplication count:**

| Screen | `useEntrance` defined locally | Instances used |
|---|---|---|
| `HomeScreen` | Yes (+ `withScale` variant) | 5 |
| `CartScreen` | Yes | 3 |
| `WishlistScreen` | Yes | 1 per card |
| `ProfileScreen` | Yes | 3 |
| `OrderHistoryScreen` | Yes | 1 per card |
| `ResultScreen` | Yes | 3 (headerAnim, heroAnim, + per-card) |

**Action:** Create `src/hooks/useEntrance.ts` exporting `useEntrance(delay?: number, withScale?: boolean): Animated.AnimatedStyleProp`. Replace all 6 local definitions with an import. This is a pure mechanical extraction — zero behavior change.

---

### E. Deprecate / Remove (components with no active usage)

#### E1. `Rating` — deprecate

**Exported from:** `src/components/ui/Rating.tsx`, re-exported via `src/components/ui/index.ts`  
**Imported by:** zero screens

**Known issue:** Star color is hardcoded as `#F5A623` — not mapped to any token. This would need fixing before the component is usable.

**Why not in use:** ProductScreen renders no rating UI (the product detail design has no visible star rating row). When ratings are needed (search results, product cards), this component should be adopted — but fix the token violation first.

**Classification:** Deprecate (keep in codebase, mark as needs-fix before adoption). Do not remove — the functionality will be needed.

#### E2. `SectionLabel` — deprecate

**Exported from:** `src/components/ui/SectionLabel.tsx`, re-exported via `src/components/ui/index.ts`  
**Imported by:** zero screens

**Component does:** kicker text (small uppercase label) + optional action link row. The pattern is used in `HomeScreen` for section headers ("Featured", "New Arrivals", etc.) but rendered with inline `Text` + custom styles, not via `SectionLabel`.

**Action:** Deprecate. Before premium UX pass, audit HomeScreen section headers and migrate to `SectionLabel` where the kicker+action pattern fits.

#### E3. `InlineError` — deprecate, prefer `ErrorBanner`

**Exported from:** `src/components/system/InlineError.tsx`, re-exported via `src/components/system/index.ts`  
**Imported by:** zero screens (used internally only to compose with `RetryButton`)

**Overlap with `ErrorBanner`:** Both are horizontal-layout inline error components with a `dangerTint` background. `ErrorBanner` is actively used (ProductScreen); `InlineError` is identical in purpose with slightly different layout and a built-in retry button.

**Why `ErrorBanner` wins:** It's already adopted and has the simpler API. `InlineError`'s retry pattern is already covered by `ErrorState` for full-screen use.

**Action:** Deprecate `InlineError`. Do not remove yet — confirm no new screens will need it before deletion. If a future screen needs inline error + retry in a non-full-screen context, extend `ErrorBanner` with an optional `onRetry` prop rather than adopting `InlineError`.

---

### F. Screen-Level Cleanup Required Before Premium Refinement

These are non-component issues identified per screen:

#### F1. `WishlistScreen` — 3 issues
1. **Price bypass** — inline price rendering instead of `<Price>` component (see §D1)
2. **`useEntrance` duplication** — local definition, should import from shared hook (see §D3)
3. **Dark editorial header** — same visual pattern as `ProfileScreen` (gradient + avatar area). Not a component. If both screens keep this pattern, extract to a shared `EditorialHeader` component during premium pass.

#### F2. `ProfileScreen` — 3 issues
1. **Local `Section` / `SectionRow` components** — two layout components defined inline in the screen file. Not in the component library. Candidates for `components/ui/` if other screens need a settings-list layout.
2. **`useEntrance` duplication** — local definition (see §D3)
3. **Dark editorial header** — same pattern as WishlistScreen (see F1 above)

#### F3. `ResultScreen` — 2 issues
1. **Price bypass** — 3 separate inline price+strikethrough+discount% implementations inside a single file (heroCard, grid card, span card variants each render prices inline)
2. **`useEntrance` duplication** — local definition (see §D3)

#### F4. `OrderSuccessScreen` — 1 issue
1. **Success icon is `✓` text character** — the success moment is the highest-emotion UX point in the purchase flow. Using a plain text character instead of an animated icon or Lottie animation is the weakest UX in the entire app. This should be the first premium animation added. No library changes needed — `Animated.spring` on an SVG checkmark (already have `react-native-svg` in the project) would work.

#### F5. `HomeScreen` — 1 issue
1. **`useEntrance` has `withScale` variant** — the `HomeScreen` version adds an optional `withScale` bool for the hero scale-in effect. The shared hook must support this parameter (it's straightforward). Document this when extracting.

#### F6. `CartScreen` — 1 issue
1. **`useEntrance` duplication** — local definition (see §D3)

---

### G. Design-System Risks Before Premium Refinement

Ordered by severity:

| Risk | Severity | Description |
|---|---|---|
| Currency symbol mismatch | **P0** | `Price` component defaults to `₹`; all inline price sites use `$`. If `Price` migration proceeds without resolving this, UI will display wrong currency symbol. Requires product decision. |
| `useEntrance` in 6 screens | **P1** | Any animation change to the entrance pattern requires editing 6 files. High diff surface, risk of inconsistency. Extract before premium animation work. |
| `Type.*` not adopted | **P1** | Premium UX refinement will introduce new text styles. Without `Type.*` adoption, each screen will get its own one-off styles. Design debt compounds fast here. |
| `Rating` token violation | **P2** | Hardcoded `#F5A623` star color. If rating UI is added during premium pass without fixing this, the color will not respond to theme changes. |
| `Section`/`SectionRow` in ProfileScreen only | **P2** | If settings-style list layout appears in another screen (e.g., AddressScreen), devs will create a third copy rather than discovering the ProfileScreen local component. |
| `InlineError` confusion | **P3** | Two error-banner components exported from `components/system`. New devs will be unsure which to use. Deprecation label needed now. |

---

### H. Recommended Audit-to-Refinement Sequencing

Do these in order before starting any premium visual redesign:

1. **Resolve currency symbol** — product decision: `$` or `₹`? Unblock `Price` migration.
2. **Extract `useEntrance`** to `src/hooks/useEntrance.ts`. Mechanical, zero-risk, unblocks animation work.
3. **Migrate `Price` component** across WishlistScreen, ProductScreen, ResultScreen.
4. **Fix `Rating` token violation** — replace `#F5A623` with a token.
5. **Add `OrderSuccessScreen` animated checkmark** — highest emotional impact, low effort.
6. **Begin `Type.*` adoption** — start with one screen (OrderHistoryScreen is cleanest) as a template.
7. **Deprecation labels** — add JSDoc `@deprecated` to `InlineError`, `SectionLabel`, `Rating` until they are either fixed+adopted or removed.

Items 1–5 are pre-conditions for premium refinement. Items 6–7 can proceed in parallel with visual work.

---

### I. Components Safe for Claude Design Upload

If uploading the design system to a design tool or Claude Design for visual specification:

**Upload as canonical (stable, no known issues):**
- `Button.tsx` — all variants and states
- `BottomNavBar.tsx` — tab and badge states
- `EmptyState.tsx` — with and without action slot
- `ErrorState.tsx` — retry and non-retry variants
- `ScreenHeader.tsx` — plain and transparent variants
- `QuantityStepper.tsx` — both sizes, bounds behavior
- `StatusBadge.tsx` — all 5 statuses
- `Skeleton.tsx` / `SkeletonRow.tsx` — representative layouts
- All 7 token files from `src/theme/`

**Do not upload yet (fix first):**
- `Price.tsx` — currency symbol unresolved
- `Rating.tsx` — hardcoded color token violation
- `SectionLabel.tsx` — not validated against actual screen usage
- `InlineError.tsx` — deprecated, do not spec

---

*Audit completed May 12, 2026. No files were modified. All findings are documentation only.*

---

## Pre-Premium Cleanup Implementation

**Date:** May 13, 2026
**Scope:** `src/theme/tokens.ts`, `src/components/ui/Price.tsx`, `src/components/ui/Rating.tsx`, `src/components/ui/SectionLabel.tsx`, `src/components/system/InlineError.tsx`, `src/hooks/useEntrance.ts` (new), `src/screens/WishlistScreen.tsx`, `src/screens/ResultScreen.tsx`, `src/screens/CartScreen.tsx`, `src/screens/OrderHistoryScreen.tsx`, `src/screens/ProfileScreen.tsx`
**TypeScript check:** `npx tsc --noEmit` — 0 errors after all changes.

---

### 1. Token fix — `Colors.star`

**File:** `src/theme/tokens.ts`

Added `star: '#F5A623'` to the `Colors` token map under a new `// Ratings` comment group. The value was previously hardcoded directly in `Rating.tsx`. It is now a named semantic token available to any future component that renders star ratings.

---

### 2. `Rating` — token violation fixed + deprecated

**File:** `src/components/ui/Rating.tsx`

- Replaced hardcoded `color="#F5A623"` with `color={Colors.star}`.
- Added `@deprecated` JSDoc: *"Not used in any screen. Token violation fixed — adopt before use."*

The component is ready to adopt but has zero screen usage. It remains in the codebase pending adoption in product cards or search results.

---

### 3. `Price` — currency default corrected + formatting normalized

**File:** `src/components/ui/Price.tsx`

Two changes:
- **Currency default** changed from `'₹'` to `'$'` — matches every live price site in the app. The prior default was a silent mismatch: any call without an explicit `currency` prop would have rendered the wrong symbol.
- **Number formatting** changed from `toLocaleString('en-IN')` to `toFixed(2)` — aligns with how all inline price sites formatted prices (`$item.Price.toFixed(2)`), ensuring visual consistency between the component and any remaining inline sites.

---

### 4. `SectionLabel` — deprecated

**File:** `src/components/ui/SectionLabel.tsx`

Added `@deprecated` JSDoc: *"Not used in any screen. Migrate HomeScreen section headers to this before adopting."*

No code changes. The component is structurally sound and will be adopted during the HomeScreen premium pass.

---

### 5. `InlineError` — deprecated

**File:** `src/components/system/InlineError.tsx`

Added `@deprecated` JSDoc: *"Use ErrorBanner (already adopted in ProductScreen). Extend ErrorBanner with onRetry if inline-retry is needed."*

No code changes. `ErrorBanner` is the canonical inline error component. `InlineError` remains exported for backwards safety but should not be adopted in new screens.

---

### 6. `useEntrance` — extracted to shared hook

**File created:** `src/hooks/useEntrance.ts`

Canonical shared hook signature:
```typescript
useEntrance(delay = 0, withScale = false, initialY = 10): EntranceStyle
```

Return type `EntranceStyle` is explicitly typed as:
```typescript
{ opacity: Animated.Value; transform: ({ translateY: Animated.Value } | { scale: Animated.Value })[] }
```

This satisfies React Native's strict `Animated.View` style types without widening to `object[]`.

**Durations:** opacity 480ms, translateY 420ms, scale 600ms (when `withScale=true`).

**HomeScreen exception:** HomeScreen retains its local `useEntrance` definition. Its variant uses different durations (`500ms` / `440ms`) and `initialY=14` which are intentional for the hero section's heavier feel. Replacing it with the shared hook would silently change its animation timing — a UX regression. This is documented in the hook's JSDoc.

---

### 7. Screens wired to shared `useEntrance`

| Screen | Local definition removed | `initialY` passed | `useEffect` / `useRef` cleanup |
|---|---|---|---|
| `WishlistScreen` | Yes | default (10) | No cleanup needed — both still used |
| `CartScreen` | Yes | `12` (explicit third arg) | No cleanup needed |
| `OrderHistoryScreen` | Yes | default (10) | `useEffect` removed from import (was only used by local hook) |
| `ProfileScreen` | Yes | default (10) | `useRef` removed from import (was only used by local hook) |
| `ResultScreen` | Yes | `12` (explicit third arg on all 4 call sites) | No cleanup needed |
| `HomeScreen` | **Kept local** | n/a — different durations | n/a |

All call sites that used `initialY=12` pass `false, 12` explicitly rather than relying on the default, making the non-default intent visible at the call site.

---

### 8. `Price` component adopted — safe sites only

**Rule applied:** `Price` was only migrated into light-background contexts where `Colors.ink1` text is correct. Hero/overlay contexts (white text over dark images in ProductScreen, HeroCard, SpanCard) were deliberately left as inline `Text` — those require `color: '#FFFFFF'` which the standard `Price` component does not support.

#### WishlistScreen (`src/screens/WishlistScreen.tsx`)

- Replaced the `priceRow` / `price` / `comparePrice` inline block with `<Price value={item.Price} was={...} size="base" />`.
- Removed the `hasDiscount` local variable (folded inline into the `was` prop).
- Deleted three dead `StyleSheet` entries: `priceRow`, `price`, `comparePrice`.

#### ResultScreen — `GridTile` only (`src/screens/ResultScreen.tsx`)

- Replaced the `gridPriceRow` / `gridPrice` / `gridWas` block with `<Price value={product.Price} was={...} size="sm" />`.
- `hasDiscount` and `discountPct` retained — still used for the badge overlay inside the image.
- Deleted three dead `StyleSheet` entries: `gridPriceRow`, `gridPrice`, `gridWas`.

**Not migrated (intentional):**
- `ProductScreen` hero footer — white text on dark image overlay
- `ResultScreen` `HeroCard` price row — white text on dark gradient overlay
- `ResultScreen` `SpanCard` price — white text on dark gradient overlay
- `CartScreen` line total — uses a custom two-line layout (price + `× qty`) that doesn't map to `Price` props

---

### 9. What remains intentionally deferred

| Item | Reason deferred |
|---|---|
| `HomeScreen` `useEntrance` | Different animation durations — replacing would be a silent timing regression |
| `Price` in hero/overlay contexts | Requires a `color` prop override on `Price`; design decision needed before adding it |
| `Type.*` typography adoption | Broad refactor across all screens — safe but large surface area; reserved for premium pass |
| `SectionLabel` adoption in HomeScreen | HomeScreen section headers need design review before mechanical migration |
| `ProfileScreen` local `Section`/`SectionRow` | Only one screen uses this pattern — premature to componentize |
| `OrderSuccessScreen` animated checkmark | UX upgrade, not a design-system stabilization item |
| `InlineError` deletion | Kept exported until confirmed no new screens need it |

---

### 10. Regression risks

| Risk | Mitigation |
|---|---|
| `Price` formatting change (`toLocaleString` → `toFixed`) | Visual difference only if numbers had thousands separators (e.g. `₹1,500`). With `$` currency all current prices are sub-1000. No functional change. |
| `useEntrance` `initialY` mismatch | CartScreen and ResultScreen explicitly pass `12`; all others use `10`. HomeScreen uses `14` via its own local copy. No timing changed. |
| `useEffect`/`useRef` removals from imports | Verified each removal against all remaining usages in the file before deleting. |
| Dead style removal | Styles were verified unreferenced via grep before deletion in both WishlistScreen and ResultScreen. |

---

### 11. What is now ready for premium refinement

The following are clean, consistently implemented, and unambiguous for Claude Design:

**Token layer**
- All 7 token files: `Colors` (including `Colors.star`), `Space`, `Radius`, `FontSize`, `FontWeight`, `Shadow`, `ZIndex`
- `Typography.ts` (`Type.*` presets) — defined and correct, awaiting broad adoption

**Components**
- `Button`, `BottomNavBar`, `EmptyState`, `ErrorBanner`, `Skeleton`/`SkeletonRow` — no violations, actively used
- `ScreenHeader`, `QuantityStepper`, `StatusBadge`, `SearchBar`, `ErrorState` — no violations, actively used
- `Price` — currency corrected, formatting normalized, adopted in 2 screens

**Infrastructure**
- `useEntrance` — single canonical hook in `src/hooks/`, typed, documented, wired to 5 screens
- `useAsyncState` — unchanged, stable
- `CartContext` — server-authoritative count, stable

**Deprecation signals in place**
- `Rating`, `SectionLabel`, `InlineError` — all carry `@deprecated` JSDoc; no ambiguity about adoption path

Premium visual refinement can now begin against a clean, unambiguous foundation.
