# CLAUDE.md — AI Operating Contract

---

## Safety Rules (Strict — override all other instructions)

- Do not read `.env` files or any sensitive configuration/secrets
- Never run `git add`, `commit`, `push`, `branch`, or `merge` commands
- Never execute destructive shell commands (`rm`, `mv`, overwrite files)
- Do not refactor multiple files unless explicitly requested
- Limit changes strictly to explicitly mentioned files only
- Do not generate or suggest changes outside the requested scope

---

## Operating Mode

- Implement changes directly using Edit/Write tools
- Make precise, minimal changes — respect existing architecture, patterns, naming
- Ask for clarification if scope is ambiguous

---

## Commands

```bash
npx react-native run-ios
npx react-native run-android
npx react-native start        # Metro bundler — no Vite dev server
npx tsc --noEmit
npx eslint . --ext .js,.jsx,.ts,.tsx
npx jest
```

---

## Stack

| Layer | Choice |
|---|---|
| Framework | React Native 0.81.4 — bare CLI, no Expo |
| Language | TypeScript 5.8.3. Do not add TS to existing `.js` files unless explicitly asked. |
| Navigation | React Navigation v7 Stack — 14 routes, flat, headers hidden. Initial route dynamic via `getInitialRoute()` in `src/utils/auth.ts`. |
| State | Context API + `useState` (local). `useAsyncState` for async. `CartContext.js` for global cart count only. |
| HTTP | Axios — `src/api/axiosInstance.ts`. Bearer token injected via Keychain-backed in-memory cache. |
| Styling | `StyleSheet.create()` + design tokens (default). NativeWind v4 primitives available. |
| Overlays | `@gorhom/bottom-sheet` v5. RN core `Modal`/`Alert`. No Gluestack overlays. |
| Animations | `Animated` API + `react-native-reanimated` v4. All durations from `Motion.*`. |
| Icons | `react-native-vector-icons` |

---

## Architecture Constraints — Do Not Change

- **No Redux, Zustand, or React Query.** Context API + `useAsyncState` is sufficient.
- **No Gluestack overlay packages.** `@gluestack-ui/actionsheet`, modal, popover, menu etc. depend on `react-dom`/`react-aria`/`react-transition-group` — ESM-only, incompatible with bare RN CLI. Metro cannot bundle them. Use `@gorhom/bottom-sheet` and RN core instead.
- **No centralized API router.** No `services.ts` or `integrations.ts`. Domain-scoped ownership is the architecture.
- **No adapter/domain-model layer.** DTOs are consumed directly. No normalization layer.
- **No navigation architecture changes.** Flat Stack, 14 routes. No tabs, nested stacks, or deep-link routing.
- **No broad TS migration of JS files.** `CartContext.js`, `AppNavigator.js` remain JS.
- **`src/stubs/`** — Metro resolver shims for `react-dom`, `react-transition-group`, `gluestack-overlay`. Keep. Removing causes build failures.
- **`src/components/gluestack/Actionsheet.tsx`** — re-implements Gluestack Actionsheet API via `@gorhom/bottom-sheet`. Preserves import surface. Keep.

---

## API Architecture

### Domain ownership

Each feature owns `src/api/<domain>/`: `productApi.ts`, `mockProductApi.ts`, `index.ts`. Screens import only from the domain barrel — never from implementation files.

```typescript
import { getProductsByCategory } from '../api/product';   // correct
import { getProductsByCategory } from '../api/product/productApi'; // never
```

### Adding a new API endpoint

1. Constant → `src/api/endpoints.ts`
2. Implementation → domain `xxxApi.ts` + `xxxMockApi.ts`
3. Export → domain `index.ts`
4. Types → `src/api/interfaces.ts`

### Backend envelope

All responses: `{ statusCode: 1|0, result: {...}, userMessage: string }`. Unwrap at call site. Application-level auto-raise (`statusCode !== 1`) is commented out in `axiosInstance.ts` — do not uncomment.

### Domain mock/real status

Read each domain's `index.ts` before assuming mock or real. Currently: auth/cart/wishlist/address/product = real. Order = mixed (`placeOrder` + `postOrderHistory` real; `postCnfOrderDetail` mock).

---

## Component Architecture

```
src/components/
├── primitives/   RN core wrappers with className support (Box, VStack, HStack,
│                 Text, Pressable, Divider, ScrollView, Image). Zero logic.
├── ui/           Semantic reusable UI — visual identity, design tokens, local animation.
│                 Exported via ui/index.ts.
├── system/       App-state components — ErrorState, RetryButton.
│                 InlineError is deprecated; use ErrorBanner instead.
└── gluestack/    Infrastructure bridge — Actionsheet.tsx only.
```

**Semantic extraction rule:** Extract a component when it has a semantic responsibility ("product identity block", "order row", "variant picker"). Never extract purely to reduce JSX line count.

---

## Styling

- Default: `StyleSheet.create()` + tokens imported from `'../theme'` barrel.
- NativeWind `className` available on primitives for static layout.
- **`className` is for static values only.** Animated styles, conditional colors, calculated dimensions → `style={}` always.
- Match the existing approach in any file you modify.
- **Never hardcode** hex colors, raw spacing, or raw font sizes. Always use tokens.

---

## Design System

### Tokens (`src/theme/tokens.ts`) — import from `'../theme'`

- `Colors.ink1`–`ink5` — text/icon scale
- `Colors.surface` / `surfaceSoft` / `surfaceDeep` — warm surface tiers
- `Colors.accent` — ember `#B25A3D`. Sparingly: discount markers, wishlist fill, CTA active, success ring. Max 3 per screen.
- `Colors.rule` — hairline dividers only. No other divider color.
- `Colors.danger` — destructive actions only. Not for discount badges.
- `Space.screenH` = 20px horizontal edge padding. `Space[1]`–`Space[12]` spacing scale.

### Fonts (`src/theme/fonts.ts`)

```
FontFamily.serif       // InstrumentSerif-Regular — names, headlines, prices
FontFamily.serifItalic // InstrumentSerif-Italic — wordmarks, taglines
FontFamily.mono        // JetBrainsMono-Regular — brand labels, order numbers, meta
FontFamily.sans        // undefined — system sans, body/UI text
```

### Typography (`src/theme/typography.ts`) — always use `Type.*` presets

```
Type.display    serif 40px  — hero headlines
Type.title      serif 28px  — screen/section titles
Type.heading    serif 22px  — product names, card titles
Type.priceLarge serif 32px  — cart total, hero price
Type.price      serif 22px  — standard prices
Type.label      mono 11px uppercase — brand labels, eyebrows, kickers, order numbers
Type.body       sans 16px   — body copy
Type.bodyStrong sans 16px medium — CTA labels
Type.caption    sans 13px   — secondary text, metadata
```

### Motion (`src/theme/motion.ts`) — all animations must bind to one of these

```
Motion.duration.tap    = 120ms  — press states, icon fills, badge bumps
Motion.duration.settle = 320ms  — list entrances, screen-in, sheet rise
Motion.duration.carry  = 560ms  — hero parallax, success draw, image scrub
Motion.spring.settle   — damping 18, stiffness 80
Motion.spring.snap     — damping 14, stiffness 180
Motion.pressScale      = 0.98
```

Ad-hoc durations are a hard failure. **Exception:** HomeScreen keeps its own local entrance animation (500ms/440ms, initialY=14) — do not replace.

---

## Visual Standards (Non-Negotiable)

**Editorial restraint** — Fewer elements. Remove before adding. Decoration requires justification.

**Serif-led hierarchy** — Product names, prices, headlines, section titles always use `FontFamily.serif`. Never bold sans for these roles.

**Mono micro-labels** — Brand names, category eyebrows, section kickers, field labels, order numbers: `Type.label` only.

**Image-first** — Product images dominate. No text overlay on heroes. Identity (brand → name → price) below the image on a calm surface. 4:5 portrait ratio for product cards.

**Calm surfaces** — `Colors.surface` / `surfaceSoft` / `surfaceDeep`. Depth through tone, not shadow. `Shadow.sm` only on sticky/overlapping elements.

**CTA hierarchy** — Primary: full-width ink pill, `Type.bodyStrong` white, `useTactile`. Secondary: `Type.caption` underlined text link, `Colors.ink3`. Never two equal-weight buttons.

**No marketplace density** — No rounded-card boxing on list items. Hairline `Colors.rule` dividers only.

**No startup aesthetics** — No purple/violet/blue. No glassmorphism. No gradient blobs. No glow. No confetti.

**Restrained motion** — Staggered, calm entrances. Press feedback via scale (0.98), not opacity flash.

---

## Haptics

```typescript
haptic.light()    // row tap, variant select, wishlist toggle, qty change
haptic.success()  // add-to-cart confirmed, order placed
haptic.warning()  // login failure, destructive confirm
```

---

## Established Patterns

**Async data fetch:**
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

**Skeleton + inline mutation error:**
```tsx
if (loading && !data?.length) return <Skeleton height={...} />;
{mutationError ? <ErrorBanner message={mutationError} onDismiss={() => setMutationError(null)} /> : null}
```

**Storage keys — always use the constant:**
```typescript
import { STORAGE_KEYS } from '../config/storageKeys';
AsyncStorage.getItem(STORAGE_KEYS.userData); // never bare string literals
```

**Profile code:**
```typescript
const profileCode = useProfileCode(); // number | null — prefer over reading userData directly
```

**Toast:**
```typescript
import { toastEmitter } from '../utils/toastEmitter';
toastEmitter.emit('success', 'Added to cart'); // fire-and-forget, works outside React tree
```

**Press-scale CTA:**
```tsx
const { animatedStyle, handlers } = useTactile();
<Animated.View style={animatedStyle}>
  <TouchableOpacity activeOpacity={1} {...handlers} />
</Animated.View>
// Or use PrimaryButton — useTactile is wired internally.
```

---

## Frozen Screens — Do Not Modify

These define the visual and interaction standard for all Phase 3 work.

**Login · HomeScreen · ProductScreen · CartScreen · OrderSuccessScreen**

Phase 3 complete: RegisterScreen · OTPVerificationScreen · ProfileScreen · AddressScreen · AddressManagementScreen

Phase 3 pending (match frozen standard exactly):
**ResultScreen → WishlistScreen → OrderHistoryScreen → OrderDetailScreen**

---

## State Rules

**Cart:** `useCart()` → `{ cartCount, setCartCount }`. Integer only — server-authoritative. Do not add item arrays to CartContext.

**Auth:** JWT in Keychain (`STORAGE_KEYS.authToken`). User data in AsyncStorage (`STORAGE_KEYS.userData`). Session validity checked at startup by `getInitialRoute()`.

**Screen-local:** `useState` + `useAsyncState`. Re-run on focus via `useFocusEffect`.

---

## Known Deferred Debt — Do Not Fix as Side Effects

| Item | Notes |
|---|---|
| `postCnfOrderDetail` on mock | Switch to real once `getOrderStatus` endpoint confirmed |
| `postUpdateCustomer` password | Overwrites stored password — backend fix pending |
| `useSession` adoption | AddressScreen, OrderHistoryScreen, OrderDetailScreen still read AsyncStorage directly |
| OrganisationID cold-start | `getOrgIdForInventory()` returns empty if user reaches checkout without browsing products |
| API response types | `axiosInstance` responses untyped (`any`) — incremental hardening deferred |
| Navigation prop typing | Most screens use `any`-typed nav props — should use `StackNavigationProp` generics |

---

## Conventions

- Components: functional + hooks. `FC<Props>` in `.tsx`.
- Formatting: single quotes, trailing commas, no arrow-function parens (`.prettierrc.js`).
- Comments: only when the WHY is non-obvious. Never describe what the code does.
- Screen styles: co-locate in `ScreenName.styles.ts` if the StyleSheet is large.
- New UI components: `src/components/ui/ComponentName.tsx` + export via `ui/index.ts`.
- New hooks: `src/hooks/useHookName.ts`.

---

## Reference

`docs/project-modernization-audit.md` — rationale for architectural decisions, phase history, full screen status table, detailed component inventory. Use as background context, not as an active blueprint.
