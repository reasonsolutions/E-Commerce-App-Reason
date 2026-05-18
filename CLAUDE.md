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

**Phase: Premium UX Refinement — Phase 3 in progress + Phase 4A consolidation complete**

All foundational engineering phases are complete:

- **Architecture stabilization** — design token system, shared component library, API error hierarchy, mock/real routing layer
- **Resilience rollout** — `useAsyncState`, cancellation-safe fetch, `ErrorState`/`ErrorBanner`/`Skeleton` across all screens
- **Cart synchronization cleanup** — phantom writes eliminated, `CartContext` rewritten to server-authoritative integer count, `CartScreen` mutations wired to real server APIs
- **Design-system foundations stabilized** — `Colors.star` token added, `Price` currency corrected, `useEntrance` extracted to shared hook, dead component variants deprecated
- **Phase 2 premium redesign** — Login, Home, ProductScreen, OrderSuccessScreen, CartScreen redesigned and frozen. Motion vocabulary, font system, and haptic infrastructure established.
- **Phase 4A consolidation** — utility extraction (`formatDate`, `orderStatus`), Order domain model + adapter, `UserSession` domain model + `sessionAdapter` + `useSession`, `DarkHeader` component extracted, `FadeImage` component extracted, `integrations.ts` cleanup, `postDeleteCartItem` numeric typing fix, wishlist stubs changed from throws to empty-result envelopes.

**Frozen screens (define the visual standard — do not modify):**
Login · Home · ProductScreen · OrderSuccessScreen · CartScreen

**Phase 3 pending (next continuation order):**
ResultScreen → WishlistScreen → OrderHistoryScreen → ProfileScreen → AddressScreen → OrderDetailScreen

See `docs/project-modernization-audit.md §16` for full Phase 2 implementation detail, frozen patterns, and binding rules.
See `docs/project-modernization-audit.md §17` for Phase 4A consolidation detail, remaining DTO leakage areas, and recommended next phase.

---

## Canonical Documentation

- **`docs/project-modernization-audit.md`** — primary engineering blueprint. Records all architectural decisions, patterns established, remaining debt, Phase 2 frozen patterns, and the forward plan. Use this as the ground-truth reference before making any structural change. **§16 documents all Phase 2 implementation decisions and binding patterns for Phase 3. §17 documents Phase 4A consolidation work, remaining DTO leakage, remaining session read sites, and recommended Phase 4B.**
- **`docs/premium-ux-refinement-spec.md`** — screen-by-screen premium UX spec. Part B status table shows which screens are frozen vs pending. Use as the design brief for Phase 3 work.
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
│   │   ├── integrations.ts        # Real API call implementations (cleaned Phase 4A)
│   │   ├── interfaces.ts          # TypeScript interfaces — API DTOs + domain models
│   │   ├── endpoints.js           # API endpoint string constants
│   │   ├── url.js                 # Base URL constant
│   │   ├── adapters/
│   │   │   ├── orderAdapter.ts    # DTO → Order / OrderDetail / DeliveryAddress domain
│   │   │   └── sessionAdapter.ts  # DTO → UserSession domain (Phase 4A)
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
│   │   ├── useEntrance.ts         # Shared entrance animation hook
│   │   ├── useHaptic.ts           # Haptic feedback wrapper (Phase 2)
│   │   ├── useTactile.ts          # Press-scale animator (Phase 2)
│   │   └── useSession.ts          # AsyncStorage session read → UserSession | null (Phase 4A)
│   ├── navigation/
│   │   └── AppNavigator.js        # Stack navigator, 11 routes, initial route: Login
│   ├── screens/                   # 11 screens
│   ├── theme/
│   │   ├── tokens.ts              # Colors, Space, Radius, FontSize, FontWeight, Shadow, ZIndex
│   │   ├── typography.ts          # Type.* preset system
│   │   ├── fonts.ts               # FontFamily constants (serif/mono/sans) — Phase 2
│   │   ├── motion.ts              # Motion vocabulary (Tap/Settle/Carry) — Phase 2
│   │   └── index.ts              # Re-export barrel
│   ├── config/
│   │   └── storageKeys.ts         # STORAGE_KEYS constants — use instead of raw strings
│   ├── utils/
│   │   ├── formatDate.ts          # ISO date → display string (Phase 4A)
│   │   └── orderStatus.ts         # OrderStatusCode → OrderStatus label (Phase 4A)
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
- `Colors.ink1`–`ink5` — primary text/icon scale
- `Colors.surface` / `surfaceSoft` / `surfaceDeep` — warm off-white surface tiers (depth through tone, not shadow)
- `Colors.accent` — ember `#B25A3D` — use sparingly (≤3 per session). For discount markers, CTA active states, success moments.
- `Colors.rule` — warm hairline dividers. Use instead of `Colors.line` in new work.
- `Colors.danger` — destructive actions only. **Not for discount badges or promos.**
- `Colors.star` — star rating color
- `Space.screenH` — horizontal screen edge padding (20)
- `Space.gapRow` / `Space.padCard` / `Space.padTap` — named density constants

### Font system (`src/theme/fonts.ts`)

```typescript
FontFamily.serif       // InstrumentSerif-Regular — product names, headlines, prices
FontFamily.serifItalic // InstrumentSerif-Italic — wordmarks, taglines, hero copy
FontFamily.mono        // JetBrainsMono-Regular — brand labels, order numbers, micro-meta
FontFamily.sans        // undefined — system sans (body, captions, UI text)
```

### Motion vocabulary (`src/theme/motion.ts`)

Three curves, three durations. Every animation must bind to one — ad-hoc durations are a review failure.

```
Motion.duration.tap    = 120ms  — press states, icon fills, badge bumps
Motion.duration.settle = 320ms  — list entrances, screen-in, sheet rise
Motion.duration.carry  = 560ms  — hero parallax, success draw, image scrub
Motion.spring.settle   — damping 18, stiffness 80 (list entrances)
Motion.spring.snap     — damping 14, stiffness 180 (badge pops, tight snaps)
Motion.pressScale      = 0.98   — press-in scale target
```

### Haptic bindings (`src/hooks/useHaptic.ts`)

```typescript
haptic.light()    // variant select, row tap, thumb change, wishlist toggle, qty tap
haptic.success()  // add-to-cart confirmed, order placed, mark draw complete
haptic.warning()  // login failure shake, destructive confirm
```

### Press-scale animation (`src/hooks/useTactile.ts`)

Use on all primary CTA buttons and interactive cards. Wraps `Animated.View` around `TouchableOpacity`, set `activeOpacity={1}` on the inner `TouchableOpacity`.

### Typography presets (`src/theme/typography.ts`)

`Type.*` presets are broadly adopted across all Phase 2 frozen screens. Always use a matching preset before writing inline `fontSize`/`fontWeight`.

Key roles for premium screens:
- `Type.display` — hero headlines (serif 40px)
- `Type.title` — screen/section titles (serif 28px)
- `Type.heading` — product names, card titles (serif 22px)
- `Type.priceLarge` — cart total, product hero price (serif 32px)
- `Type.price` — standard price figures (serif 22px)
- `Type.label` — brand names, eyebrows, section kickers (mono 11px, uppercase)
- `Type.body` / `Type.bodyStrong` — body copy / CTA labels (sans 16px)
- `Type.caption` — secondary text, metadata (sans 13px)

### Shared UI primitives (`src/components/ui/`)

| Component | Status |
|---|---|
| `Button` | Active — use for tappable actions. Note: Phase 2 frozen screens use direct `TouchableOpacity` + `useTactile` for CTAs to avoid `Colors.accent` primary variant; use `Button` for secondary/ghost/destructive. |
| `BottomNavBar` | Active — badge reads `cartCount` from `CartContext`, ember accent dot |
| `EmptyState` | Active — use editorial empty-state copy (e.g. "Nothing saved yet." not "Your cart is empty") |
| `ErrorBanner` | Active — inline error within loaded screens |
| `Skeleton` / `SkeletonRow` | Active — use during initial fetch |
| `ScreenHeader` | Active — plain and transparent variants |
| `QuantityStepper` | Active — sm/md sizes. Phase 2 CartScreen uses an inline minimal control instead; `QuantityStepper` still used in ProductScreen. |
| `StatusBadge` | Active — 5 order statuses |
| `SearchBar` | Active |
| `Price` | Active — currency `$`, `size` prop (sm/base/lg/xl). Use for all light-background price display. Do not use in hero/overlay contexts where white text is required — those remain inline. |
| `FloatingLabelInput` | **NEW (Phase 2)** — static-label underline input. Label always visible at `Type.label` scale. Only underline animates on focus (1→2px, Tap curve). Used in Login; safe for AddressScreen form fields. |
| `DarkHeader` | **NEW (Phase 4A)** — dark editorial header primitive. Props: `eyebrow`, `title`, `titleFont` (`serif`\|`mono`), `onBack`, `rightSlot`, `paddingTop`. Used by WishlistScreen, OrderHistoryScreen, OrderDetailScreen, ResultScreen. |
| `FadeImage` | **NEW (Phase 4A)** — `Animated.Image` with opacity fade-in on load. Props: `uri`, `width`, `height`, `borderRadius`, `resizeMode`, `style`, `imageStyle`. Uses `Motion.duration.settle`. Used by WishlistScreen, OrderHistoryScreen. |
| `Rating` | **Deprecated** — `@deprecated` JSDoc present. Token violation fixed (`Colors.star`). Adopt before use. |
| `SectionLabel` | **Deprecated** — `@deprecated` JSDoc present. Zero screen usage. |

### Shared system components (`src/components/system/`)

| Component | Status |
|---|---|
| `ErrorState` | Active — full-screen error + retry, used in 7 screens |
| `RetryButton` | Active — internal dependency of `ErrorState` |
| `InlineError` | **Deprecated** — `@deprecated` JSDoc present. Use `ErrorBanner` instead. |

### Animation hooks

**`src/hooks/useEntrance.ts`** — Shared entrance animation. Signature: `useEntrance(delay = 0, withScale = false, initialY = 10)`.
Wired to: CartScreen, WishlistScreen, OrderHistoryScreen, ProfileScreen, ResultScreen.
**Exception:** HomeScreen retains its own local `useEntrance` — durations (500ms/440ms) and `initialY=14` are intentionally different for its hero. Do not replace.

**`src/hooks/useTactile.ts`** — Press-scale animator. Returns `{ animatedStyle, handlers, scale }`. Wrap the pressable element in `Animated.View style={animatedStyle}`, spread `handlers` on the inner `TouchableOpacity`, set `activeOpacity={1}`. Used on all primary CTAs in frozen screens.

**`src/hooks/useHaptic.ts`** — Haptic wrapper. See haptic bindings above. Safe to call unconditionally — no-ops if native module not linked.

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
| Wishlist backend | `getWishlist`/`removeFromWishlist` use mock data. Real endpoints not yet integrated. In production mode stubs now return empty-result envelopes (no longer throw) — resolved Phase 4A. |
| Session reads not yet using `useSession` | AddressScreen, OrderHistoryScreen, OrderDetailScreen, WishlistScreen, CartScreen still read `STORAGE_KEYS.userData` directly. Adopt `useSession` per-screen during Phase 3 redesign. ProfileScreen already migrated (Phase 4A). |
| DTO field names in screen code | AddressScreen, WishlistScreen, CartScreen still reference raw backend field names. Add domain adapters as each screen enters Phase 3 scope. See audit §17.8. |
| API response types are `any` | `axiosInstance` responses are untyped. Incremental hardening planned in Phase 4B. See audit §17.7. |
| AddressScreen fetch error state | Missing `ErrorState` for delivery address fetch failure. Will be addressed in Phase 3 (B7). |
| Navigation prop typing | Most screens use `any`-typed navigation props. Should be typed with `StackNavigationProp` generics. |
| Login 55KB SVG | **RESOLVED Phase 2.** WebView eliminated. Hero is now pure React Native gradient composition. |
| `Type.*` adoption | **RESOLVED Phase 2.** Broadly adopted across all 5 frozen screens. Remaining Phase 3 screens still use inline token values — adopt during their redesign. |
| `postDeleteCartItem` string type | **RESOLVED Phase 4A.** Parameter corrected to `number`. `String()` cast removed from CartScreen call site. |

---

## Current Frozen Standards

These rules govern all Phase 2 and Phase 3 visual work. They are derived from the frozen screens and are non-negotiable during the premium UX phase.

**Editorial restraint** — Fewer elements per screen. Remove before adding. Decoration requires justification.

**Serif-led hierarchy** — Product names, prices, headlines, and section titles use `FontFamily.serif` or `Type.heading`/`Type.title`/`Type.priceLarge`. Never bold sans for these roles.

**Mono micro-labels** — Brand labels, category eyebrows, section kickers, field labels, and order numbers use `Type.label` (mono, uppercase) or `FontFamily.mono` directly.

**Image-first merchandising** — Product images dominate. No text overlay on heroes. Identity (brand, name, price) lives below the image on a calm surface. Use 4:5 portrait ratio for product cards.

**Restrained motion** — All animations bind to `Motion.duration.tap/settle/carry`. No ad-hoc durations. No bounce-heavy springs. Entrance choreography is staggered and calm. Press feedback through scale (0.98), not opacity flash.

**Calm premium atmosphere** — Surfaces: `surface` / `surfaceSoft` / `surfaceDeep` (warm off-white). Depth through tone, not shadow. `Shadow.sm` only on sticky overlapping surfaces. No `Shadow.md`/`Shadow.lg` on inline cards.

**Tactile confidence** — `useTactile` on all primary CTAs. `useHaptic` on all interactive taps per the binding table. Feedback is present but never loud.

**No startup aesthetics** — No purple/violet/blue accent colors. No glassmorphism. No gradient blobs. No glow effects. No confetti. No oversized icon stacks.

**No marketplace density** — No rounded-card boxing on list items. Hairline dividers only. No equal-weight dual CTAs. No filled discount chips in danger red.

**One accent, used sparingly** — `Colors.accent` (ember `#B25A3D`) for: discount markers, wishlist heart fill, success ring, primary CTA active state. Maximum 3 visual appearances per session.

**CTA hierarchy** — Primary: full-width ink pill, `Type.bodyStrong` white, `useTactile`. Secondary: `Type.caption` underlined text link, `Colors.ink3`. Never two equal-weight buttons.

---

## Claude Design Collaboration Guidance

When working on Phase 3 premium UX redesigns:

- **Upload** screenshots of frozen screens (Login, Home, Product, OrderSuccess, Cart) as the visual standard reference. These define the register.
- **Upload** `src/theme/tokens.ts`, `src/theme/typography.ts`, `src/theme/fonts.ts`, and `src/theme/motion.ts` as the design system context.
- **Do not redesign** the API layer, state management, or navigation structure — these are stable and out of scope.
- **Components safe to adopt in Phase 3:** `FloatingLabelInput` (AddressScreen), `EmptyState` (with editorial copy), `ErrorState`, `SkeletonRow`, `StatusBadge`. `Button` for secondary/ghost/destructive only.
- **Do not spec** `Rating`, `SectionLabel`, or `InlineError` — deprecated.
- **Phase 3 priority order:** ResultScreen → WishlistScreen → OrderHistoryScreen → ProfileScreen → AddressScreen → OrderDetailScreen.
- The engineering foundations are stable. Phase 3 is the same register as Phase 2 — visual hierarchy, motion quality, interaction feel.

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
