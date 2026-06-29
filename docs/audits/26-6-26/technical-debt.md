# Technical Debt Report

**Date:** 2026-06-26
**Branch:** dev
**Auditor:** Claude Code (automated)

---

## Summary

| Category | Items | Effort Total |
|---|---|---|
| Immediate Fixes | 3 | ~3h |
| Next Sprint | 6 | ~2d |
| Before Launch | 5 | ~3d |
| Post Launch | 4 | ~4d |
| Long-term Refactors | 4 | ~5d |

---

## Immediate Fixes

Issues that are either a correctness risk today or block other work.

### 1. `console.error` / `console.log` leaking to production — `PaymentScreen`, `axiosInstance`

Production builds include unguarded debug output. PaymentScreen has four unguarded `console.error` / `console.warn` calls across its payment zone, poll, finalise, and WebView error paths. `axiosInstance.ts:42` logs raw refresh errors. `apiLogger.ts` logs full request/response cycles unconditionally.

**Files:**
- [src/screens/PaymentScreen.tsx](src/screens/PaymentScreen.tsx) — lines 187, 333, 456, 516
- [src/api/axiosInstance.ts](src/api/axiosInstance.ts) — line 42
- [src/api/apiLogger.ts](src/api/apiLogger.ts) — lines 85, 111, 139

**Fix:** Wrap all `console.*` calls in `if (__DEV__)` or replace with the structured logger the apiError.ts TODO already identifies (Sentry / Datadog).

**Effort:** 1h

---

### 2. Dead exports in `ui/index.ts` — `HeroNavButton`, `DeptFooter`

Two components are exported from the barrel but have zero import references anywhere in the codebase. They inflate the bundle and create confusion about what is in active use.

**Files:**
- [src/components/ui/HeroNavButton.tsx](src/components/ui/HeroNavButton.tsx)
- [src/components/ui/DeptFooter.tsx](src/components/ui/DeptFooter.tsx)
- [src/components/ui/index.ts](src/components/ui/index.ts)

**Fix:** Delete both files, remove their exports from `index.ts`.

**Effort:** 30m

---

### 3. `InlineError` still exported — deprecated, `ErrorBanner` is the replacement

`InlineError` is deprecated per CLAUDE.md. The component file still exists and is exported. No screens currently use it, but its presence invites future misuse.

**File:** [src/components/system/InlineError.tsx](src/components/system/InlineError.tsx)

**Fix:** Delete the file. Confirm no imports remain (`rg 'InlineError'`).

**Effort:** 15m

---

## Next Sprint

Bugs and violations that degrade correctness or maintainability but are not blocking today.

### 4. Hardcoded hex colors in screens — 15+ violations

Screens bypass the theme token system and hardcode literal hex values. This breaks the single source of truth for the colour palette and makes a brand colour change require hunting through dozens of style blocks. Worst offenders:

**Files:**
- [src/screens/OrderSuccessScreen.tsx](src/screens/OrderSuccessScreen.tsx) — lines 381, 395, 398, 462 (`#226B3C`, `#FFFFFF`, `#EFE9E4`, `#FFFFFF`)
- [src/screens/OrderHistoryScreen.tsx](src/screens/OrderHistoryScreen.tsx) — lines 218, 303, 806, 885
- [src/screens/ProfileScreen.tsx](src/screens/ProfileScreen.tsx) — lines 67, 122, 127, 138, 193, 312, 427, 451, 476, 638, 643, 653, 656, 727, 730
- [src/screens/Login.tsx](src/screens/Login.tsx) — lines 263, 393, 445, 455, 467
- [src/screens/BrandsScreen.tsx](src/screens/BrandsScreen.tsx) — line 293

**Fix:** Replace each literal with the corresponding `Colors.*` token from `src/theme/`. StatusBar `backgroundColor` is a common offender — use `Colors.surface`, `Colors.ink`, etc.

**Effort:** 3h

---

### 5. Hardcoded animation durations — 10+ violations across `Motion.duration.*` contract

CLAUDE.md is explicit: ad-hoc durations are a hard failure. Currently 10+ `duration:` values bypass `Motion.duration.*`.

**Files:**
- [src/screens/Login.tsx](src/screens/Login.tsx) — lines 71–74 (shake: `50`, `55`), 110, 116 (`300`)
- [src/screens/HomeScreen.tsx](src/screens/HomeScreen.tsx) — line 76 (`350`)
- [src/screens/ResultScreen.tsx](src/screens/ResultScreen.tsx) — line 163 (`200`)
- [src/components/ProductCard.tsx](src/components/ProductCard.tsx) — line 52 (`300`)
- [src/screens/AddressScreen.tsx](src/screens/AddressScreen.tsx) — line 499 (stagger `50`, cap `200`)
- [src/screens/OrderHistoryScreen.tsx](src/screens/OrderHistoryScreen.tsx) — line 618 (stagger `60`, cap `300`)
- [src/screens/AddressManagementScreen.tsx](src/screens/AddressManagementScreen.tsx) — line 386

**Fix:** Map each value to the closest `Motion.duration.*` or `Motion.stagger.*` constant. For the Login shake sequence, add a `Motion.duration.shake` token if none exists that covers `50`/`55ms` microsteps.

**Effort:** 2h

---

### 6. Bare string AsyncStorage prefix in `unsplashImage.ts`

`unsplashImage.ts` uses its own `'unsplash_cache__'` string prefix directly instead of a `STORAGE_KEYS` constant. This sidesteps the convention enforced everywhere else and makes key collisions invisible at review time.

**File:** [src/utils/unsplashImage.ts](src/utils/unsplashImage.ts) — lines 12, 23

**Fix:** Add `UNSPLASH_CACHE_PREFIX: 'unsplash_cache__'` to `STORAGE_KEYS` in [src/config/storageKeys.ts](src/config/storageKeys.ts) and reference it in `unsplashImage.ts`.

**Effort:** 30m

---

### 7. Stale TODO comments — `axiosInstance.ts`, `apiError.ts`

Three TODO comments reference a planned migration to centralized error handling (auto-raise on `statusCode !== 1`) that has not happened. They create ambiguity about whether this is still intended.

**Files:**
- [src/api/axiosInstance.ts](src/api/axiosInstance.ts) — line 92
- [src/api/apiError.ts](src/api/apiError.ts) — lines 120, 156

**Fix:** Resolve ownership: either remove the TODOs if the migration is abandoned, or convert them to a tracked issue and note the issue number inline.

**Effort:** 30m

---

### 8. `catch (err: any)` pattern — 20+ catch blocks across screens and components

`catch (err: any)` defeats type narrowing. The correct pattern in TS 4+ is `catch (err) { if (err instanceof Error) ... }` or a utility like `apiError.ts`'s `extractMessage`.

**Frequent offenders:**
- [src/screens/AddressScreen.tsx](src/screens/AddressScreen.tsx) — line 387
- [src/screens/OrderHistoryScreen.tsx](src/screens/OrderHistoryScreen.tsx) — lines 368, 442
- [src/screens/PaymentScreen.tsx](src/screens/PaymentScreen.tsx) — lines 186, 332, 455
- [src/screens/Login.tsx](src/screens/Login.tsx) — line 252
- [src/components/ui/EditProfileSheet.tsx](src/components/ui/EditProfileSheet.tsx) — line 245
- [src/components/ui/ForgotPasswordSheet.tsx](src/components/ui/ForgotPasswordSheet.tsx) — lines 78, 104
- [src/components/ui/ChangePasswordSheet.tsx](src/components/ui/ChangePasswordSheet.tsx) — line 169
- … plus ~10 more (full list: `rg 'catch \(e\w*: any\)'`)

**Fix:** Replace with `catch (err) { const message = extractMessage(err); ... }` using the existing `apiError.ts` utility.

**Effort:** 2h

---

### 9. Untyped navigation props — `navigate: (screen: string, params?: any) => void`

Multiple screens declare their navigation prop as a loose callback rather than using `StackNavigationProp<RootStackParamList>`. This makes route name and param typos invisible to the compiler.

**Files:**
- [src/screens/BrandsScreen.tsx](src/screens/BrandsScreen.tsx) — line 35
- [src/screens/OrderHistoryScreen.tsx](src/screens/OrderHistoryScreen.tsx) — line 46
- [src/screens/CartScreen.tsx](src/screens/CartScreen.tsx) — line 37
- [src/screens/HelpCenterScreen.tsx](src/screens/HelpCenterScreen.tsx) — line 25
- [src/screens/ResultScreen.tsx](src/screens/ResultScreen.tsx) — line 58
- [src/screens/SearchScreen.tsx](src/screens/SearchScreen.tsx) — line 27
- [src/screens/HomeScreen.tsx](src/screens/HomeScreen.tsx) — line 187
- [src/screens/WishlistScreen.tsx](src/screens/WishlistScreen.tsx) — line 44
- [src/screens/OrderDetailScreen.tsx](src/screens/OrderDetailScreen.tsx) — line 61
- [src/screens/CategoriesScreen.tsx](src/screens/CategoriesScreen.tsx) — line 40

**Fix:** Define `RootStackParamList` (if not already), and type each screen's prop as `StackNavigationProp<RootStackParamList, 'ScreenName'>`.

**Effort:** 2h

---

## Before Launch

Items that represent product or runtime risk if shipped.

### 10. Inconsistent error state handling across screens

Several screens fetch data but do not render `ErrorState` on failure, leaving users with a blank or stale screen. The CLAUDE.md canonical pattern (`if (isError) return <ErrorState .../>`) is absent or incomplete in:

- [src/screens/BrandsScreen.tsx](src/screens/BrandsScreen.tsx) — error state not wired to full-screen fallback
- [src/screens/CategoriesScreen.tsx](src/screens/CategoriesScreen.tsx) — error state incomplete
- [src/screens/WishlistScreen.tsx](src/screens/WishlistScreen.tsx) — some error paths missing `ErrorState`
- [src/screens/AddressManagementScreen.tsx](src/screens/AddressManagementScreen.tsx) — partial error handling

**Fix:** Audit each fetch path in these screens; add canonical `isError` guard before main render.

**Effort:** 3h

---

### 11. `interfaces.ts` has `any` in persisted data shapes — `Taxes`, `PhysicalAttributes`

`Taxes: any[]` and `PhysicalAttributes: any` in `SaveCartItemInterface` and `OrderDetailItemInterface` mean tax or attribute data is never type-checked. If the backend shape changes, the failure is silent.

**File:** [src/api/interfaces.ts](src/api/interfaces.ts) — lines 647, 668–669

**Fix:** Inspect the actual API response for these fields and define proper interfaces. Even a minimal `TaxEntry { TaxCode: string; Amount: number }` is better than `any[]`.

**Effort:** 2h

---

### 12. Hard-cast `as any` on `AdditionalInfo` fields in `ProductScreen`

`Season` and `ProductDemoGraphic` are cast with `as any` to reach `.Description`. This suggests `AdditionalInfo` subtypes are either missing from `interfaces.ts` or incorrectly typed. A shape change breaks silently at runtime.

**File:** [src/screens/ProductScreen.tsx](src/screens/ProductScreen.tsx) — lines 648–649

**Fix:** Add proper sub-interfaces for `Season` and `ProductDemoGraphic` in `interfaces.ts` and remove the casts.

**Effort:** 1h

---

### 13. `orderApi.ts` returns `any[]` for order history items

`Promise<{ items: any[]; hasMore: boolean }>` means the entire history list is untyped. Any field rename on the backend is invisible.

**File:** [src/api/order/orderApi.ts](src/api/order/orderApi.ts) — line 50

**Fix:** Change return type to `Promise<{ items: OrderHistoryItemInterface[]; hasMore: boolean }>`.

**Effort:** 30m

---

### 14. `OrderDetailScreen.tsx` stub warning — `Help not yet wired`

A `console.warn('Help not yet wired')` at line 605 indicates a live user-facing action is stubbed. If a user taps "Help" on an order detail, nothing happens.

**File:** [src/screens/OrderDetailScreen.tsx](src/screens/OrderDetailScreen.tsx) — line 605

**Fix:** Wire to `HelpCenterScreen` navigation or disable the button until the feature is ready.

**Effort:** 1h

---

## Post Launch

Improvements that are safe to defer but should not be forgotten.

### 15. `interfaces.ts` is 753 lines — single monolithic type file

All API interfaces for every domain live in one file. This creates merge conflicts, slow editor indexing, and unclear ownership.

**File:** [src/api/interfaces.ts](src/api/interfaces.ts) — 753 lines, 35+ interfaces

**Fix:** Split into domain-scoped files: `api/product/types.ts`, `api/order/types.ts`, etc. Export a re-barrel from `api/interfaces.ts` for backward compatibility, then migrate imports domain by domain.

**Effort:** 1d

---

### 16. `FilterSheet.tsx` is 716 lines — complex component with multiple state branches

The filter sheet manages sort, category, brand, price range, and in-stock state as a single component. Editing any one concern requires navigating the full file.

**File:** [src/components/ui/FilterSheet.tsx](src/components/ui/FilterSheet.tsx) — 716 lines

**Fix:** Extract each filter section (SortSection, BrandSection, PriceSection) as sub-components with their own local state, composed inside FilterSheet.

**Effort:** 4h

---

### 17. `apiLogger.ts` unconditionally logs full request/response payloads

All API traffic is logged to the console regardless of build mode. This is performance overhead and exposes PII (addresses, order details) in development device logs that can be captured by other apps.

**File:** [src/api/apiLogger.ts](src/api/apiLogger.ts) — lines 85, 111, 139

**Fix:** Gate all logging on `__DEV__`. In production, replace with a structured logger that redacts sensitive fields.

**Effort:** 2h

---

### 18. Snappoint percentages hardcoded in bottom sheets

`'75%'` and `'46%'` are hardcoded snapPoints rather than named constants. Height tuning for different device sizes requires hunting through component files.

**Files:**
- [src/screens/OrderDetailScreen.tsx](src/screens/OrderDetailScreen.tsx) — line 630
- [src/components/ui/LoginPromptSheet.tsx](src/components/ui/LoginPromptSheet.tsx) — line 91

**Fix:** Extract to named constants in the relevant component or `src/theme/`.

**Effort:** 30m

---

## Long-term Refactors

Structural improvements that require planning and are low urgency.

### 19. 8 screens exceed 600 lines — semantic extraction opportunity

Large screen files mix fetch logic, derived state, multiple sub-views, and styles in a single file. Extraction should follow the semantic rule from CLAUDE.md: only when a block has a clear responsibility name.

| Screen | Lines |
|---|---|
| [src/screens/CartScreen.tsx](src/screens/CartScreen.tsx) | 1092 |
| [src/screens/ResultScreen.tsx](src/screens/ResultScreen.tsx) | 1088 |
| [src/screens/ProductScreen.tsx](src/screens/ProductScreen.tsx) | 1019 |
| [src/screens/OrderHistoryScreen.tsx](src/screens/OrderHistoryScreen.tsx) | 898 |
| [src/screens/AddressScreen.tsx](src/screens/AddressScreen.tsx) | 895 |
| [src/screens/OrderDetailScreen.tsx](src/screens/OrderDetailScreen.tsx) | 866 |
| [src/screens/HomeScreen.tsx](src/screens/HomeScreen.tsx) | 781 |
| [src/screens/ProfileScreen.tsx](src/screens/ProfileScreen.tsx) | 758 |

**Fix:** Extract semantic blocks — `CartSummary`, `OrderItemRow`, `AddressCard`, `ProductVariantPicker` — as components when they are clearly reusable or independently testable. Do not extract purely to reduce line count.

**Effort:** 3d

---

### 20. Navigation prop types — define `RootStackParamList`

The app has no central `RootStackParamList` type. Every screen that needs to navigate uses either `StackNavigationProp<any>` or a loose callback. This is a foundational type gap.

**Fix:** Define `RootStackParamList` with all screen names and their params. Type all `navigation` props against it. This is a pre-condition for item 9 above.

**Effort:** 4h

---

### 21. Structured error logging — replace `console.*` with Sentry or Datadog

`apiError.ts:156` already has a TODO for this. The app currently has no production error observability — errors are either swallowed or logged to the console.

**Fix:** Integrate Sentry (RN SDK). Route all `catch` paths through a `logger.error()` utility. Redact PII before sending. This resolves items 1, 9 (partially), and 17.

**Effort:** 1d

---

### 22. JS files — low-priority migration when screens touch them

`CartContext.js`, `AppNavigator.js`, and `CartItem.js` are intentionally left as JS per CLAUDE.md. They are small and stable. If they are ever modified for a feature, convert them to TS in the same PR.

**Files:**
- [src/context/CartContext.js](src/context/CartContext.js) — 28 lines
- [src/navigation/AppNavigator.js](src/navigation/AppNavigator.js) — 87 lines
- [src/components/CartItem.js](src/components/CartItem.js) — 101 lines

**Effort:** 3h (opportunistic, not scheduled)

---

## Appendix — Items Reviewed and Cleared

The following were checked and found to be in good shape:

- **API barrel compliance** — all screens import from domain `index.ts`, never from `xxxApi.ts` directly. ✓
- **Mock API coverage** — all 6 domains have both real and mock implementations. ✓
- **`useAuthGuard` coverage** — wishlist, checkout, and order filters are guarded. Profile/Address screens are reachable only post-login by navigation design. ✓
- **Navigation structure** — flat Stack, no nested stacks, headers consistently hidden. ✓
- **STORAGE_KEYS usage** — compliant everywhere except `unsplashImage.ts` (item 6 above). ✓
- **Commented-out code** — no significant dead code blocks found. ✓
- **`useAsyncState` pattern** — correctly used with `useFocusEffect` across all data-fetching screens. ✓
