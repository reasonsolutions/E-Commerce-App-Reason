# AGENTS.md — AI Operating Contract

---

## Guiding Principles

- Prefer existing patterns over introducing new abstractions.
- Read nearby code before inventing new architecture.
- Minimize surface area of changes.
- Treat this document as architectural guidance. The repository is the source of truth for implementation details and current project state.

---

## Safety Rules (Strict — override all other instructions)

- Do not read `.env` files or any sensitive configuration/secrets
- Never run `git add`, `commit`, `push`, `branch`, or `merge` commands
- Never execute destructive shell commands (`rm`, `mv`, overwrite files)
- Do not refactor multiple files unless explicitly requested
- Limit changes strictly to explicitly mentioned files only
- Do not generate or suggest changes outside the requested scope

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

## Tool Preferences

Prefer `rg` for repository-wide search, `fd` for file discovery, `tree` for structure overview. Preferences, not requirements.

---

## Stack

| Layer      | Choice                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework  | React Native — bare CLI, no Expo                                                                                                                                                           |
| Language   | TypeScript. Do not add TS to existing `.js` files unless explicitly asked.                                                                                                                 |
| Navigation | React Navigation — see Navigation section below. `navigationRef` in `src/utils/navigationService.ts` for navigation outside React (e.g. 401 handler).                                    |
| State      | Context API + `useState` (local). `useAsyncState` for async. `CartContext.js` for global cart count only.                                                                                  |
| HTTP       | Axios — `src/api/axiosInstance.ts`. Bearer token injected via Keychain-backed in-memory cache.                                                                                             |
| Styling    | `StyleSheet.create()` + design tokens (default). NativeWind v4 primitives available.                                                                                                       |
| Overlays   | `@gorhom/bottom-sheet`. RN core `Modal`/`Alert`. No Gluestack overlays.                                                                                                                     |
| Animations | `Animated` API + `react-native-reanimated`.                                                                                                                                                |
| Icons      | `react-native-vector-icons`                                                                                                                                                                |

Exact dependency versions: check `package.json` directly rather than trusting this doc.

---

## Architecture Constraints — Do Not Change

- **No Redux, Zustand, or React Query.** Context API + `useAsyncState` is sufficient.
- **No Gluestack overlay packages at runtime.** `@gluestack-ui/actionsheet` is still a listed dependency (import surface preserved), but its actual modal/popover/menu implementation depends on `react-dom`/`react-aria`/`react-transition-group` — ESM-only, incompatible with bare RN CLI. Metro cannot bundle them. `src/components/gluestack/Actionsheet.tsx` re-implements the same API surface on `@gorhom/bottom-sheet` instead — that's what's actually used. Keep this file; don't revert to the real package.
- **No centralized API router.** No `services.ts` or `integrations.ts`. Domain-scoped ownership is the architecture.
- **No adapter/domain-model layer.** DTOs are consumed directly. No normalization layer.
- **No deep-link routing.** Navigation structure is a Stack containing a nested bottom-tab root (see Navigation section) — don't add further nesting (no stacks inside tabs, no additional tab navigators) without an explicit ask.
- **No broad TS migration of JS files.** `CartContext.js`, `AppNavigator.js` remain JS.
- **`src/stubs/`** — Metro resolver shims for `react-dom`, `react-transition-group`, `gluestack-overlay`. Keep. Removing causes build failures.

---

## API Architecture

### Domain ownership

Each feature owns `src/api/<domain>/`: `xxxApi.ts`, `index.ts` (domains: `address`, `auth`, `cart`, `order`, `product`, `wishlist`). `cart/` additionally has `guestCartApi.ts` for the unauthenticated cart flow. Screens import only from the domain barrel — never from implementation files.

```typescript
import { getProductsByCategory } from '../api/product'; // correct
import { getProductsByCategory } from '../api/product/productApi'; // never
```

There is currently no live mock/real switching — each domain's `index.ts` re-exports its real `xxxApi.ts` directly (e.g. `const product = real;`). No `xxxMockApi.ts` files exist. If you need a mock implementation, check the domain's `index.ts` first to see whether that domain has since added a switch — don't assume none exists just because it's true today.

### Adding a new API endpoint

1. Constant → `src/api/endpoints.ts`
2. Implementation → domain `xxxApi.ts`
3. Export → domain `index.ts`
4. Types → `src/api/interfaces.ts`

### Backend envelope

All responses: `{ statusCode: 1|0, result: {...}, userMessage: string }`. Unwrap at call site. Application-level auto-raise (`statusCode !== 1`) is commented out in `axiosInstance.ts` — do not uncomment.

### Enums

Server-side enums live in `src/config/enum_files/` — one file per enum, no barrel index. Used in `src/api/interfaces.ts` to type numeric API fields. Never use raw `number` for a field that has a corresponding enum — check `src/config/enum_files/` for the exact name before adding a new numeric field.

### Sorting

Server-side sort is the default where supported (`sortBy: SortBy | null` on product fetches). Check the relevant `xxxApi.ts` and calling screen before assuming a field sorts client-side vs. server-side.

---

## Component Architecture

```
src/components/
├── primitives/   RN core wrappers with className support (Box, VStack, HStack,
│                 Text, Pressable, Divider, ScrollView, Image). Zero logic.
├── ui/           Semantic reusable UI — visual identity, design tokens, local animation.
│                 Exported via ui/index.ts.
├── system/       App-state components — ErrorState (full-screen fetch error + retry),
│                 RetryButton. InlineError is deprecated; use ErrorBanner instead.
└── gluestack/    Infrastructure bridge — Actionsheet.tsx only.
```

**Semantic extraction rule:** Extract a component when it has a semantic responsibility ("product identity block", "order row", "variant picker"). Never extract purely to reduce JSX line count.

---

## Styling

- Default: `StyleSheet.create()` + tokens imported from `'../theme'` barrel.
- NativeWind `className` available on primitives for static layout.
- **`className` is for static values only.** Animated styles, conditional colors, calculated dimensions → `style={}` always.
- Match the existing approach in any file you modify.
- **Never hardcode** hex colors, raw spacing, font sizes, or animation durations. Always use tokens from `src/theme/`.

---

## Visual Standards (Non-Negotiable)

- **"Tira-lite" direction.** Editorial foundation (serif headlines, calm surfaces, restrained motion) stays. Cards/banners may carry more merchandising density than a typical marketplace, but the app should still read as curated, not dense.
- **Serif-led hierarchy.** Product names, prices, headlines, section titles always `FontFamily.serif`. Never bold sans for these roles — this is the app's primary differentiator from Amazon/Flipkart-style UIs.
- **Micro-labels via `Type.label`.** Brand names, category eyebrows, kickers, field labels, order numbers: `Type.label` only — uppercase + letter-spacing on the sans family, **not** mono. `FontFamily.mono`/`monoMedium` (JetBrains Mono) are deprecated: no `Type.*` preset references them anymore (see `src/theme/typography.ts` header comment). Don't reach for `FontFamily.mono` directly in new code.
- **Image-first.** Product images dominate, no text overlay on heroes. Identity (brand → name → price) below the image. 4:5 portrait ratio for product cards.
- **Calm surfaces.** Depth through tone (`Colors.surface`/`surfaceSoft`/`surfaceDeep`), not shadow. `Shadow.sm` only on sticky/overlapping elements.
- **CTA hierarchy.** Primary: full-width ink pill, `Type.bodyStrong` white, `useTactile`. Secondary: `Type.caption` underlined text link, `Colors.ink3`. Never two equal-weight buttons.
- **Product card density (relaxed).** Real, API-backed signals only (discount badge, MRP strikethrough, shipping line, warranty signal). Never fabricate data absent from the API response.
- **No startup aesthetics.** No purple/violet/blue, glassmorphism, gradient blobs, glow, or confetti.
- **Restrained motion.** Staggered, calm entrances; press feedback via scale (0.98) from `Motion.pressScale`, not opacity flash. All durations bind to `Motion.duration.*` (`src/theme/motion.ts`) — ad-hoc durations are a hard failure.

Token values (colors, type scale, exact motion durations) live in `src/theme/` — read those files directly rather than trusting hardcoded numbers in docs.

---

## Established Patterns

**Async data fetch:**

```typescript
const { data, loading, isError, error, run } = useAsyncState<T>(initialValue);

useFocusEffect(
  useCallback(() => {
    const cancelled = { current: false };
    run(async () => {
      /* fetch */
    }, cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [run]),
);
```

**Full-screen error:**

```tsx
if (isError)
  return (
    <ErrorState
      title="..."
      message={error ?? ''}
      onRetry={fetchFn}
      retryLoading={loading}
    />
  );
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

**User-scoped storage keys — use `scopedKey` for per-user data:**

```typescript
import { STORAGE_KEYS, scopedKey } from '../config/storageKeys';
// Keys for data that must not bleed between accounts on a shared device:
// recentlyViewed, recentSearches, wishlistSeen, selectedDeliveryAddress
const key = scopedKey('recentlyViewed', profileCode); // → 'recentlyViewed_100094'
const guestKey = scopedKey('recentlyViewed', null); // → 'recentlyViewed_guest'
AsyncStorage.getItem(key);
// Get profileCode the same way as the "Profile code" pattern below.
```

**Profile code:**

```typescript
// In screens that need it for API calls, read directly from AsyncStorage inside the fetch function
// to avoid race conditions and stale data after account switches:
const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
const code = raw ? JSON.parse(raw).CustomerProfileCode : null;
// useProfileCode() hook exists but returns null on first render — avoid for API calls.
```

**Toast:**

```typescript
import { toastEmitter } from '../utils/toastEmitter';
toastEmitter.emit('success', 'Added to cart'); // fire-and-forget, works outside React tree
```

**Auth guard (protect actions that require login):**

```typescript
const { guard, showLoginPrompt, dismissLoginPrompt } = useAuthGuard();
// Wrap any action that requires auth:
guard(() => navigation.navigate('Address', { cartItems }));
// Render the sheet conditionally:
{
  showLoginPrompt && (
    <LoginPromptSheet
      context="checkout" // 'orders' | 'wishlist' | 'profile' | 'checkout' | 'general'
      onClose={dismissLoginPrompt}
      onSignIn={() => {
        dismissLoginPrompt();
        navigation.navigate('Login');
      }}
      onRegister={() => {
        dismissLoginPrompt();
        navigation.navigate('Register');
      }}
    />
  );
}
```

**Press-scale CTA:**

```tsx
const { animatedStyle, handlers } = useTactile();
<Animated.View style={animatedStyle}>
  <TouchableOpacity activeOpacity={1} {...handlers} />
</Animated.View>;
// Or use PrimaryButton — useTactile is wired internally.
```

---

## Navigation

`src/navigation/AppNavigator.js` is a `createNativeStackNavigator` whose root route is `MainTabs` — a nested `createBottomTabNavigator` (`Home`, `Orders` → `OrderHistoryScreen`, `Wishlist`, `Profile`) rendered via a custom `TabBar` (`src/components/ui/BottomNavBar.tsx`). Auth screens (`Login`, `Register`, `OTPVerification`) and everything reachable by pushing forward (Product, Cart, Address, Search, Payment, etc.) are flat sibling routes on the outer stack, not nested further. `getInitialRoute()` (`src/utils/auth.ts`) always resolves to `'MainTabs'` regardless of login state — there is no separate logged-out landing route; guest vs. logged-in is handled inside screens, not by routing.

The `MainTabs` stack entry has `gestureEnabled: false` and no swipe-back; the three non-Home tab roots (`OrderHistoryScreen`, `WishlistScreen`, `ProfileScreen`) use `useTabRootBackHandler` (`src/hooks/useTabRootBackHandler.ts`) so hardware back routes to the `Home` tab instead of popping the outer stack. Don't add a plain `BackHandler` listener to a tab-root screen — use this hook instead. Home has its own separate back-handler for exit/logout-confirm.

Don't add further nesting (a stack inside a tab, another tab navigator) without an explicit ask — see Architecture Constraints.

---

## Screens

All screens are open for redesign when explicitly requested.

Never introduce new header styles. Reuse the existing light surface header (`ScreenHeader`) or `DarkHeader` according to existing navigation patterns — never use the dark header on screens reachable from the bottom tab bar or checkout flow. `DarkHeader` usage is rare in the current codebase (e.g. `OrderDetailScreen`) — check how a similar screen already does it before adding a new header.

---

## State Rules

**Cart:** `useCart()` → `{ cartCount, setCartCount }`. Integer only — server-authoritative. Do not add item arrays to CartContext. `resetCartCount()` (module-level, non-hook) lets `clearSession()` zero the count on logout without importing React.

**Wishlist:** `WishlistContext` (`src/context/WishlistContext.tsx`) holds a `Map<inventoryId, wishlistCode>` — `{ wishlistMap, getWishlistCode, setWishlistCode, refresh }`. Same non-hook reset pattern as cart (`resetWishlistMap()`), used by `clearSession()`.

**Session generation:** `src/utils/sessionGeneration.ts` exposes a monotonic counter (`getSessionGeneration` / `bumpSessionGeneration`) bumped once at the start of `clearSession()`. Any async write into a module-level cache (product/category caches, wishlist cache) should capture the generation before starting and compare before writing, to discard stale writes that resolve after a logout. Follow this pattern for new module-level caches that outlive a single component.

**Auth:** JWT in Keychain (`STORAGE_KEYS.authToken`). Refresh token in Keychain (`STORAGE_KEYS.refreshToken`). User data in AsyncStorage (`STORAGE_KEYS.userData`). App always starts on `MainTabs` (see Navigation) — no session check at startup. `isLoggedIn()` in `src/utils/auth.ts` checks Keychain presence only — no clock-based expiry check. Token expiry is detected reactively via 401.

**401 handling:** `axiosInstance.ts` response interceptor catches 401 → refreshes via refresh token → retries original request. Concurrent 401s share one `_refreshPromise`. If refresh also fails → `clearSession()` + `resetToLogin()`. Auth endpoints (`token/postLoginCustomer`, `token/getEcommAccessToken`, `postCreateCustomer`, `postConfirmCustomer`) are excluded from Bearer token injection.

**Guest browsing:** Unauthenticated users land on `MainTabs` (same route as logged-in users) and can browse Home freely. Wishlist/Orders/Profile tabs are directly reachable from the tab bar for guests too — each screen shows its own inline "sign in" prompt for guest state rather than being blocked at the navigator level. Actions like checkout use the `useAuthGuard` hook (shows `LoginPromptSheet`) instead of navigating straight through. Guest cart stored in AsyncStorage under `STORAGE_KEYS.guestCart` as `GuestCartItem[]`, merged to server cart on login.

**Screen-local:** `useState` + `useAsyncState`. Re-run on focus via `useFocusEffect`.

---

## Conventions

- Components: functional + hooks. `FC<Props>` in `.tsx`.
- Formatting: single quotes, trailing commas, no arrow-function parens (`.prettierrc.js`).
- Comments: only when the WHY is non-obvious. Never describe what the code does.
- Screen styles: co-locate in `ScreenName.styles.ts` if the StyleSheet is large.
- New UI components: `src/components/ui/ComponentName.tsx` + export via `ui/index.ts`.
- New hooks: `src/hooks/useHookName.ts`.

---

## Side Effects

Do not fix unrelated technical debt unless explicitly requested. If you suspect a known issue, verify the current implementation before acting.

---

## Reference

- `docs/premium-ux-refinement-spec.md` (2026-05-19) — design rationale behind the serif/tokens/motion system in `src/theme/`. Background context, not an active blueprint.
- `docs/audits/26-6-26/` (dated 2026-06-26, `master-audit.md` + 9 topic files — architecture, security, performance, UX, etc.) — a point-in-time P0/P1/P2 findings snapshot. **Historical, not a live checklist:** at least one commit ("completed priority 0,1, and 2 from master audit") already actioned some of these findings without the docs being updated to match, so individual items may be stale/already fixed. Don't treat any P0/P1/P2 item as still open without checking the current code first.
