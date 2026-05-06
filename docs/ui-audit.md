# UI/Design Audit — E-Commerce React Native App

**Date:** 2026-05-06
**Auditor:** Claude Code
**Scope:** `src/screens`, `src/components`, `src/context`, `src/api`, `src/data`, `App.tsx`
**App version:** See `package.json` → `version`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Screen-by-Screen Quality Assessment](#2-screen-by-screen-quality-assessment)
3. [Critical Bugs](#3-critical-bugs)
4. [Architecture Issues](#4-architecture-issues)
5. [Color System Audit](#5-color-system-audit)
6. [Typography Audit](#6-typography-audit)
7. [Spacing Audit](#7-spacing-audit)
8. [Repeated Pattern Inventory](#8-repeated-pattern-inventory)
9. [Dead Code Inventory](#9-dead-code-inventory)
10. [Reusable Component Opportunities](#10-reusable-component-opportunities)
11. [Design System Gaps](#11-design-system-gaps)
12. [Recommended Design System Structure](#12-recommended-design-system-structure)
13. [Migration Order](#13-migration-order)
14. [Files to Create or Modify](#14-files-to-create-or-modify)

---

## 1. Executive Summary

The app has a solid structural foundation — React Navigation v7, Context API, a clean API layer, and a consistent use of `SafeAreaView` and `StyleSheet.create`. The core user flows (browse → product → cart → checkout → order history) are all implemented end-to-end.

However, the codebase has grown without a shared design language. Styles are duplicated across 13 files, there are **7 distinct near-white background colors**, **5 different blue primaries**, and no shared spacing or typography scale. Several screens have broken navigation, missing safe area handling, or permanently-stuck loading states. The `CartContext` is disconnected from the server-side cart and is functionally dead, and the Login screen embeds a 55 KB SVG string inline, inflating the JS bundle significantly.

**Priority order for improvement:**

1. Fix the 5 crash/silent-failure bugs
2. Extract a theme token file (`colors`, `spacing`, `typography`, `shadows`)
3. Extract 4–6 shared components (BottomNavBar, ScreenHeader, PrimaryButton, EmptyState)
4. Address the CartContext disconnect and dead API functions

---

## 2. Screen-by-Screen Quality Assessment

| Screen | File | Rating | Key Issues |
|---|---|---|---|
| Login | `Login.tsx` | ⚠️ Fair | 55 KB SVG in JS bundle via WebView; dead `useWindowDimensions` import; `#1976d2` blue clashes with app primary |
| Home | `HomeScreen.tsx` | ✅ Good | Cleanest screen. Solid header, hero, sections, bottom nav. Minor: `flashDeals` import unused |
| Product | `ProductScreen.tsx` | ⚠️ Fair | Variant chips use a circle style (`colorOption`) for text labels — wrong shape. `addToCart({})` called with empty object |
| Result | `ResultScreen.tsx` | ⚠️ Fair | No header or back button. "Loading..." shown when list is empty (misleads user) |
| Cart | `CartScreen.tsx` | ✅ Good | Clean layout. Checkout button uses `#FF6B6B` (red) while app primary is blue — mid-funnel color shift |
| Address | `AddressScreen.tsx` | ❌ Poor | Exposes raw `CustomerProfileCode` in address card UI. No back button. Inline styles mixed with `StyleSheet`. `#1976d2` blue inconsistency |
| Order Success | `OrderSuccessScreen.tsx` | ✅ Good | Well-structured centered layout. Uses `#007bff` (lowercase) instead of `#007AFF` |
| Order History | `OrderHistoryScreen.tsx` | ✅ Good | Solid card + status badge design. Bottom nav copy-pasted from HomeScreen with subtle differences |
| Order Detail | `OrderDetailScreen.tsx` | ❌ Poor | No `SafeAreaView`. No back button. `StatusBar.currentHeight` misused as `contentContainerStyle` padding (broken on iOS). Permanent loading state until API responds |
| Profile | `ProfileScreen.tsx` | ❌ Poor | Navigates to `'OrderScreen'` (route does not exist). No `SafeAreaView`. Avatar styles defined but component never rendered. All info rows use inline styles |

---

## 3. Critical Bugs

Issues that crash, silently fail, or produce permanently broken UI.

### BUG-01 — Wrong route name in ProfileScreen

**File:** `src/screens/ProfileScreen.tsx:94`
**Severity:** High — tap does nothing, no error shown to user

```ts
// Current (broken)
navigation.navigate('OrderScreen')

// Fix
navigation.navigate('Orders')
```

---

### BUG-02 — CartContext receives empty object on add-to-cart

**Files:** `src/screens/ProductScreen.tsx:82–88`, `src/context/CartContext.js`
**Severity:** High — cart badge always shows 0; context is non-functional

```ts
// ProductScreen.tsx — current (broken)
const productToAdd = {};   // empty object
addToCart(productToAdd);   // dispatches nothing useful
```

The context `getCartItemsCount()` is used by HomeScreen's cart badge. Because context items are always empty, the badge never appears regardless of how many items are in the server cart.

**Fix options (choose one):**
- Remove `CartContext` entirely and derive `cartItemsCount` from the `getSavedCartItems` API response
- Wire `addToCart` to pass real product data and make the context the single source of truth (remove server-side cart dependency in CartScreen)

---

### BUG-03 — OrderDetailScreen permanently stuck on "Loading…"

**File:** `src/screens/OrderDetailScreen.tsx:82–88`
**Severity:** High — screen is unusable until `orderDetails.DeliveryDetail[0]` resolves

```ts
const delivery = orderDetails?.DeliveryDetail[0];  // null on mount

if (!order || !delivery) {
    return <View><Text>Loading...</Text></View>;  // no timeout, no error state
}
```

If the API fails, the screen shows "Loading..." forever with no error message.

---

### BUG-04 — Dead import in Login

**File:** `src/screens/Login.tsx:18`
**Severity:** Low — no runtime effect, code smell

```ts
const { width, height } = useWindowDimensions();  // width and height never used
```

---

### BUG-05 — `flashDeals` imported but never used in HomeScreen

**File:** `src/screens/HomeScreen.tsx:20`
**Severity:** Low — dead import

```ts
import { heroBanner, flashDeals } from '../data/mockData';  // flashDeals unused
```

---

## 4. Architecture Issues

### ARCH-01 — 55 KB SVG embedded as inline JS string in Login

**File:** `src/screens/Login.tsx` (165 lines, ~60 KB)

The decorative illustration on the login screen is a large animated SVG embedded as a JavaScript template literal, rendered inside a `WebView`. This has three negative effects:

- Inflates the JS bundle by ~55 KB
- `WebView` spins up a full browser engine process for a static decorative asset
- The string is re-evaluated on every render

**Fix:** Export the SVG to `assets/images/login-illustration.svg` and render it with `react-native-svg` or as a static image.

---

### ARCH-02 — Two parallel cart systems

The app has both a client-side `CartContext` and a server-side cart via `getSavedCartItems`. They are not in sync:

- `CartContext` items are always empty (see BUG-02)
- `CartScreen` fetches its own data from `getSavedCartItems` independently
- `HomeScreen` badge uses `getCartItemsCount()` from context → always 0

**Fix:** Pick one source of truth. Either make `CartContext` the live state (populated after login, synced with API) or remove it and use a `UserCartContext` that wraps the API calls.

---

### ARCH-03 — `AsyncStorage.getItem('userData')` duplicated 6 times

The same pattern appears in `ProductScreen`, `CartScreen`, `AddressScreen`, `OrderHistoryScreen`, `OrderDetailScreen`, and `ProfileScreen`:

```ts
const userData = await AsyncStorage.getItem('userData');
const user = JSON.parse(userData);
```

**Fix:** Centralise in `src/utils/storage.ts`:

```ts
export const getUser = async (): Promise<LoggedInCustomerInterface | null> => {
  const raw = await AsyncStorage.getItem('userData');
  return raw ? JSON.parse(raw) : null;
};
```

---

### ARCH-04 — HTTP base URL

**File:** `src/api/url.js:1`

```js
const url = 'http://122.175.15.28:8110/api/ecomm/'
```

All API traffic is unencrypted. On iOS 14+ this may be blocked by ATS unless explicitly exempted in `Info.plist`.

---

### ARCH-05 — No central navigation types

Each screen locally re-declares its own minimal `NavigationProp` type with only the routes it uses. There is no central `RootStackParamList`. This means route names are untyped strings — typos (like BUG-01) are not caught at compile time.

**Fix:** Define `RootStackParamList` in `src/utils/navigation.ts` and use it in all screens.

---

### ARCH-06 — No loading or error UI

All 20+ API `.catch()` handlers call only `console.error`. Users see blank screens on network failure with no feedback. No `ActivityIndicator`, skeleton screen, or error banner is used anywhere.

---

## 5. Color System Audit

### Blues (primary action color) — 5 values in use

| Value | Used in | Notes |
|---|---|---|
| `#007AFF` | HomeScreen, ProductScreen, CartItem, ProductCard, OrderHistory | iOS system blue — should be the standard |
| `#007bff` | OrderSuccessScreen | Same hue, lowercase hex — visually identical but inconsistent |
| `#007aff` | ResultScreen brand label | Same as above |
| `#1976d2` | Login, AddressScreen | Material Design blue — noticeably different shade |
| `#0078D4` | ProfileScreen | Microsoft Fluent blue — noticeably different shade |

**Recommendation:** Standardise on `#007AFF`. Replace all other blue values.

---

### Reds (destructive / price accent) — 5 values in use

| Value | Used in | Semantic role |
|---|---|---|
| `#FF6B6B` | Cart checkout button, CartItem trash, Address checkout | CTA (misused as primary action) |
| `#FF3B30` | HomeScreen cart badge | Notification / destructive |
| `#d32f2f` | ProfileScreen logout | Destructive |
| `#e91e63` | ResultScreen price | Price accent (pink) |
| `'red'` | ProductCard compare price | CSS named color — avoid |

**Recommendation:** Use `#FF3B30` for destructive actions and notification badges. Use `#e91e63` or a dedicated `colors.priceAccent` for discounted price display. Separate these concerns.

---

### Backgrounds — 7 near-white values in use

| Value | Used in |
|---|---|
| `#FFFFFF` | ProductScreen, CartScreen, OrderSuccess, OrderDetail |
| `#FAFAFA` | HomeScreen |
| `#F8F9FA` | OrderHistory, Profile |
| `#f8f8f8` | ResultScreen |
| `#f5f6fa` | AddressScreen container |
| `#f3f6fa` | Login container |
| `#f8f9fb` | Login input background |

**Recommendation:** Define two tokens: `colors.background` (screen background) and `colors.surface` (card/input background). Eliminate all variants.

---

### Status colors — mostly consistent

| Value | Meaning | Used in |
|---|---|---|
| `#FF9500` | Confirmed (order) | OrderHistory |
| `#007AFF` | Shipped (order) | OrderHistory |
| `#4CAF50` | Delivered / Success | OrderHistory, OrderSuccess |
| `#FF3B30` | Cancelled | OrderHistory |

These four are defined together inside a `switch` in `OrderHistoryScreen`. They should be promoted to named tokens and shared with `OrderDetailScreen`.

---

## 6. Typography Audit

### Font sizes in use — 15 distinct values

`11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 32, 40`

No named scale exists. Every screen chooses values ad-hoc.

**Recommended scale:**

| Token | Size | Usage |
|---|---|---|
| `typography.xs` | 11 | Badge labels |
| `typography.sm` | 13 | Meta text, nav labels |
| `typography.base` | 15 | Body text |
| `typography.md` | 17 | Input text, secondary labels |
| `typography.lg` | 20 | Section headers, card titles |
| `typography.xl` | 24 | Screen titles |
| `typography.xxl` | 32 | Hero / display |

---

### Font weight inconsistencies

`'400'`, `'500'`, `'600'`, `'700'`, and `'bold'` are all used. `'bold'` and `'700'` are equivalent but used interchangeably. Standardise on numeric values.

---

### Other typography issues

- `lineHeight` set in only 3 places out of ~50 text elements — most body text has no line height defined
- `letterSpacing` used inconsistently: `0`, `0.1`, `0.2`, `0.3`, `0.5`, `1`, `2` — no scale
- `textTransform: 'uppercase'` used in 2 places only — not a consistent pattern

---

## 7. Spacing Audit

### Horizontal screen padding — 5 values in use

| Value | Screens |
|---|---|
| `12` | ResultScreen |
| `16` | ProductScreen, CartScreen, OrderHistory, OrderDetail |
| `18` | HomeScreen |
| `24` | OrderSuccess, OrderDetail |
| `32` | Cart empty state, OrderHistory empty state |

HomeScreen uses `paddingHorizontal: 18` for sections but `paddingHorizontal: 18` for the header — consistent within the screen but misaligned with all others.

**Recommendation:** Standardise on `spacing.screenH = 16` for screen-edge padding.

---

### Border radius — 8 values in use

`4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25`

No naming or grouping. Cards use `8`, `10`, `12`, `14`, and `18` interchangeably.

**Recommendation:**

| Token | Value | Usage |
|---|---|---|
| `radii.sm` | 6 | Inputs, small chips |
| `radii.md` | 12 | Cards, product images |
| `radii.lg` | 18 | Hero banner, modals |
| `radii.full` | 999 | Pills, badges, circular buttons |

---

### Notable spacing bugs

- `OrderDetailScreen` passes `StatusBar.currentHeight` as `paddingTop` inside `contentContainerStyle` of a `ScrollView` — this is a misuse of the Android status bar workaround inside a scroll container, causes double-padding on Android and does nothing on iOS
- `ProductScreen` uses `paddingBottom: 100` on the description section as a magic number to clear the fixed action bar — fragile, should use `KeyboardAvoidingView` or measure the action bar height

---

## 8. Repeated Pattern Inventory

Each entry below is a pattern duplicated across files that should become a shared component or utility.

### Bottom Navigation Bar

**Duplicated in:** `HomeScreen.tsx`, `OrderHistoryScreen.tsx`

Style differences between the two copies:

| Property | HomeScreen | OrderHistoryScreen |
|---|---|---|
| `paddingVertical` | `8` | `12` |
| `paddingHorizontal` | `10` | `16` |
| `elevation` | `8` | `5` |
| `navText fontSize` | `13` | `12` |
| `borderTopWidth` | `1` | absent |

---

### Screen Header (back button + title + optional right action)

**Duplicated in:** `CartScreen.tsx`, `ProductScreen.tsx`, `OrderHistoryScreen.tsx`

Each implementation has different vertical padding, font size, or layout structure.

---

### Empty State (icon + title + subtitle + CTA button)

**Duplicated in:** `CartScreen.tsx`, `OrderHistoryScreen.tsx`

Same visual pattern, different style names and values.

---

### Quantity Stepper (decrement · count · increment pill)

**Duplicated in:** `ProductScreen.tsx` (40px buttons), `CartItem.js` (32px buttons)

Both use `backgroundColor: '#F5F5F5'` pill with white circular buttons but different sizes.

---

### AsyncStorage user fetch

**Duplicated in:** `ProductScreen.tsx`, `CartScreen.tsx`, `AddressScreen.tsx`, `OrderHistoryScreen.tsx`, `OrderDetailScreen.tsx`, `ProfileScreen.tsx` (6 files)

```ts
const userData = await AsyncStorage.getItem('userData');
const user = JSON.parse(userData);
```

---

### Shadow block

```ts
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 3.84,
elevation: 5,
```

Appears **10+ times** verbatim across screen and component files.

---

### `paddingTop: StatusBar.currentHeight || 0`

Appears in **8 screen containers**. Should be handled once at the navigator or `SafeAreaProvider` level.

---

## 9. Dead Code Inventory

Code that is defined but never called or rendered.

| Type | Location | Description |
|---|---|---|
| Import | `HomeScreen.tsx:20` | `flashDeals` imported from mockData, never used in JSX |
| Import | `Login.tsx:18` | `useWindowDimensions` imported, `width`/`height` never used |
| Export | `mockData.js` | `categories`, `products`, `flashDeals` exports — only `heroBanner` is used in any screen |
| Styles | `ProfileScreen.tsx` | `avatar`, `avatarImg`, `avatarText` styles defined but the avatar `View` is never rendered |
| API function | `integrations.ts` | `quantityIncrement` — defined, exported, never called from any screen |
| API function | `integrations.ts` | `quantityDecrement` — defined, exported, never called from any screen |
| API function | `integrations.ts` | `getBrands` — defined, exported, never called |
| API function | `integrations.ts` | `getSubCategories` — defined, exported, never called |
| API function | `integrations.ts` | `searchProducts` — defined, exported, never called |
| API function | `integrations.ts` | `postDeleteDeliveryAddress` — defined, exported, never called |
| API function | `integrations.ts` | `getDeliveryAddressForUpdate` — defined, exported, never called |
| API function | `integrations.ts` | `postUpdateDeliveryAddress` — defined, exported, never called |
| API function | `integrations.ts` | `postPlacedSingleOrder` — defined, exported, never called |
| Context | `CartContext.js` | Entire context is non-functional — `addToCart` is called with `{}` from ProductScreen |
| Cart wire-up | `CartItem.js` | Local quantity change never calls `quantityIncrement`/`quantityDecrement` API |

---

## 10. Reusable Component Opportunities

| Component | Currently | Appears in |
|---|---|---|
| `BottomNavBar` | Two diverged inline copies | HomeScreen, OrderHistoryScreen |
| `ScreenHeader` | Three diverged inline copies | Cart, Product, OrderHistory |
| `PrimaryButton` | Six+ inline `TouchableOpacity` blocks | Cart, Address, OrderSuccess, Profile, OrderHistory, Login |
| `OutlineButton` | Two inline copies | ProductScreen ("Buy Now"), OrderSuccess ("Continue Shopping") |
| `QuantityStepper` | Two diverged inline copies | ProductScreen, CartItem |
| `EmptyState` | Two diverged inline copies | Cart, OrderHistory |
| `StatusBadge` | Defined only in OrderHistory | Could be reused in OrderDetail |
| `ProductImageThumbnail` | `backgroundColor: '#F5F5F5'` pattern repeated | ProductCard, CartItem, OrderHistory card |
| `LoadingState` | Not defined anywhere | Needed by all 10 screens |

---

## 11. Design System Gaps

| Gap | Impact |
|---|---|
| No color token file | 20+ magic color strings across 13 files |
| No spacing scale | 15+ spacing values with no naming convention |
| No typography scale | 16 font sizes with no semantic names |
| No shadow presets | Shadow block copy-pasted 10+ times |
| No border-radius scale | 10 radius values used interchangeably |
| No loading state pattern | Screens show blank content during API calls |
| No error state pattern | All errors silently swallowed in `.catch(console.error)` |
| No navigation types | Route names are untyped strings — typos not caught at compile time |
| No shared user accessor | `AsyncStorage` user parse duplicated 6 times |

---

## 12. Recommended Design System Structure

```
src/
├── theme/
│   ├── colors.ts         ← all color tokens
│   ├── spacing.ts        ← 4px base scale + named screen padding
│   ├── typography.ts     ← font size scale + weight constants
│   ├── shadows.ts        ← 3 elevation levels (sm, md, lg)
│   ├── radii.ts          ← border radius scale
│   └── index.ts          ← barrel export: import { colors, spacing } from '../theme'
│
├── components/
│   ├── BottomNavBar.tsx
│   ├── ScreenHeader.tsx
│   ├── PrimaryButton.tsx
│   ├── OutlineButton.tsx
│   ├── QuantityStepper.tsx
│   ├── EmptyState.tsx
│   ├── StatusBadge.tsx
│   └── LoadingState.tsx
│
└── utils/
    ├── storage.ts        ← getUser(), clearUser()
    └── navigation.ts     ← RootStackParamList type
```

### Proposed color tokens

```ts
// src/theme/colors.ts
export const colors = {
  // Primary
  primary:        '#007AFF',
  primaryLight:   '#E5F1FF',

  // Semantic
  danger:         '#FF3B30',
  success:        '#4CAF50',
  warning:        '#FF9500',
  info:           '#007AFF',

  // Price
  priceAccent:    '#e91e63',

  // Order status
  statusConfirmed: '#FF9500',
  statusShipped:   '#007AFF',
  statusDelivered: '#4CAF50',
  statusCancelled: '#FF3B30',

  // Surfaces
  background:     '#F8F9FA',
  surface:        '#FFFFFF',
  surfaceAlt:     '#F5F5F5',

  // Borders
  border:         '#ECECEC',
  borderInput:    '#E0E0E0',

  // Text
  textPrimary:    '#1A1A1A',
  textSecondary:  '#555555',
  textMuted:      '#8E8E93',
  textDisabled:   '#C7C7CC',
  textInverse:    '#FFFFFF',
};
```

### Proposed spacing scale

```ts
// src/theme/spacing.ts
export const spacing = {
  xxs:     2,
  xs:      4,
  sm:      8,
  md:      16,
  lg:      24,
  xl:      32,
  xxl:     48,
  screenH: 16,   // standard horizontal screen padding
};
```

---

## 13. Migration Order

Recommended order minimises breakage — each step is independently deployable.

### Phase 1 — Fix bugs (no style changes)

| # | File | Change |
|---|---|---|
| 1 | `ProfileScreen.tsx:94` | `'OrderScreen'` → `'Orders'` |
| 2 | `ProductScreen.tsx:82` | Pass real product data to `addToCart` or remove the call |
| 3 | `OrderDetailScreen.tsx` | Add `SafeAreaView`, back button, real error/loading state |
| 4 | `ResultScreen.tsx` | Separate `loading` state from empty state |
| 5 | `Login.tsx` | Remove dead `useWindowDimensions` import |

### Phase 2 — Foundation (no component changes yet)

| # | File | Change |
|---|---|---|
| 6 | `src/theme/colors.ts` | Create — consolidate all color values |
| 7 | `src/theme/spacing.ts` | Create — spacing scale |
| 8 | `src/theme/typography.ts` | Create — font size + weight scale |
| 9 | `src/theme/shadows.ts` | Create — 3 shadow presets |
| 10 | `src/utils/storage.ts` | Create — `getUser()` helper |
| 11 | `src/api/url.js` | `http://` → `https://` |

### Phase 3 — Component extraction (safest-first order)

| # | Component | Replace in |
|---|---|---|
| 12 | `StatusBadge` | OrderHistoryScreen only (one consumer) |
| 13 | `EmptyState` | CartScreen, OrderHistoryScreen |
| 14 | `QuantityStepper` | ProductScreen, CartItem |
| 15 | `ScreenHeader` | CartScreen, ProductScreen, OrderHistoryScreen |
| 16 | `PrimaryButton` | All screens |
| 17 | `BottomNavBar` | HomeScreen, OrderHistoryScreen |

### Phase 4 — Architecture cleanup

| # | Change |
|---|---|
| 18 | Decide CartContext strategy: remove or make authoritative |
| 19 | Add `RootStackParamList` and type all screen navigation props |
| 20 | Add `LoadingState` and `ErrorState` patterns to all screens |
| 21 | Wire `CartItem` quantity changes to `quantityIncrement`/`quantityDecrement` API |
| 22 | Extract Login SVG to static asset, remove WebView |
| 23 | Remove dead exports from `mockData.js` and dead functions from `integrations.ts` |

---

## 14. Files to Create or Modify

### Create

```
docs/ui-audit.md                         ← this document
src/theme/colors.ts
src/theme/spacing.ts
src/theme/typography.ts
src/theme/shadows.ts
src/theme/index.ts
src/utils/storage.ts
src/utils/navigation.ts
src/components/BottomNavBar.tsx
src/components/ScreenHeader.tsx
src/components/PrimaryButton.tsx
src/components/OutlineButton.tsx
src/components/QuantityStepper.tsx
src/components/EmptyState.tsx
src/components/StatusBadge.tsx
src/components/LoadingState.tsx
```

### Modify

```
src/screens/ProfileScreen.tsx        fix: wrong route name (BUG-01), SafeAreaView, render avatar
src/screens/ProductScreen.tsx        fix: addToCart empty object (BUG-02), consume QuantityStepper
src/screens/OrderDetailScreen.tsx    fix: SafeAreaView, back button, StatusBar padding (BUG-03)
src/screens/ResultScreen.tsx         fix: loading vs empty state, add ScreenHeader
src/screens/Login.tsx                fix: dead import; extract SVG to static asset
src/screens/CartScreen.tsx           style: align checkout color to primary blue
src/screens/AddressScreen.tsx        style: remove CustomerProfileCode from UI, add back button
src/screens/HomeScreen.tsx           refactor: consume BottomNavBar after extraction
src/screens/OrderHistoryScreen.tsx   refactor: consume BottomNavBar
src/components/CartItem.js           fix: call quantity API on change
src/api/url.js                       security: HTTP → HTTPS
src/data/mockData.js                 cleanup: remove unused exports
src/api/integrations.ts              cleanup: remove or wire up 8 dead functions
```

---

*Generated by static code analysis. No files were modified.*
