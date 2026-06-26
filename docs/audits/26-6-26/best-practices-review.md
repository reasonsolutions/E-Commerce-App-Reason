# React Native Best Practices Review (2026)

Scope: every screen in `src/screens/`, the API layer, Context/hooks, navigation, theme, and the component layer (`primitives/`, `ui/`, `system/`, `gluestack/`). All findings reference actual file:line locations. Findings are graded **Critical / High / Medium / Low**.

---

## 0. Critical — fix first

### 0.1 Hardcoded payment gateway credentials shipped in client bundle
**File:** `src/screens/PaymentScreen.tsx:90-91, 172-173, 274-275`

**Current approach:**
```ts
Login:    'mu@postglobal',
Password: '#mu@76*3',
...
user:     'mplpgPay',
password: '#mpl&2384kewrf',
```
MIPS payment gateway credentials are literal strings inside the screen component, shipped in every build (APK/IPA), extractable by anyone with `apktool`/`strings`.

**Why it's a problem:** These are production secrets in a public artifact. Anyone can extract them and impersonate the merchant against the payment gateway. This is a direct security incident, not a style nit.

**Recommended approach:** Move all gateway authentication server-side. The app should call a backend endpoint (`POST /payment/initiate`) that holds the MIPS credentials and returns only a session/request token to the client. Never embed merchant credentials in client code.

### 0.2 No error boundaries anywhere in the app
**Verified:** `grep -rn "ErrorBoundary|componentDidCatch" src/ App.tsx` → zero matches.

**Current approach:** Nothing catches render-time exceptions. A throw anywhere in the component tree (bad data shape, null deref in JSX, third-party component crash) takes down the entire app to a red screen / crash, in production with no recovery path.

**Why it's a problem:** `useAsyncState` + `ErrorState` only handles *fetch* errors. A genuine render exception (e.g., `product.variants.map(...)` when `variants` is unexpectedly undefined) is unguarded. For an e-commerce checkout flow, an uncaught render crash mid-payment is the worst possible failure mode.

**Recommended approach:**
1. Add `src/components/system/ErrorBoundary.tsx` (class component, `componentDidCatch`/`getDerivedStateFromError`), rendering a fallback screen with "Try again" (reset) and "Go home" actions.
2. Wrap the root navigator in `App.tsx` with one boundary (catch-all).
3. Optionally wrap `CartScreen`, `PaymentScreen`, and `ProductScreen` individually so a crash in one tab doesn't blank the whole app.

---

## 1. API Layer

### 1.1 No request cancellation (AbortController/CancelToken)
**File:** `src/api/axiosInstance.ts` (entire file — verified no `CancelToken`/`AbortController` usage anywhere in `src/api/`)

**Current approach:** Every domain `xxxApi.ts` fires a bare `axiosInstance.get/post(...)` with no cancellation token. Screens compensate with a local `cancelled.current` flag (the documented `useAsyncState` pattern) that only suppresses the *state update*, not the in-flight network request itself.

**Why it's a problem:** The request still completes on the wire and consumes bandwidth/battery after the screen unmounts; under poor network conditions, stale slow requests pile up. The `cancelled` flag is a workaround for a missing primitive, not a fix.

**Recommended approach:** Thread an `AbortController` through `useAsyncState`'s `run()`, pass `{ signal }` into axios calls, and call `controller.abort()` in the `useFocusEffect`/`useEffect` cleanup — replacing the manual `cancelled.current` boilerplate with the same cleanup shape already in place today.

### 1.2 Commented-out centralized error raising creates 20+ duplicated manual status checks
**File:** `src/api/axiosInstance.ts:92-101` (TODO block, currently disabled per CLAUDE.md instruction)

**Current approach:** Every call site re-implements `if (response.statusCode !== 1) { ... }` independently:
- `src/screens/Login.tsx:184`
- `src/screens/AddressScreen.tsx:177, 238, 358`
- `src/screens/WishlistScreen.tsx:199` (`response.statusCode === 1 ? response.result : []`)
- `src/screens/CartScreen.tsx:307` (`response.result || []`, no statusCode check at all)
- `src/screens/SearchScreen.tsx:77` (`response.data?.result?.Products`, different envelope shape)

**Why it's a problem:** Five different unwrapping idioms for the same envelope shape across the codebase. A future backend contract change (e.g., renaming `result` → `data`) requires hunting through every screen rather than one interceptor. Note: CLAUDE.md explicitly says *do not uncomment* this block — so the correct fix is **not** to flip that switch, but to introduce a single shared unwrap helper that all `xxxApi.ts` files call, leaving the interceptor untouched.

**Recommended approach:** Add one helper, e.g. `src/api/unwrapResult.ts`:
```ts
export function unwrapResult<T>(response: ApiEnvelope<T>, fallback: T): T {
  return response?.statusCode === 1 ? (response.result ?? fallback) : fallback;
}
```
Call it from each domain's `xxxApi.ts` (not from screens) so screens receive already-unwrapped, already-validated data. This respects the "don't uncomment the interceptor" constraint while still removing the duplication.

### 1.3 `any` escapes typing at API boundaries
**Files:**
- `src/api/apiError.ts:91-92, 126` — `(data as any)?.userMessage`
- `src/api/apiLogger.ts:126` — `const err = error as any;`
- `src/api/interfaces.ts:647, 668-669` — `Taxes: any[]`, `PhysicalAttributes: any`
- `src/api/order/index.ts:24` — `PaymentInfo?: any; Events?: any[]`

**Why it's a problem:** `interfaces.ts` is the contract screens rely on for compile-time safety; `any` fields silently disable that safety exactly where order/tax/payment data — the most failure-sensitive part of an e-commerce app — flows through.

**Recommended approach:** Define real interfaces (`TaxDetail[]`, `PhysicalAttributesInterface`, `OrderPaymentInfoInterface`, `OrderEventInterface[]`) using `src/config/enum_files/` for any enum-backed fields, per the existing CLAUDE.md enum convention. For the error-handling casts, replace `as any` with a narrow `type ServerErrorShape = { userMessage?: string; message?: string }`.

### 1.4 Debug `console.log` left in the auth-refresh failure path
**File:** `src/api/axiosInstance.ts:42`

**Current approach:** `console.log('[refresh] error:', e);` runs unconditionally — including in release builds — and can log sensitive error payloads.

**Recommended approach:** Guard with `if (__DEV__) console.log(...)`, or route through a dev-only logger.

### 1.5 Auth-endpoint detection by fragile substring match
**File:** `src/api/axiosInstance.ts:61-63`

**Current approach:**
```ts
const isAuthEndpoint = config.url?.startsWith('token/') ||
  config.url?.includes('postCreateCustomer') ||
  config.url?.includes('postConfirmCustomer');
```

**Why it's a problem:** Silent breakage if an endpoint is renamed — the Bearer token would either leak onto an auth call or get wrongly omitted from a protected one, with no compiler signal.

**Recommended approach:** Build a `Set` from the same constants already defined in `src/api/endpoints.ts` and check membership, so renaming an endpoint constant automatically keeps this list correct.

### 1.6 Mock API implementations exist but are unreachable dead code
**File:** `src/api/cart/index.ts` (and the equivalent pattern in every domain's `index.ts`)

**Current approach:** `mockCartApi.ts`, `mockAuthApi.ts`, etc. exist per CLAUDE.md's domain-ownership convention, but `index.ts` imports only the real implementation — there is no env-driven switch wiring mocks in.

**Why it's a problem:** Per CLAUDE.md: "Check each domain's `index.ts` before assuming mock or real — don't rely on this doc." Confirmed: mocks are currently 100% inert. They will silently drift from the real API contract since nothing exercises them, undermining their value for local dev/demoing without a backend.

**Recommended approach:** Either wire `MOCK_MODE` from `src/config/env.ts` into each domain barrel, or — if mocks are intentionally retired — delete them to stop the drift risk. This is a decision for the team, not a unilateral deletion, since CLAUDE.md says not to assume rollout status.

---

## 2. Context & Hooks

### 2.1 `CartContext.js` has no safe default, throws outside provider
**File:** `src/context/CartContext.js`

**Current approach:** `useCart()` throws `Error('useCart must be used within a CartProvider')` if context is `null`, and (per §0.2) nothing catches that throw.

**Why it's a problem:** Combined with the missing error boundary, any component accidentally rendered outside the provider tree (easy to do during a future refactor of `App.tsx`) crashes the whole app instead of failing predictably.

**Recommended approach:** Keep the throw (it's a legitimate programmer-error guard) but pair it with the App-root `ErrorBoundary` from §0.2 so the failure mode is a recoverable fallback screen, not a hard crash.

### 2.2 Derived state stored via `useState` + sync `useEffect` instead of computed value
**File:** `src/screens/WishlistScreen.tsx:185-227`

**Current approach:**
```ts
const { data: fetched } = useAsyncState<WishlistItemInterface[]>([]);
const [items, setItems] = useState<WishlistItemInterface[]>([]);
useEffect(() => {
  if (fetched && fetched.length > 0) setItems(fetched);
}, [fetched]);
```

**Why it's a problem:** This is the classic "derived state in `useState`" anti-pattern — `items` is fully computable from `fetched` and should never be its own state. It also has a latent bug: `fetched.length > 0` means a successful fetch that legitimately returns an empty wishlist (user removed all items) never updates `items`, leaving stale data on screen.

**Recommended approach:**
```ts
const items = fetched ?? [];
```
No effect, no second state variable, and the empty-list case is handled correctly for free.

### 2.3 Module-level mutable caches bypass React entirely
**Files:** `src/screens/HomeScreen.tsx:230-232`, `src/screens/ResultScreen.tsx:385-386, 489-493`

**Current approach:**
```ts
let _cachedProducts = null;
let _cachedCategories = null;
let _cachedBrands = null;
```
Module-scope `let` bindings mutated from inside component effects.

**Why it's a problem:** This state lives outside React's render cycle and outside any component instance lifetime — it persists across logout/login (no clearing in `clearSession()`), is shared across every mounted instance of the screen, and races if two instances mount/unmount concurrently (e.g., fast back-and-forth navigation). It's a hand-rolled, unscoped cache replacing what `useRef` (instance-scoped) or a proper cache module with explicit invalidation should do.

**Recommended approach:** If the goal is cross-mount caching (survive unmount/remount within a session), use the already-present `src/utils/homeCache.ts` pattern consistently and **add an explicit `clearHomeCache()` call to the logout path** in `src/utils/auth.ts`'s `clearSession()`. If the goal is just avoiding redundant fetches within one mounted instance, a `useRef` is sufficient and correctly scoped.

### 2.4 `useState` for component-controlling values that don't trigger renders
**File:** `src/screens/PaymentScreen.tsx:80-82`

**Current approach:** `successRef`, `innerApiInitiated` are `useRef`, but they gate conditional logic that affects what's rendered (payment success state).

**Why it's a problem:** Refs don't trigger re-renders. If `successRef.current` flips true outside of a state-setting event, the UI doesn't update until something else happens to re-render the component — leading to a payment success state that's "true" internally but not reflected on screen until incidental re-render.

**Recommended approach:** Use `useState` for anything that should be reflected in JSX; reserve `useRef` strictly for values read in callbacks/timers that must not trigger re-renders (e.g., the actual interval handle, which is correctly a ref).

### 2.5 `Promise.all` fired without `await`, function returns before it resolves
**File:** `src/screens/CategoriesScreen.tsx:97-107`

**Current approach:**
```ts
run(async () => {
  const res = await getCategories();
  Promise.all(list.map(c => getCategoryProductCount(c.CategoryId).then(...))); // not awaited
  return list;
}, cancelled);
```

**Why it's a problem:** The category list resolves and renders before per-category counts arrive; if the component unmounts in that window, the cancellation guard inside each `.then()` is the only thing preventing a setState-after-unmount, and the `run()`/`useAsyncState` loading state has already flipped to "done" even though count data is still in flight — `loading` no longer reflects what's actually pending.

**Recommended approach:** `await Promise.all(...)` before returning, or fire the count fetch as a separate, second effect explicitly decoupled from the loading state of the main list.

### 2.6 Repeated auth-form boilerplate not extracted to a hook
**Files:** `src/screens/Login.tsx`, `src/screens/RegisterScreen.tsx`, `src/screens/OTPVerificationScreen.tsx`

**Current approach:** Each screen independently implements field state, inline validation, shake-on-error animation, and `catch (error: any)` handling.

**Why it's a problem:** Three near-identical implementations of "form field + validation + error-shake + submit" make it easy for one screen to drift from the others' validation rules or error UX, and any common fix (e.g., better network-error messaging) must be applied three times.

**Recommended approach:** Extract `src/hooks/useAuthForm.ts` encapsulating field state, validation, shake-trigger, and submit-error handling; each screen supplies its own field schema and submit function.

### 2.7 `catch (error: any)` swallows error type information
**Files:** `src/screens/Login.tsx:252`, multiple other screens

**Current approach:** `catch (error: any) { setFieldError(error?.message ?? 'Something went wrong...') }` — network failures, validation failures, and unexpected exceptions all collapse to the same generic message.

**Recommended approach:** `catch (error: unknown)`, narrow via the existing `src/api/apiError.ts` helper (which already presumably classifies API errors) before deciding the user-facing message — `unknown` forces an explicit type check instead of silently allowing any shape through.

---

## 3. Navigation

### 3.1 Untyped navigation surface end-to-end
**Files:** `src/navigation/AppNavigator.js` (whole file, plain JS), `src/utils/navigationService.ts:3`, `src/screens/CartScreen.tsx:37-38`

**Current approach:**
```ts
// navigationService.ts
export const navigationRef = createNavigationContainerRef<any>();

// CartScreen.tsx
type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};
```

**Why it's a problem:** Per CLAUDE.md, "No navigation architecture changes" is the rule (correctly respected — the flat Stack stays flat), but that's orthogonal to **type safety on top of the existing flat Stack**, which is currently absent. `screen: string` and `params?: any` mean a typo'd route name or a missing required param is invisible until runtime, including in the 401-handler's `resetToLogin()` path which runs outside the component tree.

**Recommended approach:** Without touching the navigator structure, define `RootStackParamList` (one type, one place — `src/navigation/types.ts`) mapping each existing route name to its param shape, then:
```ts
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
```
and use `StackNavigationProp<RootStackParamList, 'Cart'>` in place of the ad-hoc `NavigationProp` type in each screen. This is additive typing, not an architecture change, and directly prevents the `MobileNumber` string/number mismatch found in §4.

### 3.2 Route param type mismatch between screens
**Files:** `src/screens/RegisterScreen.tsx:109` → `src/screens/OTPVerificationScreen.tsx:76, 106`

**Current approach:** `RegisterScreen` navigates with `MobileNumber: mobile.trim()` (a `string`), while `OTPVerificationScreen` later does `MobileNumber: Number(MobileNumber)` when calling the API — implying the type was expected to be numeric at the route boundary but isn't.

**Why it's a problem:** This exact class of bug is what typed navigation params (§3.1) catches at compile time instead of relying on a runtime `Number()` coercion to paper over it.

**Recommended approach:** Decide one canonical type for `MobileNumber` across the flow (string is safer for leading zeros/formatting) and convert to number only at the final API call site, matching the existing `interfaces.ts` field type — fix this once `RootStackParamList` exists so the mismatch is caught by `tsc`, not discovered by reading code.

---

## 4. Component Architecture (`primitives/`, `ui/`, `system/`)

### 4.1 `FilterSheet.tsx` is a 716-line monolith with 16-prop "state dump" interface
**File:** `src/components/ui/FilterSheet.tsx:206-231` (props), `242-452` (component body)

**Current approach:** The component receives individually-destructured draft state and 8 setter functions (`draftSortKey, setDraftSortKey, draftCategories, toggleDraftCategory, draftBrands, toggleDraftBrand, draftPriceMin, setDraftPriceMin, ...`).

**Why it's a problem:** This is the "boolean/setter soup" anti-pattern at component-prop scale — `FilterSheet` is structurally bound to its single caller's exact state shape, so it cannot be reused for, say, an admin-side product filter without copying the whole prop list. It's also why the file is 716 lines: state plumbing, not UI, is most of the prop surface.

**Recommended approach:** Collapse the draft fields into one `FilterState` object plus a `dispatch`/`onChange(partial: Partial<FilterState>)` callback, and split the render into `FilterNavigation` (left column) and `FilterPanel` (right column) as separate components within the same file or a small local folder.

### 4.2 Sheet header markup duplicated across four components
**Files:** `FilterSheet.tsx:383-398`, `EditProfileSheet.tsx:264-274`, `ForgotPasswordSheet.tsx:131-141`, `ChangePasswordSheet.tsx:185-195`

**Current approach:** Each sheet hand-rolls the same back-icon + title + optional right-action header.

**Why it's a problem:** Four independent copies of the same 15-line block mean a single design tweak (spacing, icon, hit target) requires four edits, and they have already begun to drift (some have a right action, some don't, inconsistently).

**Recommended approach:** Extract `src/components/ui/SheetHeader.tsx` with `{ title, onClose, rightAction? }` props; all four sheets adopt it. This is a pure extraction — no behavior change — and directly serves the "duplicated UI" and "missing reusable component" review categories.

### 4.3 Business logic (API calls, AsyncStorage, token handling) embedded directly in sheet components
**Files:** `EditProfileSheet.tsx:211-249`, `ForgotPasswordSheet.tsx:57-108`, `ChangePasswordSheet.tsx:135-173`

**Current approach:** `handleSave` in `EditProfileSheet` calls `postUpdateCustomer`, writes `AsyncStorage.setItem(STORAGE_KEYS.userData, ...)`, and handles haptics/error display all inline.

**Why it's a problem:** This violates separation of concerns — the same logic can't be reused by a future "edit profile" entry point without copy-pasting the whole handler, and the component can't be unit-tested without mocking AsyncStorage + the API module.

**Recommended approach:** Extract `useUpdateProfile()`, `useForgotPassword()`, `useChangePassword()` hooks (matching the existing `src/hooks/` convention) that own the API call + storage side effects and return `{ submit, submitting, error }`. The sheet component becomes purely presentational.

### 4.4 `CartItem.js` is the lone untyped file in `components/`, with a dead prop
**File:** `src/components/CartItem.js:7` (entire file)

**Current approach:** Plain JS component; accepts `onEdit` prop that is never invoked anywhere in the render body.

**Why it's a problem:** CLAUDE.md's exemption for staying JS is explicitly scoped to `CartContext.js` and `AppNavigator.js` ("remain JS") — `CartItem.js` is not on that list and is a simple presentational component, so there's no architectural reason for it to be untyped. The dead `onEdit` prop is exactly the kind of bug type-checking would have caught: either it's unused dead code, or a wiring bug where some caller forgot to pass it.

**Recommended approach:** Migrate to `CartItem.tsx` with a typed prop interface (small, low-risk migration), and either wire up `onEdit` or delete it — confirm which with the screen that renders it (`CartScreen.tsx`) before deciding.

### 4.5 `InlineError` is dead code, marked deprecated, still exported
**Files:** `src/components/system/InlineError.tsx` (deprecated, per CLAUDE.md: *"InlineError is deprecated; use ErrorBanner instead"*), `src/components/system/index.ts`

**Verified via grep:** `InlineError` has zero usages anywhere outside its own definition and barrel export.

**Why it's a problem:** A deprecated component that's still exported from the barrel invites new code to import it — the deprecation notice is invisible unless someone opens the file directly. CLAUDE.md already documents the intended replacement (`ErrorBanner`), so this is pure cleanup with zero decision risk.

**Recommended approach:** Delete `InlineError.tsx`, remove its barrel export.

### 4.6 Inline style objects instead of `StyleSheet.create()` in `VariantSheet.tsx`
**File:** `src/components/ui/VariantSheet.tsx:30-73`

**Current approach:** `VariantChip` builds a ~12-property style object inline on every render, while its sibling `VariantChipGrid.tsx` (same feature, different component) correctly uses `StyleSheet.create()`.

**Why it's a problem:** Inline style objects are recreated every render (new object identity each time, defeating shallow-compare optimizations), and it's an inconsistency within the same feature pair — one sibling does it right, the other doesn't, which reads as an oversight rather than a deliberate choice. CLAUDE.md's stated styling default is `StyleSheet.create()`.

**Recommended approach:** Move the static parts of the chip style to `StyleSheet.create()`, and use array composition for the conditional parts: `style={[styles.chip, isSelected && styles.chipSelected, option.outOfStock && styles.chipOOS]}`.

### 4.7 Two near-identical "variant option" types and inconsistent `title`/`label` prop naming
**Files:** `src/components/ui/VariantChipGrid.tsx:20-27` (`VariantChipOption`, prop `label`) vs `src/components/ui/VariantSheet.tsx:19-25` (`VariantOption`, prop `title`)

**Why it's a problem:** Both components render the same domain concept (a selectable variant option with an out-of-stock flag) but with separately-declared types and different prop names for the same role (sheet title vs. section label) — a developer reaching for one component's API can't transfer that knowledge to the other.

**Recommended approach:** Declare a single `VariantOption` type once and import it in both files; standardize on `title` for the sheet-level heading prop in both, since that's the more specific/correct term for a heading (vs. `label`, which usually denotes a smaller annotation).

### 4.8 `ui/index.ts` barrel exports 50+ components with no grouping or public/internal distinction
**File:** `src/components/ui/index.ts` (54 lines, all flat exports)

**Why it's a problem:** Nothing distinguishes genuinely reusable primitives (`Price`, `Button`, `ErrorBanner`) from screen-specific one-offs (`EditProfileSheet`, `OrderFilterSheet`) that happen to live in `ui/` for organizational reasons. A new contributor browsing the barrel has no signal about what's safe to reuse elsewhere versus what's tightly coupled to one screen's data shape.

**Recommended approach:** Group the barrel with comment headers (`// Forms`, `// Overlays/Sheets`, `// Layout`, `// Feedback`) — a documentation-only change, no API change — so intent is visible without opening every file.

---

## 5. Theme System

### 5.1 Hardcoded hex colors bypass design tokens in multiple screens
**Files (sample, not exhaustive):**
- `src/screens/Login.tsx:263` — `backgroundColor="#F8F5F2"` (StatusBar)
- `src/screens/Login.tsx:445` — `backgroundColor: '#111111'`
- `src/screens/OrderSuccessScreen.tsx:381` — `color: '#226B3C'`
- `src/screens/CartScreen.tsx:958, 989, 993` — `color: '#226B3C'` repeated 3×
- `src/screens/ProfileScreen.tsx:67, 122, 312` — `backgroundColor: '#EDE9E4'`

**Why it's a problem:** CLAUDE.md states explicitly: *"Never hardcode hex colors, raw spacing, font sizes, or animation durations. Always use tokens from `src/theme/`."* The repeated `#226B3C` across three files in `CartScreen.tsx` alone, with no corresponding token, means there's a real color in active use that simply isn't in `tokens.ts` yet — a token gap, not just a discipline lapse.

**Recommended approach:** Add the missing semantic tokens to `src/theme/tokens.ts` (e.g., `Colors.success` for the `#226B3C` green that's already in repeated use), then replace each hardcoded hex with the token reference. Audit with `grep -rn "'#\|\"#" src/screens` to find the rest before considering this done.

---

## 6. Cross-Screen Duplication

### 6.1 Empty-state layout duplicated across at least three screens
**Files:** `src/screens/CartScreen.tsx:474-502`, `src/screens/OrderHistoryScreen.tsx:505-587`, `src/screens/ProfileScreen.tsx:231-262`

**Current approach:** Each screen independently builds an icon + title + body + CTA button (+ optional secondary action) empty state, with screen-specific copy but identical structure.

**Recommended approach:** Extract `src/components/ui/EmptyStateLayout.tsx` with `{ icon, title, body, action, secondaryAction? }` props (the existing `src/components/ui/EmptyState.tsx` may already cover part of this — check it first; if it exists but isn't used by these three screens, that's the actual fix: migrate them onto it rather than building a new component).

### 6.2 Skeleton loading rows re-implemented per screen instead of reusing `Skeleton`/`SkeletonGrid`
**Files:** `src/screens/CartScreen.tsx:436-451`, `src/screens/OrderHistoryScreen.tsx:590-620`, `src/screens/AddressScreen.tsx:494-506`

**Why it's a problem:** `src/components/ui/Skeleton.tsx` and `SkeletonGrid.tsx` already exist as the intended shared abstraction; these three screens build their own row-skeleton markup instead of composing the existing primitives, which is duplication of something that's already been solved once.

**Recommended approach:** Replace each screen's inline skeleton block with the existing `Skeleton`/`SkeletonGrid` components, adding new size/shape variants to those shared components if the current API doesn't yet cover a needed shape, rather than hand-rolling a new one per screen.

### 6.3 Radio-row and password-field UI re-implemented three times
**Files:** `FilterSheet.tsx:191-202`, `OrderFilterSheet.tsx:74-96`, `ChangePasswordSheet.tsx:30-67` (password show/hide field)

**Recommended approach:** Extract `RadioRow.tsx` and `PasswordInput.tsx` to `src/components/ui/`, export via the barrel, and migrate all call sites — consistent with the extraction pattern recommended in §4.2.

---

## Priority Summary

| Priority | Issue | Effort |
|---|---|---|
| **Critical** | Hardcoded MIPS payment credentials in client code (§0.1) | Backend work required |
| **Critical** | No error boundaries anywhere (§0.2) | ~1-2 hrs |
| **High** | API `any` types on order/tax/payment fields (§1.3) | ~2-3 hrs |
| **High** | Module-level caches never cleared on logout (§2.3) | ~1 hr |
| **High** | Untyped navigation params (`RootStackParamList` missing) (§3.1) | ~3-4 hrs, additive only |
| **Medium** | `FilterSheet` prop-explosion + monolith (§4.1) | ~3 hrs |
| **Medium** | Business logic embedded in sheet components (§4.3) | ~3-4 hrs |
| **Medium** | Sheet header duplication (§4.2) | ~1-2 hrs |
| **Medium** | Hardcoded colors missing from tokens (§5.1) | ~1 hr + audit |
| **Low** | Dead `InlineError` component (§4.5) | ~10 min |
| **Low** | `CartItem.js` → `.tsx` migration + dead prop (§4.4) | ~30 min |
| **Low** | Empty-state / skeleton duplication (§6.1, §6.2) | ~2 hrs |

None of these require the architectural changes CLAUDE.md prohibits (no Redux/Zustand, no centralized API router, no navigation restructuring) — every recommendation above works within the existing Context API + domain-API + flat-Stack architecture.
