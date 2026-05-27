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
| Framework | React Native 0.81.4 (bare CLI — no Expo) |
| Language | TypeScript 5.8.3 (mixed with JS in legacy files — do not add TS to JS files unless explicitly asked) |
| Navigation | React Navigation v7 (Stack) |
| State | Context API + useState (local), AsyncStorage (auth), server-authoritative cart count |
| HTTP | Axios — `src/api/axiosInstance.ts`, domain-scoped API modules |
| Styling | StyleSheet.create() + design tokens (primary). NativeWind v4 primitives available. |
| Icons | react-native-vector-icons |
| Animations | Animated API (`useEntrance`, `useTactile`), react-native-reanimated v4, lottie-react-native |
| Overlays | @gorhom/bottom-sheet v5 (Reanimated-native, gesture-native) |
| Testing | Jest 29 with React Native preset |

---

## Project Structure

```
/
├── App.tsx                          # Root — SafeAreaProvider, CartProvider, AppNavigator
├── index.js                         # React Native entry point (AppRegistry)
├── tailwind.config.js               # NativeWind config — mirrors src/theme/tokens.ts
├── src/
│   ├── api/
│   │   ├── axiosInstance.ts         # Axios client — env-based BASE_URL, interceptors
│   │   ├── apiError.ts              # Error classification + dev logging
│   │   ├── endpoints.ts             # All endpoint URL constants
│   │   ├── interfaces.ts            # TypeScript interfaces — DTO shapes + domain types
│   │   ├── mock/
│   │   │   └── mockData.ts          # Shared mock response fixtures
│   │   ├── product/
│   │   │   ├── productApi.ts        # Real product API calls
│   │   │   ├── mockProductApi.ts    # Mock implementations
│   │   │   └── index.ts            # MOCK_MODE switch → exports real or mock
│   │   ├── auth/                    # Same structure as product/
│   │   ├── cart/                    # Same structure — uses global MOCK_MODE
│   │   ├── order/                   # Same structure
│   │   ├── wishlist/                # Same structure
│   │   └── address/                 # Same structure
│   ├── components/
│   │   ├── primitives/              # Thin RN core wrappers (className-enabled)
│   │   ├── ui/                      # Semantic reusable UI components
│   │   ├── system/                  # App-state components (errors, loading)
│   │   ├── gluestack/
│   │   │   └── Actionsheet.tsx      # Gorhom bottom-sheet behind Gluestack export surface
│   │   ├── ProductCard.tsx
│   │   └── CategoryItem.tsx
│   ├── config/
│   │   ├── env.ts                   # MOCK_MODE constant (__DEV__ default)
│   │   └── storageKeys.ts           # STORAGE_KEYS — always use instead of raw strings
│   ├── constants/                   # Other app-wide constants
│   ├── context/
│   │   └── CartContext.js           # Single cartCount integer — server-authoritative
│   ├── data/
│   │   └── mockData.js              # Legacy local fallback data
│   ├── hooks/
│   │   ├── useAsyncState.ts         # Cancellation-safe async state hook
│   │   ├── useEntrance.ts           # Shared entrance animation hook
│   │   ├── useHaptic.ts             # Haptic feedback wrapper
│   │   ├── useTactile.ts            # Press-scale animator
│   │   ├── useSession.ts            # AsyncStorage session read → UserSession | null
│   │   └── useAppToast.ts           # Toast notification hook
│   ├── lib/                         # Gluestack provider setup
│   ├── navigation/
│   │   └── AppNavigator.js          # Stack navigator — 11 routes, initial: Login
│   ├── screens/                     # 11 screens
│   ├── stubs/                       # Metro resolver shims for web-only packages
│   ├── theme/
│   │   ├── tokens.ts                # Colors, Space, Radius, FontSize, FontWeight, Shadow, ZIndex
│   │   ├── typography.ts            # Type.* preset system
│   │   ├── fonts.ts                 # FontFamily constants
│   │   ├── motion.ts                # Motion vocabulary (Tap/Settle/Carry)
│   │   └── index.ts                 # Re-export barrel
│   ├── types/                       # Global TypeScript declarations (env.d.ts)
│   └── utils/
│       ├── formatDate.ts            # ISO date → display string
│       └── orderStatus.ts           # OrderStatusCode → label
├── android/
├── ios/
└── assets/images/
```

---

## Navigation

Stack navigator, all headers hidden by default. Initial route: `Login`.

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

## API Architecture

### Domain-scoped ownership

Each feature domain owns its own API directory. Screens import directly from the domain — there is no centralized router or service facade.

```
src/api/product/
  productApi.ts       # Real HTTP calls via axiosInstance
  mockProductApi.ts   # Mock implementations returning fixture data
  index.ts            # Switches between real/mock based on MOCK_MODE

// Screen usage:
import { getProductsByCategory } from '../api/product';
```

### Real API status (verified per domain index.ts)

| Domain | Status | Notes |
|---|---|---|
| `product` | Real | Hardcodes `false` for MOCK_MODE |
| `auth` | Real | All functions including `postUpdateCustomer` |
| `cart` | Real | All functions |
| `address` | Real | All functions |
| `wishlist` | Real | All functions |
| `order` | Mixed | `placeOrder` + `postPlacedMultipleOrder` = real; `postOrderHistory` + `postCnfOrderDetail` = mock (pending backend response verification) |

**Do not assume any domain is on mock without reading its `index.ts` first.**

### Axios instance

`src/api/axiosInstance.ts` — reads `API_BASE_URL` from `.env`, 10s timeout. Request interceptor has a TODO for auth token injection. Response interceptor classifies all HTTP/network errors into `ApiError`. Application-level envelope check (`statusCode !== 1`) is commented out pending screen migration — do not uncomment without reading the TODO block.

### Backend envelope

All real API responses wrap data in `{ statusCode: 1 | 0, result: {...}, userMessage: string }`. Screen code unwraps at the call site (e.g., `response.data?.result?.Products ?? []`). DTOs are used directly — there is no adapter layer.

### Adding a new API

1. Add endpoint constant to `src/api/endpoints.ts`
2. Add implementation to the relevant domain `xxxApi.ts`
3. Add mock to `xxxMockApi.ts`
4. Export from domain `index.ts`
5. Add TypeScript types to `src/api/interfaces.ts`

---

## Styling Philosophy

### Primary approach: StyleSheet.create() + design tokens

All current screens use `StyleSheet.create()` with values imported from `src/theme/`. **This is the working standard.** Never hardcode hex colors, raw spacing numbers, or raw font sizes — always import from the theme barrel (`'../theme'`).

### NativeWind primitives (available, not yet dominant)

`src/components/primitives/` provides thin React Native core wrappers that accept a `className` prop. These enable Tailwind-style `className` usage without installing the full Gluestack runtime. They pass all props through unchanged — zero abstraction overhead.

```tsx
// Available primitives
import { Box, VStack, HStack, Text, Pressable, Divider, ScrollView, Image } from '../components/primitives';

// className maps to tailwind.config.js tokens
<Box className="bg-surface px-screenH" />
```

`tailwind.config.js` mirrors all design tokens from `src/theme/tokens.ts` — the same values are available as both Tailwind classes and TypeScript imports.

### When to use which

| Situation | Approach |
|---|---|
| Static layout/color/spacing | Either `className` (primitives) or `StyleSheet.create()` — be consistent within a file |
| Dynamic/runtime values (e.g. animated styles, calculated widths) | `style={}` inline or `StyleSheet.create()` — never `className` |
| Existing screen you're modifying | Match the file's existing approach |
| New screen | StyleSheet.create() + tokens is the stable default |

### What to avoid

- **Utility-class soup** — long unreadable `className` strings with 20+ tokens
- **Giant StyleSheet.create files** — extract semantic components instead of writing 300-line style objects
- **Meaningless wrapper abstractions** — don't extract a component just to reduce JSX lines; extract when there's semantic responsibility
- **Hardcoded values** — no `'#B25A3D'`, no `fontSize: 16`, no `padding: 20`. Always use tokens.

---

## Component Architecture

### Layer responsibilities

```
src/components/
├── primitives/     RN core wrappers that accept className (Box, VStack, HStack,
│                   Text, Pressable, Divider, ScrollView, Image). Zero logic.
│
├── ui/             Semantic reusable UI — has visual identity, uses design tokens,
│                   may contain local animation. Exported via ui/index.ts.
│
├── system/         App-state components — ErrorState, InlineError, RetryButton.
│                   These render loading/error/empty conditions, not content.
│
└── gluestack/      Infrastructure bridge — Actionsheet.tsx wraps @gorhom/bottom-sheet
                    behind the Gluestack Actionsheet export surface.
```

### Semantic extraction rule

Extract a component when it has a **semantic responsibility** (e.g. "product identity block", "order row", "variant picker"). Do not extract purely to reduce JSX size or create one-off wrappers.

### Active UI components (`src/components/ui/`)

| Component | Role |
|---|---|
| `PrimaryButton` | Full-width ink pill CTA — `useTactile` + `useHaptic` built in |
| `TextLinkButton` | Secondary underlined text CTA |
| `Button` | Multi-variant button (primary/secondary/ghost/destructive) |
| `BottomNavBar` | Bottom navigation — reads `cartCount` from CartContext, ember badge |
| `ScreenHeader` | Header for light-surface screens |
| `DarkHeader` | Dark editorial header. Props: `eyebrow`, `title`, `titleFont`, `onBack`, `rightSlot`, `paddingTop` |
| `ProductIdentity` | Brand + name + price stacked block |
| `FadeImage` | `Animated.Image` with opacity fade-in on load (Motion.duration.settle) |
| `Price` | Formatted price display — currency `$`, `size` prop (sm/base/lg/xl), strikethrough was-price |
| `QuantityStepper` | − N + control (sm/md sizes, mono styling) |
| `StatusBadge` | 5 order statuses |
| `SearchBar` | Search input with icon |
| `FloatingLabelInput` | Static-label underline input. Label always at `Type.label` scale. Used in Login and AddressScreen. |
| `EmptyState` | Use editorial copy ("Nothing saved yet." not "Your wishlist is empty") |
| `ErrorBanner` | Inline error within loaded screens — for mutation errors |
| `Skeleton` / `SkeletonRow` | Skeleton loading placeholders |
| `Toast` / `AppToast` | Toast notifications with variants — use with `useAppToast` |
| `VariantSheet` | Bottom sheet for variant selection — uses `gluestack/Actionsheet` |
| `HeroNavButton` | Floating nav button (ProductScreen) |
| `Rating` | Star rating display — `Colors.star` token |

### Active system components (`src/components/system/`)

| Component | Status |
|---|---|
| `ErrorState` | Full-screen error + retry. Use when async fetch fails. |
| `RetryButton` | Internal dependency of `ErrorState`. |
| `InlineError` | Deprecated — use `ErrorBanner` instead. |

---

## State Management

**Cart (global):** `src/context/CartContext.js`
- `useCart()` returns `{ cartCount, setCartCount }`
- `cartCount` is a single integer — server-authoritative, not derived from local item state
- Seeded to `0` on cold start. CartScreen sets it after each fetch. ProductScreen increments after confirmed add-to-cart.
- Do not rebuild an item-array reducer here. The lightweight count is intentional.

**Auth (persistent):** AsyncStorage. Always use `STORAGE_KEYS.userData` from `src/config/storageKeys.ts` — never hardcode the key string. `useSession` hook wraps this read.

**Screen-local:** `useState` + `useAsyncState`. Use `useFocusEffect` for logic that must re-run when a screen re-enters focus.

---

## Gluestack: Finalized Position

**Do not install additional `@gluestack-ui/*` overlay packages.**

The Gluestack overlay stack (`@gluestack-ui/actionsheet`, `@gluestack-ui/modal`, `@gluestack-ui/popover`, `@gluestack-ui/menu`, etc.) requires `react-dom`, `react-aria`, and `react-transition-group` — ESM-only packages incompatible with bare React Native CLI. Metro cannot bundle them without ejecting.

**Current stance:**
- `@gluestack-ui/nativewind-utils` — used for class generation. Keep.
- `src/components/primitives/` — thin NativeWind-enabled wrappers. Keep.
- `src/components/gluestack/Actionsheet.tsx` — re-implements the Actionsheet API using `@gorhom/bottom-sheet`. Keep. This file preserves the export surface so all consumers compile unchanged.
- `src/stubs/` — Metro resolver shims (`react-dom.js`, `react-transition-group.js`, `gluestack-overlay.js`). These are no-ops. Keep — removing them will cause build failures.

**For overlays and interactions, use:**
| Need | Library |
|---|---|
| Bottom sheets, variant pickers, filter sheets | `@gorhom/bottom-sheet` v5 (via `gluestack/Actionsheet.tsx`) |
| Modals | React Native `Modal` (core) |
| Alerts | React Native `Alert` (core) |
| Toasts | Local `AppToast` + `useAppToast` |
| Gestures | `react-native-reanimated` gesture handlers |

---

## Design System

### Token layer (`src/theme/tokens.ts`)

All color, spacing, radius, typography scale, shadow, and z-index values are tokenized. Import from `'../theme'` (barrel). **Never hardcode hex colors, raw spacing, or raw font sizes.**

Key tokens:
- `Colors.ink1`–`ink5` — primary text/icon scale (ink1 = `#111111`)
- `Colors.surface` / `surfaceSoft` / `surfaceDeep` — warm off-white surface tiers
- `Colors.accent` — ember `#B25A3D` — use sparingly (≤3 per screen). Discount markers, wishlist fill, CTA active state.
- `Colors.rule` — warm hairline dividers (`#E2DED7`). Use instead of any other divider color.
- `Colors.danger` — destructive actions only. Not for discount badges.
- `Colors.star` — star rating color (`#F5A623`)
- `Space.screenH` — horizontal screen edge padding (20px)
- `Space[1]`–`Space[12]` — spacing scale

### Font system (`src/theme/fonts.ts`)

```typescript
FontFamily.serif       // InstrumentSerif-Regular — product names, headlines, prices
FontFamily.serifItalic // InstrumentSerif-Italic — wordmarks, taglines, hero copy
FontFamily.mono        // JetBrainsMono-Regular — brand labels, order numbers, micro-meta
FontFamily.sans        // undefined — system sans (body, captions, UI text)
```

Tailwind equivalents: `font-serif`, `font-serifItalic`, `font-mono` (mapped in tailwind.config.js).

### Typography presets (`src/theme/typography.ts`)

Always use a `Type.*` preset before writing inline `fontSize`/`fontWeight`. Spread into `StyleSheet.create()` styles or use directly.

| Preset | Role |
|---|---|
| `Type.display` | Hero headlines (serif 40px) |
| `Type.title` | Screen/section titles (serif 28px) |
| `Type.heading` | Product names, card titles (serif 22px) |
| `Type.priceLarge` | Cart total, product hero price (serif 32px) |
| `Type.price` | Standard price figures (serif 22px) |
| `Type.label` | Brand names, eyebrows, section kickers (mono 11px, uppercase) |
| `Type.body` | Body copy (sans 16px) |
| `Type.bodyStrong` | CTA labels (sans 16px, medium weight) |
| `Type.caption` | Secondary text, metadata (sans 13px) |

### Motion vocabulary (`src/theme/motion.ts`)

All animations bind to one of three durations. Ad-hoc durations are a review failure.

```
Motion.duration.tap    = 120ms  — press states, icon fills, badge bumps
Motion.duration.settle = 320ms  — list entrances, screen-in, sheet rise
Motion.duration.carry  = 560ms  — hero parallax, success draw, image scrub
Motion.spring.settle   — damping 18, stiffness 80
Motion.spring.snap     — damping 14, stiffness 180
Motion.pressScale      = 0.98   — press-in scale target
```

**Exception:** HomeScreen retains its own local entrance animation (500ms/440ms, initialY=14). Do not replace.

### Haptic bindings (`src/hooks/useHaptic.ts`)

```typescript
haptic.light()    // row tap, variant select, wishlist toggle, qty change
haptic.success()  // add-to-cart confirmed, order placed
haptic.warning()  // login failure, destructive confirm
```

### Press-scale animation (`src/hooks/useTactile.ts`)

Use on all primary CTA buttons and interactive cards.

```tsx
const { animatedStyle, handlers } = useTactile();
<Animated.View style={animatedStyle}>
  <TouchableOpacity activeOpacity={1} {...handlers}>
    {/* content */}
  </TouchableOpacity>
</Animated.View>
```

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

**Full-screen error:**
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

**AsyncStorage — always use the constant:**
```typescript
import { STORAGE_KEYS } from '../config/storageKeys';
await AsyncStorage.getItem(STORAGE_KEYS.userData);
```

---

## Frozen Screens

These screens define the visual standard. Do not modify without explicit instruction.

**Login · HomeScreen · ProductScreen · CartScreen · OrderSuccessScreen**

Completed screens (redesigned to match frozen standard):
**ProfileScreen · AddressScreen**

Pending screens (Phase 3 candidates):
ResultScreen → WishlistScreen → OrderHistoryScreen → OrderDetailScreen

When redesigning a Phase 3 screen, match the register of the frozen screens exactly — see visual standards below.

---

## Visual Standards (Non-Negotiable)

**Editorial restraint** — Fewer elements. Remove before adding. Decoration requires justification.

**Serif-led hierarchy** — Product names, prices, headlines, section titles: `FontFamily.serif` or `Type.heading`/`Type.title`/`Type.priceLarge`. Never bold sans for these roles.

**Mono micro-labels** — Brand labels, category eyebrows, section kickers, field labels, order numbers: `Type.label` (mono, uppercase).

**Image-first merchandising** — Product images dominate. No text overlay on heroes. Identity (brand, name, price) below the image on a calm surface. 4:5 portrait ratio for product cards.

**Restrained motion** — All animations bind to `Motion.duration.*`. No ad-hoc durations. Entrance choreography is staggered and calm. Press feedback via scale (0.98), not opacity flash.

**Calm surfaces** — `Colors.surface` / `surfaceSoft` / `surfaceDeep`. Depth through tone, not shadow. `Shadow.sm` only on sticky/overlapping surfaces.

**One accent, sparingly** — `Colors.accent` for: discount markers, wishlist heart fill, success ring, primary CTA active state. Maximum 3 visual appearances per screen.

**CTA hierarchy** — Primary: full-width ink pill, `Type.bodyStrong` white, `useTactile`. Secondary: `Type.caption` underlined text link, `Colors.ink3`. Never two equal-weight buttons.

**No marketplace density** — No rounded-card boxing on list items. Hairline `Colors.rule` dividers only. No filled discount chips in danger red.

**No startup aesthetics** — No purple/violet/blue accent. No glassmorphism. No gradient blobs. No glow. No confetti.

---

## Architectural Constraints — Do Not Change

- **No Redux, Zustand, or React Query.** Context API + `useAsyncState` is stable and sufficient.
- **No Gluestack overlay packages.** The ESM incompatibility is real. Use `@gorhom/bottom-sheet` and RN core overlays instead.
- **No navigation architecture changes.** Flat Stack with 11 routes works. No tabs, nested stacks, or deep-link routing.
- **No broad TS migration of JS files.** `CartContext.js`, `AppNavigator.js`, `CartItem.js` remain JS.
- **No centralized API router.** Domain-scoped ownership is the architecture. Do not recreate `services.ts`.
- **No adapter/domain-model layer.** DTOs are used directly. The adapters from a previous architecture have been removed.

---

## Known Deferred Debt

Do not fix these as side effects of unrelated tasks.

| Item | Notes |
|---|---|
| `placeOrder` blocked | `placeOrder` API requires `OrganisationID` in `OrderDetails` but no product/cart API returns it. Backend must add `OrganisationID` to `getSaveCartItems` response. |
| `postUpdateCustomer` password | `Password` field is required but overwrites the stored password — cannot update profile without setting a new password. Backend discussing fix. |
| Order detail on mock | `postCnfOrderDetail` still uses mock in `order/index.ts`. Switch to real once `getOrderStatus` endpoint is confirmed working. |
| `useSession` adoption | AddressScreen, OrderHistoryScreen, OrderDetailScreen, WishlistScreen, CartScreen still read `STORAGE_KEYS.userData` directly. ProfileScreen already migrated. |
| Auth token injection | `axiosInstance` request interceptor has a TODO for injecting `Authorization` header. |
| API response types | `axiosInstance` responses are untyped (`any`). Incremental hardening deferred. |
| Navigation prop typing | Most screens use `any`-typed navigation props. Should use `StackNavigationProp` generics. |

---

## Code Conventions

- **Components:** Functional components with hooks. `FC<Props>` typing in `.tsx` files.
- **Styling:** `StyleSheet.create()` + token imports is the default. NativeWind primitives available for new work.
- **Tokens:** Import from `'../theme'` barrel. Never hardcode colors, spacing, or font values.
- **AsyncStorage keys:** Always `STORAGE_KEYS.*` from `src/config/storageKeys.ts`.
- **TypeScript:** Core API layer and all new files are typed. Do not add TS to existing `.js` files unless the task explicitly requires it.
- **Formatting:** Single quotes, trailing commas, no arrow-function parens (`.prettierrc.js`).
- **Comments:** Only when the WHY is non-obvious. Never describe what the code does.

---

## File Conventions

- Screens: `src/screens/ScreenName.tsx`
- Reusable UI primitives: `src/components/ui/ComponentName.tsx` + export via `src/components/ui/index.ts`
- RN core wrappers: `src/components/primitives/ComponentName.tsx` + export via `src/components/primitives/index.ts`
- System state components: `src/components/system/ComponentName.tsx` + export via `src/components/system/index.ts`
- Hooks: `src/hooks/useHookName.ts`
- New API types: `src/api/interfaces.ts`
- New endpoints: constant in `src/api/endpoints.ts`, implementation in domain `xxxApi.ts`, mock in `xxxMockApi.ts`, switch in domain `index.ts`

---

## Canonical Reference

`docs/project-modernization-audit.md` — historical engineering record. Contains rationale for architectural decisions and the Phase 2/3/4A implementation history. Use as background context, not as an active blueprint — the current architecture is what's described in this CLAUDE.md.
