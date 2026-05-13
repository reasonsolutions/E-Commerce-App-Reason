# CLAUDE.md

## Safety Rules (Strict)

These rules override all other instructions.

- Do not read `.env` files or any sensitive configuration/secrets
- Never run `git add`, `commit`, `push`, `branch`, or `merge` commands
- Never execute destructive shell commands (`rm`, `mv`, overwrite files)
- Do not refactor multiple files unless explicitly requested
- Limit changes strictly to explicitly mentioned files only
- Do not generate or suggest changes outside the requested scope

---

## Operating Mode

- Directly implement changes when asked — use Edit/Write tools to modify source files
- Analyze the repository and provide precise, minimal changes
- Respect existing architecture, patterns, and naming conventions
- Ask for clarification if scope is ambiguous

---

## Current Project Phase

**Phase: Premium UX Refinement**

All foundational engineering phases are complete:

- **Architecture stabilization** — design token system, shared component library, API error hierarchy, mock/real routing layer
- **Resilience rollout** — `useAsyncState`, cancellation-safe fetch, `ErrorState`/`ErrorBanner`/`Skeleton` across all screens
- **Cart synchronization cleanup** — phantom writes eliminated, `CartContext` rewritten to server-authoritative integer count, `CartScreen` mutations wired to real server APIs
- **Design-system foundations stabilized** — `Colors.star` token added, `Price` currency corrected, `useEntrance` extracted to shared hook, dead component variants deprecated

The project now enters **premium UX refinement**: visual polish, motion quality, and interaction feel — not architecture changes.

---

## Canonical Documentation

- **`docs/project-modernization-audit.md`** — primary engineering blueprint. Records all architectural decisions, patterns established, remaining debt, and the forward plan. Use this as the ground-truth reference before making any structural change.
- **`docs/ui-audit.md`** — historical reference only. Captures the original state assessment before modernization. Superseded by the modernization audit.

---

## Commands

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android

# Metro bundler
npx react-native start

# TypeScript check
npx tsc --noEmit

# Lint
npx eslint . --ext .js,.jsx,.ts,.tsx

# Tests
npx jest
```

There is no Vite dev server — this is a React Native app using Metro bundler.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native 0.81.4 |
| Language | TypeScript 5.8.3 (mixed with JS in legacy files — do not add TS to JS files unless explicitly requested) |
| Navigation | React Navigation v7 (Stack) |
| State | Context API + useState (local), AsyncStorage (auth), server-authoritative cart count |
| HTTP | Axios — centralized instance in `src/api/axiosInstance.ts`, routed through `src/api/services.ts` |
| Icons | react-native-vector-icons |
| Animations | Animated API (`useEntrance` shared hook), lottie-react-native |
| Testing | Jest 29 with React Native preset |

---

## Repository and Branch State

- **`dev`** — canonical active branch. All work happens here. TypeScript compiles clean (0 errors, 51 files).
- **`main`** — frozen historical baseline. Do not modify. Exists as a reference only.
- Stash from parallel redesign work was analyzed and dropped — dev is complete and canonical.

---

## Project Structure

```
/
├── App.tsx                        # Root — SafeAreaProvider, CartProvider, AppNavigator
├── index.js                       # React Native entry point (AppRegistry)
├── src/
│   ├── api/
│   │   ├── axiosInstance.ts       # Axios base URL + timeout config
│   │   ├── services.ts            # Mock/real router — all screens import from here
│   │   ├── integrations.ts        # Real API call implementations
│   │   ├── interfaces.ts          # TypeScript interfaces for all API types
│   │   ├── endpoints.js           # API endpoint string constants
│   │   ├── url.js                 # Base URL constant
│   │   └── mock/                  # Mock data and mock service implementations
│   ├── components/
│   │   ├── ui/                    # Presentational primitives (no side effects)
│   │   ├── system/                # Application-state components (ErrorState, InlineError, RetryButton)
│   │   ├── ProductCard.tsx
│   │   └── CategoryItem.tsx
│   ├── context/
│   │   └── CartContext.js         # Single cartCount integer — server-authoritative
│   ├── hooks/
│   │   ├── useAsyncState.ts       # Cancellation-safe async state hook
│   │   └── useEntrance.ts         # Shared entrance animation hook
│   ├── navigation/
│   │   └── AppNavigator.js        # Stack navigator, 11 routes, initial route: Login
│   ├── screens/                   # 11 screens
│   ├── theme/
│   │   ├── tokens.ts              # Colors, Space, Radius, FontSize, FontWeight, Shadow, ZIndex
│   │   ├── typography.ts          # Type.* preset system
│   │   └── index.ts              # Re-export barrel
│   ├── config/
│   │   └── storageKeys.ts         # STORAGE_KEYS constants — use instead of raw strings
│   └── data/
│       └── mockData.js            # Local fallback data
├── android/
├── ios/
└── assets/images/
```

---

## Navigation

Stack navigator with all headers hidden by default. Initial route is `Login`.

| Route name | Screen file |
|---|---|
| `Login` | src/screens/Login.tsx |
| `Home` | src/screens/HomeScreen.tsx |
| `Product` | src/screens/ProductScreen.tsx |
| `Cart` | src/screens/CartScreen.tsx |
| `Result` | src/screens/ResultScreen.tsx |
| `Wishlist` | src/screens/WishlistScreen.tsx |
| `Address` | src/screens/AddressScreen.tsx |
| `OrderSuccess` | src/screens/OrderSuccessScreen.tsx |
| `Orders` | src/screens/OrderHistoryScreen.tsx |
| `OrderDetails` | src/screens/OrderDetailScreen.tsx |
| `Profile` | src/screens/ProfileScreen.tsx |

---

## State Management

**Cart (global):** `src/context/CartContext.js`
- `useCart()` returns `{ cartCount, setCartCount }`
- `cartCount` is a single integer — server-authoritative, not derived from local item state
- Seeded to `0` on cold start. `CartScreen` sets it after each successful fetch. `ProductScreen` increments it after a confirmed add-to-cart API call.
- Do not reconstruct an item-array reducer here. The lightweight count approach is intentional — see `docs/project-modernization-audit.md §7`.

**Auth (persistent):** AsyncStorage — stores customer profile code after login. Always use `STORAGE_KEYS.userData` (from `src/config/storageKeys.ts`), never hardcode the key string.

**Screen-local state:** `useState` + `useAsyncState`. Use `useFocusEffect` for logic that must re-run when a screen comes back into focus. Pass a cancellation ref from the effect cleanup to `useAsyncState.run()`.

---

## API Layer

- Base URL: `http://122.175.15.28:8110/api/ecomm/` (in `src/api/url.js`)
- All screen imports go through `src/api/services.ts` — the mock/real router. Do not import from `integrations.ts` directly in screens.
- Add new endpoints to `src/api/endpoints.js`, implementations to `src/api/integrations.ts`, mock versions to `src/api/mock/`, types to `src/api/interfaces.ts`, and wire the router in `src/api/services.ts`.
- `MOCK_MODE = __DEV__` in `services.ts` controls the routing. Mock data is returned in development unless explicitly overridden.

---

## Design System

### Token layer (`src/theme/tokens.ts`)

All color, spacing, radius, typography scale, shadow, and z-index values are tokenized. Never hardcode hex colors, raw spacing numbers, or raw font sizes in screens or components.

Key tokens in use:
- `Colors.star` — star rating color (was previously hardcoded `#F5A623`)
- `Space.screenH` — horizontal screen edge padding (16)
- `Space.gapRow` / `Space.padCard` / `Space.padTap` — named density constants

### Typography presets (`src/theme/typography.ts`)

`Type.*` presets provide semantic text roles. Currently adopted only in `OrderSuccessScreen`. Target for broader adoption during premium UX pass — do not skip ahead and create one-off inline text styles when a matching preset exists.

### Shared UI primitives (`src/components/ui/`)

| Component | Status |
|---|---|
| `Button` | Active — use for all tappable actions |
| `BottomNavBar` | Active — badge reads `cartCount` from `CartContext` |
| `EmptyState` | Active |
| `ErrorBanner` | Active — inline error within loaded screens |
| `Skeleton` / `SkeletonRow` | Active — use during initial fetch |
| `ScreenHeader` | Active — plain and transparent variants |
| `QuantityStepper` | Active — sm/md sizes |
| `StatusBadge` | Active — 5 order statuses |
| `SearchBar` | Active |
| `Price` | Active — currency `$`, `size` prop (sm/base/lg/xl). Use for all light-background price display. Do not use in hero/overlay contexts where white text is required — those remain inline. |
| `Rating` | **Deprecated** — `@deprecated` JSDoc present. Token violation fixed (`Colors.star`). Adopt before use, not before fixing. |
| `SectionLabel` | **Deprecated** — `@deprecated` JSDoc present. Zero screen usage. Migrate HomeScreen section headers to it during premium pass. |

### Shared system components (`src/components/system/`)

| Component | Status |
|---|---|
| `ErrorState` | Active — full-screen error + retry, used in 7 screens |
| `RetryButton` | Active — internal dependency of `ErrorState` |
| `InlineError` | **Deprecated** — `@deprecated` JSDoc present. Use `ErrorBanner` instead. |

### Motion (`src/hooks/useEntrance.ts`)

Shared entrance animation hook. Signature: `useEntrance(delay = 0, withScale = false, initialY = 10)`.

Wired to: CartScreen, WishlistScreen, OrderHistoryScreen, ProfileScreen, ResultScreen.

**Exception:** HomeScreen retains its own local `useEntrance` — its durations (500ms/440ms) and `initialY=14` are intentionally different for its hero section. Do not replace it with the shared hook.

---

## Established Patterns — Follow These

**Async data fetching:**
```typescript
const { data, loading, isError, error, run } = useAsyncState<T>(initialValue);

useFocusEffect(useCallback(() => {
  const cancelled = { current: false };
  run(async () => { /* fetch */ }, cancelled);
  return () => { cancelled.current = true; };
}, [run]));
```

**Full-screen error state:**
```tsx
if (isError) return <ErrorState title="..." message={error ?? ''} onRetry={fetchFn} retryLoading={loading} />;
```

**Inline mutation error:**
```tsx
{mutationError ? <ErrorBanner message={mutationError} onDismiss={() => setMutationError(null)} /> : null}
```

**Skeleton loading:**
```tsx
if (loading && !data?.length) return <Skeleton height={...} />;
```

---

## Architectural Constraints — Do Not Change

These decisions were made deliberately. Do not reverse them without reading `docs/project-modernization-audit.md §10` first.

- **No Redux, Zustand, or React Query.** Context API + `useAsyncState` is sufficient and stable. Migrating would be pure churn.
- **No enterprise design-system abstraction.** The two-tier `ui/` + `system/` split is the right level of abstraction for this codebase size.
- **No navigation architecture changes.** The flat Stack navigator with 11 routes works. Do not introduce tab navigators, nested stacks, or deep-link routing during the premium UX phase.
- **No broad TS migration of plain-JS files.** `CartContext.js`, `AppNavigator.js`, and a few others remain JS. Converting them is low-value risk during the UX refinement phase.
- **No architecture rewrites during premium UX work.** The foundational phases are complete. Premium refinement is visual and interaction work only.

---

## Explicitly Discouraged During Premium Phase

- Introducing new state management libraries
- Replacing `useAsyncState` with a third-party alternative
- Adding a global error boundary that swallows per-screen error handling
- Converting the `services.ts` mock layer to an MSW or similar framework
- Adding a new navigation paradigm (tabs, deep links, bottom sheet navigation)
- Expanding the component library with premature abstractions not driven by an immediate screen need
- Refactoring files that are not in scope for the current task

---

## Known Deferred Technical Debt

These are documented and intentionally not addressed yet. Do not fix them as side effects of unrelated tasks.

| Item | Notes |
|---|---|
| Cold-start cart badge zero | `cartCount` starts at 0; only populated after `CartScreen` is visited. Fix: fetch cart count in the post-login flow. Tracked as P1-01 in audit doc. |
| Quantity mutation single-unit | `quantityIncrement`/`quantityDecrement` adjust by exactly one unit per call. CartScreen calls once per tap regardless of delta. Tracked as P1-02. |
| Wishlist backend | `getWishlist`/`removeFromWishlist` use mock data. Real endpoints not yet integrated. |
| Session/AsyncStorage centralization | Each screen reads `STORAGE_KEYS.userData` independently. A session context would centralize this. |
| AddressScreen fetch error state | Missing `ErrorState` for delivery address fetch failure. |
| Navigation prop typing | Most screens use `any`-typed navigation props. Should be typed with `StackNavigationProp` generics. |
| `Type.*` adoption | Typography presets exist but are only used in `OrderSuccessScreen`. All other screens use inline token values. |

---

## Claude Design Collaboration Guidance

When working with Claude Design on premium UX refinement:

- **Upload** production screenshots of each screen plus `src/theme/tokens.ts` and `src/theme/typography.ts` as primary context.
- **Do not redesign** the API layer, state management, or navigation structure — these are stable and out of scope.
- **Components safe to spec for visual refinement:** `Button`, `BottomNavBar`, `EmptyState`, `ErrorState`, `ScreenHeader`, `QuantityStepper`, `StatusBadge`, `Skeleton`/`SkeletonRow`, `Price`, and all 7 token files.
- **Do not spec** `Rating`, `SectionLabel`, or `InlineError` — these carry `@deprecated` markers and are not in active use.
- **First premium target:** `OrderSuccessScreen` animated checkmark — currently renders a plain `✓` text character. This is the highest emotional moment in the purchase flow and the weakest current implementation.
- The engineering foundations are stable. Premium refinement is about interaction feel, motion quality, and visual hierarchy — not structural changes.

---

## Code Conventions

- **Components:** Functional components with hooks. `FC<Props>` typing in `.tsx` files.
- **Styling:** `StyleSheet.create()` scoped per file — no global stylesheets.
- **Tokens:** Import from `'../theme'` (barrel). Never hardcode colors, spacing, or font values.
- **AsyncStorage keys:** Always use `STORAGE_KEYS.*` from `src/config/storageKeys.ts`.
- **TypeScript:** Core API layer and all new files are typed. Do not add TS to existing `.js` files unless the task explicitly requires it.
- **Formatting:** Single quotes, trailing commas, no arrow-function parens (`.prettierrc.js`).
- **Comments:** Only when the WHY is non-obvious. Never describe what the code does.

---

## File Conventions

- Screens: `src/screens/ScreenName.tsx`
- Reusable UI primitives: `src/components/ui/ComponentName.tsx` + export via `src/components/ui/index.ts`
- System state components: `src/components/system/ComponentName.tsx` + export via `src/components/system/index.ts`
- Hooks: `src/hooks/useHookName.ts`
- New API types: `src/api/interfaces.ts`
- New endpoints: constant in `src/api/endpoints.js`, implementation in `src/api/integrations.ts`, mock in `src/api/mock/`, router entry in `src/api/services.ts`
