# Architecture Review — E-Commerce App (React Native)

**Scope:** Scalability, maintainability, and structural risk at 200+ screens.  
**Codebase as reviewed:** 19 screens, 12,389 screen LOC, 47 UI components, 6 API domains.

---

## Executive Summary

The foundation is solid for a 20–40 screen app. The domain API model, theme system, and component hierarchy are well-designed and will not require fundamental rewrites as the app grows. The problems are more subtle: state ownership is leaking, screen files are approaching a complexity ceiling, the navigation layer carries no type safety, and several cross-cutting concerns (auth identity, filtering, pagination) are being solved ad-hoc per screen. At 200 screens, these gaps compound. The issues are fixable without architectural reversal — they require discipline and targeted refactoring in specific layers.

---

## What Is Working Well

### 1. Domain API Architecture

The `src/api/<domain>/` structure with barrel exports is the right call. Each domain encapsulates its real and mock implementations behind a single index, screens never import from implementation files, and the barrel is the contract. This pattern scales linearly — adding a `reviews/`, `promotions/`, or `returns/` domain costs one folder and does not disturb anything else. The endpoint registry in `endpoints.ts` prevents magic-string scatter.

**Verdict:** Keep. This is the strongest part of the codebase.

### 2. Error Infrastructure

`ApiError` with four classified kinds (timeout, network, server, application), `classifyError()`, `userFacingMessage()`, and the `useAsyncState` hook composing `loading | isError | isSuccess | run | reset` is a complete, consistent async error surface. Screens do not need to know what axios error shapes look like. The `ErrorState` / `ErrorBanner` split (full-screen vs. inline mutation errors) is the right UX hierarchy.

**Verdict:** Mature pattern. No changes needed.

### 3. Theme System

The token layer (`Colors`, `Space`, `Radius`, `Type`, `Motion`, `FontFamily`) is thorough and covers the full visual vocabulary. Binding ad-hoc durations to `Motion.duration.*` prevents temporal drift across animations. The `Type` presets enforce role-based typography — no direct font size numbers in components. This system scales well.

**Verdict:** Strong. The motion token enforcement rule in CLAUDE.md ("ad-hoc durations are a hard failure") is correct and should be enforced in CI via lint rule.

### 4. Component Layering (Primitives → UI → Screens)

The three-tier hierarchy is clean: primitives are zero-logic RN wrappers, `src/components/ui/` holds semantic reusable UI, and screens own layout and data fetching. The `gluestack/Actionsheet.tsx` bridge preserving the import surface while delegating to `@gorhom/bottom-sheet` is clever infrastructure work.

**Verdict:** Good structure. The `ui/index.ts` barrel with 53 exports is manageable now but will need sub-grouping as it grows (see risks below).

### 5. Auth Token Lifecycle

In-memory token cache + Keychain backing + automatic 401 refresh + concurrent-request deduplication via `_refreshPromise` + session reset on refresh failure is a complete, production-ready auth lifecycle. The exclusion list for auth endpoints is explicit. This is not a common pattern to get right on first attempt.

**Verdict:** Sound. No changes needed.

---

## Risks by Category

---

### A. Screen Size — Imminent Ceiling

**Current state:**

| Screen | LOC |
|---|---|
| CartScreen.tsx | 1,092 |
| ResultScreen.tsx | 1,088 |
| ProductScreen.tsx | 1,019 |
| OrderDetailScreen.tsx | 866 |
| OrderHistoryScreen.tsx | 898 |
| HomeScreen.tsx | 781 |

Six screens above 700 lines. Three above 1,000. Each of these files co-locates data fetching, business logic, multiple distinct UI regions, local state, and often more than one sheet/modal flow. This is the single most impactful structural issue.

**Why it gets worse:** At 200 screens, the median screen will be touched by two or more developers. A 1,000-line screen cannot be reviewed, tested, or confidently modified. The Git diff on a feature change will span hundreds of lines of unrelated JSX. Merge conflicts will be frequent.

**Concrete example:** `CartScreen.tsx` manages: guest cart state, server cart state, quantity mutation (increment/decrement with optimistic UI), item deletion with confirm sheet, empty state, checkout button gating, address navigation, login prompt, and the cart-to-order handoff. Each of those is a separable concern.

**What to do:** Apply the semantic extraction rule already in CLAUDE.md more aggressively to screens. `CartScreen` should contain: a root layout, a `CartList` component, a `CartSummary` component, and a `CartEmptyState` — each in their own file under `src/screens/cart/`. The screen orchestrates; sub-components own their region.

---

### B. State Ownership Fragmentation

**Current state:** Auth identity is owned by AsyncStorage and read in 13 different screens via raw `AsyncStorage.getItem(STORAGE_KEYS.userData)` + `JSON.parse`. Every screen that needs `CustomerProfileCode` re-reads and re-parses independently. `useProfileCode` and `useSession` hooks exist but are explicitly not used for API calls (CLAUDE.md: "avoid for API calls") because they return null on first render.

**Why it gets worse:** At 200 screens, there is no single place to invalidate or update the identity. Account switching, profile updates, or structure changes to `LoggedInCustomerInterface` require hunting every read site. A field rename on the server becomes a 13-file grep. The current workaround (read AsyncStorage inside every fetch function) is correct defensively but creates a distributed read pattern.

**Deeper issue:** `CartContext` is the only global Context, and it holds only an integer. There is no user session context. The pattern `const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData); const code = raw ? JSON.parse(raw).CustomerProfileCode : null;` is repeated across the codebase as a primitive.

**What to do:** A `SessionContext` that reads once at app boot (or on auth events) and exposes `{ session: LoggedInCustomerInterface | null, refresh: () => Promise<void> }` would eliminate all direct AsyncStorage reads for identity. The first-render-null problem disappears because the context is loaded before screens mount. This does not violate the "no Redux" constraint — it is the Context API doing what it is designed for.

---

### C. Navigation: No Type Safety, No Param Contracts

**Current state:** `AppNavigator.js` is JavaScript (not TypeScript). Screen navigation calls are `navigation.navigate('Product', { itemId, inventoryId })` with no type checking. The param shape is an implicit contract between the calling screen and the receiving screen. Adding, renaming, or removing a param is a runtime bug, not a compile-time error.

**Why it gets worse:** At 200 screens with many more navigation edges, a param rename becomes a silent regression. There is no way to know statically which screens pass `itemId` vs. which pass `productId`. Deep-link support (if added) requires param types. A new developer cannot discover what params a screen expects without reading the full screen file.

**What to do:**
```typescript
// src/navigation/types.ts
export type RootStackParamList = {
  Home: undefined;
  Product: { itemId: string; inventoryId: string };
  Result: { categoryId?: string; brandId?: string; query?: string };
  // ...
};
```
Then `AppNavigator.tsx` uses `createNativeStackNavigator<RootStackParamList>()`. Every `navigation.navigate()` call is now type-checked. This is a one-time migration of a single file and does not change any screen logic.

---

### D. API Layer: The Single `interfaces.ts` File

**Current state:** All API types — product, cart, order, address, auth, wishlist, and all nested shapes — live in one 753-line file (`src/api/interfaces.ts`). There are 27 enums in separate files but no corresponding type separation.

**Why it gets worse:** At 200 screens with more API domains, this file becomes a 2,000–3,000 line type registry. Every domain imports from it, so it becomes a de-facto global dependency. Adding a new field to `ProductInterface` causes TypeScript to re-check every file that imports from `interfaces.ts`, slowing the compiler. Finding the type you need requires searching a monolithic file.

**What to do:** Move types to domain co-location:
```
src/api/product/types.ts    # ProductInterface, ProductDetailInterface, ProductVariant
src/api/cart/types.ts       # SavedCartItemInterface, GuestCartItem, PostCartSaveInterface
src/api/order/types.ts      # PlaceOrderInterface, OrderHistoryItemInterface, etc.
```
`interfaces.ts` becomes a re-export barrel for backwards compatibility during migration, then is deleted. This mirrors the existing API implementation structure and makes each domain fully self-contained.

---

### E. `src/components/ui/` — Growing Monolith Risk

**Current state:** 47 components exported from a single `ui/index.ts` barrel. The folder is flat. Components range from stateless atoms (`Price`, `Rating`, `SectionLabel`) to complex stateful sheets with API calls (`EditProfileSheet`, `ChangePasswordSheet`, `ForgotPasswordSheet`).

**Why it gets worse:** Sheets that own API calls and local state (`EditProfileSheet` makes a profile update call; `ForgotPasswordSheet` calls forgotPassword + verifyForgotPasswordOTP) are not reusable primitives — they are screen fragments that happen to live in `ui/`. As the app grows, more such "screen fragment" components will accumulate here, making it difficult to understand what `ui/` actually contains. A new developer cannot distinguish a stateless `Price` chip from a multi-step `ForgotPasswordSheet` flow from the flat listing.

**What to do:** Sub-group by responsibility inside `ui/`:
```
src/components/ui/
  product/     ProductCard, ProductGrid, ProductRail, ProductIdentity, VariantChipGrid
  order/       OrderProgressBar, StatusBadge, DeliveryBand
  auth/        LoginPromptSheet, EditProfileSheet, ChangePasswordSheet, ForgotPasswordSheet
  feedback/    Toast, ToastOverlay, Skeleton, SkeletonGrid, EmptyState, ErrorBanner
  layout/      SectionHead, SectionLabel, BreadcrumbRow, ScreenHeader, DarkHeader
```
The barrel `ui/index.ts` re-exports everything. No call sites change. The sub-groups make category-specific imports and ownership immediately obvious.

---

### F. Pagination: Solved Once, Not Generalized

**Current state:** `OrderHistoryScreen` and `ResultScreen` both implement pagination manually — each maintains `page` state, a `hasMore` flag, appends to a local data array on scroll, and handles the empty/loading/error states independently. The patterns are similar but not shared.

**Why it gets worse:** At 200 screens, any list-heavy screen (reviews, returns, saved addresses in search, recommendation feeds) will need to re-implement the same pattern. Bugs fixed in one implementation will not propagate to others. The mental overhead of "which pagination approach does this screen use?" grows.

**What to do:** A `usePagination<T>` hook:
```typescript
function usePagination<T>(
  fetchPage: (page: number) => Promise<{ items: T[]; hasMore: boolean }>,
  deps: unknown[],
): { items: T[]; loading: boolean; isError: boolean; hasMore: boolean; loadMore: () => void; refresh: () => void }
```
Screens bind the fetch function; the hook owns page state, append logic, and `hasMore` tracking. This is additive — existing screens can migrate incrementally.

---

### G. `homeCache` — Implicit Module-Level Singleton

**Current state:** `src/utils/homeCache.ts` exports a plain mutable object `{ categories: null, brands: null }`. `HomeScreen` writes to it when API data lands. `SearchScreen` reads from it for category/brand chips. There is no subscription, no update notification, and no invalidation.

**Why it gets worse:** This pattern cannot be observed — `SearchScreen` reads a snapshot at render time and never knows if `HomeScreen` has not fetched yet. It is a write-once, read-many cache with no consistency guarantees. If `HomeScreen` is unmounted and remounted (account switch, deep link), the old cache value persists. Adding a third consumer (e.g., a new Categories quicklink) requires knowing that this singleton exists.

**What to do:** Move this into `SessionContext` or a dedicated `useHomeData()` hook backed by a `useRef` + `useState`. The mutable singleton approach is acceptable for a known read-after-write single flow but will not survive multi-consumer scenarios.

---

### H. Mock/Real API Selection: Build-Time, Not Runtime

**Current state:** Each domain `index.ts` selects real vs. mock via a hardcoded boolean: `false ? mockApi : realApi`. The pattern comment says "check each domain's `index.ts` before assuming mock or real." `src/config/env.ts` exports `MOCK_MODE` but it is not used in the domain barrel files.

**Why it gets worse:** Mock toggles controlled by reading source code are fragile. There is no single switch that flips all domains. A developer adding a new domain must remember to wire the toggle correctly and may default to always-real, breaking offline development.

**What to do:** All domain `index.ts` files should use the same expression: `MOCK_MODE ? mockApi : realApi`. This makes `MOCK_MODE` in `env.ts` the single, authoritative control surface. A grep for inconsistency becomes a lint rule.

---

### I. Unsplash Dependency in the API Layer

**Current state:** `useProductImage.ts` and `unsplashImage.ts` call the Unsplash API at runtime to resolve product images. This is a development convenience but is load-bearing in production — real product images depend on a third-party API call, caching in AsyncStorage, and fallback chains.

**Why this matters architecturally:** Product images are a first-class attribute of `ProductInterface`. They should come from the backend (`resolveImageUrl.ts` already handles a backend image base URL). The Unsplash path bypasses this and makes image availability a function of Unsplash rate limits and network conditions. At scale, this creates an invisible dependency on a third-party service that is not part of your API contract.

**What to do:** Audit whether Unsplash is used in production or only when the backend image field is null. If it is a fallback, gate it explicitly with a comment documenting the intent. If backend images are always populated, remove the Unsplash path.

---

## Navigation Architecture: Flat Stack at 200 Screens

The CLAUDE.md constraint says "no navigation architecture changes. Flat stack." This is architecturally correct for the current 19-screen app — flat navigation is simpler to reason about and debug. However, at 200 screens, a flat stack has a specific predictable problem: **screen registration.**

`AppNavigator.js` currently registers 24 screens in a single file. At 200 screens, this file becomes a 600-line registration manifest that every developer touches for every new screen, creating perpetual merge conflicts.

**What to do (without changing the flat-stack constraint):** Extract screen registration into domain groups, imported into a single root navigator:
```javascript
// navigation/stacks/productScreens.js — Product, Result, Search, Brands, Categories
// navigation/stacks/orderScreens.js — Cart, Address, Payment, OrderSuccess, Orders, OrderDetail
// navigation/stacks/accountScreens.js — Profile, Wishlist, AddressManagement, HelpCenter
// navigation/stacks/authScreens.js — Login, Register, OTPVerification
// AppNavigator.js — imports and spreads all four groups
```
This is a refactoring of the registration file, not an architectural change to navigation. The stack remains flat; the file is no longer monolithic.

---

## Dependency Graph: What Imports What

The current graph is mostly clean:

```
Screens → src/api/<domain>  (via barrel, correct)
Screens → src/hooks/        (correct)
Screens → src/components/ui (correct)
Screens → src/theme         (correct)
Screens → AsyncStorage      (should route through SessionContext for identity)
```

**One violation to note:** Several screens read `AsyncStorage` directly for `CustomerProfileCode`. The storage layer should not be a direct dependency of screens for identity — that belongs in context. The `STORAGE_KEYS` registry correctly prevents magic-string scatter, but the reads themselves should be encapsulated.

**Components are clean:** No `navigation.navigate` calls were found inside `src/components/`. UI components receive callbacks from screens, which is the correct inversion. `WishlistHeart` has relative imports but no navigation coupling.

---

## Summary Table

| Concern | Current State | Risk at 200 Screens | Priority |
|---|---|---|---|
| Domain API structure | Excellent | Scales linearly | No action needed |
| Error infrastructure | Excellent | Scales linearly | No action needed |
| Theme / design tokens | Excellent | Scales linearly | Enforce via lint |
| Screen file sizes | 3 screens > 1000 LOC | Unmaintainable | High |
| Auth identity ownership | Scattered AsyncStorage reads | Bug-prone at scale | High |
| Navigation type safety | No types (JS file) | Silent regressions | High |
| API type co-location | Monolithic interfaces.ts | Compiler slowdown, discoverability | Medium |
| UI folder organization | Flat, 47 components mixed | Category ambiguity | Medium |
| Pagination pattern | Per-screen ad-hoc | Code duplication | Medium |
| Mock/real API toggle | Per-domain hardcoded | Inconsistency risk | Low |
| homeCache singleton | Mutable module-level object | Multi-consumer breaks | Low |
| Unsplash dependency | Runtime third-party for images | Third-party rate limit exposure | Low |
| AppNavigator registration | Flat 24-screen manifest | Merge conflict surface | Low (at current size) |

---

## Recommended Order of Operations

1. **Migrate `AppNavigator.js` to TypeScript with `RootStackParamList`.** One-time, no screen changes, immediate type-safety dividend. Lowest effort, highest impact per hour.

2. **Add `SessionContext`** wrapping `LoggedInCustomerInterface`, remove all direct `AsyncStorage.getItem(userData)` reads from screens. Fix the first-render-null problem at the root.

3. **Split the three largest screens** (Cart, Result, Product) into screen + sub-components per their natural regions. Each screen should own layout and data flow; sub-components own rendering their region.

4. **Co-locate API types** with their domain. Migrate `interfaces.ts` to per-domain `types.ts` files. Make `interfaces.ts` a transitional re-export barrel.

5. **Add `usePagination<T>`** hook. Migrate `OrderHistoryScreen` and `ResultScreen` as the first consumers.

6. **Sub-group `src/components/ui/`** into product/, order/, auth/, feedback/, layout/. The barrel re-exports everything; no call sites change.

7. **Standardize mock toggle** to use `MOCK_MODE` from `env.ts` in all domain barrel files.

None of these require changing the navigation model, the context strategy, or the API domain structure. They are refinements within the existing architecture, not rewrites of it.
