# React Native Performance Audit

Scope: all 21 screens (`src/screens/`), all `src/components/ui|system|primitives|gluestack`, `src/context`, `src/hooks`, navigation, app entry, bundle config. Read-only audit, no code changed.

Ranked by **(blast radius × frequency)**. "Estimated gain" is a directional FPS/time estimate based on typical RN behavior for that fix, not a benchmark from this device.

---

## P0 — Fix First (app-wide blast radius)

### 1. `CartContext.js:10-13` — provider value not memoized
```js
const value = { cartCount, setCartCount };   // new object every render
<CartContext.Provider value={value}>
```
Every component calling `useCart()` re-renders on **any** `CartProvider` re-render, not just when `cartCount` changes. Since cart count is read app-wide (header badges, product cards, cart screen), this is the single highest-leverage fix in the codebase.

**Fix:**
```js
const value = useMemo(() => ({ cartCount, setCartCount }), [cartCount]);
```
**Estimated gain:** Eliminates a class of unnecessary re-renders across every screen that reads `useCart()`. Low effort, app-wide effect — do this regardless of measured impact.

---

### 2. `ProductGrid.tsx:95,104,116,125` — inline `onPress` defeats `ProductCard` memo
```tsx
<ProductCard product={row.large} ... onPress={() => handlePress(row.large.ItemID)} />
```
`ProductCard` is `React.memo`'d but receives a brand-new closure every render, so the memo never hits. `ProductGrid` backs the Home feed grid — the single most-rendered surface in the app.

**Fix:** pass the id and a stable callback instead of wrapping in an inline arrow:
```tsx
<ProductCard product={row.large} ... itemId={row.large.ItemID} onPress={handlePress} />
// ProductCard internally: onPress={() => onPress(itemId)} is now the only inline closure,
// scoped to inside the memoized component, not recreated by the parent.
```
**Estimated gain:** ~10-20% fewer wasted re-renders on Home scroll/interaction; noticeable on mid/low-end Android during fast scroll.

---

### 3. `ProductRail.tsx:32-41` — same inline-closure pattern inside `renderItem`
```tsx
const renderItem = useCallback(({ item }) => (
  <ProductCard product={item} cardWidth={cardWidth} onPress={() => onPress(item.ItemID)} />
), [cardWidth, onPress]);
```
`renderItem` is itself memoized, but each `ProductCard` instance still gets a fresh `onPress` closure on every list re-render (e.g. parent state changes, scroll-driven re-render).

**Fix:** same pattern as #2 — pass `itemId` + stable `onPress`.
**Estimated gain:** 5-10% fewer ProductCard re-renders in every horizontal rail (used on Home, Result, Product-detail "related products").

---

## P1 — High severity, list/screen-scoped

### 4. `BrandsScreen.tsx` `BrandCard` not wrapped in `React.memo` + inline `onPress`
List of 30+ brand tiles re-renders entirely on any `BrandsScreen` state change (e.g. search filter, scroll position state if any).
**Fix:** wrap `BrandCard` in `React.memo`; lift `onPress={() => navigate(...)}` to a stable callback that takes the item as an argument.
**Estimated gain:** 10-15% smoother scroll on the brands grid.

### 5. Inline `onPress`/`onEdit`/`onDelete` in `renderItem` across multiple screens
Confirmed in: `HomeScreen.tsx:641,705` (category/brand tiles), `SearchScreen.tsx:165-171,208-213,288-298`, `AddressScreen.tsx:396-397`, `AddressManagementScreen.tsx:396`, `BrandsScreen.tsx:190`, `CategoriesScreen.tsx:245`, `CartScreen.tsx:214-223,641-649`.
Pattern: `onPress={() => doThing(item.id)}` written directly in JSX inside a list/map.
**Fix:** wrap handlers in `useCallback` at the screen level, pass the item id down, let the (memoized) child component build its own internal closure — or accept the id as a second argument so the parent's reference is stable.
**Estimated gain:** 5-10% fewer child re-renders per affected list; cumulative win once applied everywhere since it removes a recurring papercut across the whole app.

### 6. `ProductScreen.tsx:500-502` — inline `onScroll` handler recalculates active image index every scroll frame
```tsx
onScroll={(e) => { const idx = Math.round(...); setActiveImageIndex(idx); }}
```
No throttling (`scrollEventThrottle` not set alongside it per the agent's read), triggers a state update — and therefore a re-render of the whole hero gallery — on every scroll event.
**Fix:** add `scrollEventThrottle={16}`, and guard the `setActiveImageIndex` call so it only fires when the computed index actually changes (`if (idx !== activeImageIndex) setActiveImageIndex(idx)`).
**Estimated gain:** Directly reduces re-render count during image-gallery swipes — most noticeable category of jank on the product detail screen.

### 7. `CartScreen.tsx:349-361` — subtotal/itemCount/originalTotal recomputed via `.reduce()` every render, not memoized
```js
const subtotal = cartItems.reduce((sum, item) => sum + item.Price * item.Quantity, 0);
```
Cart re-renders on every quantity tap, animation tick, etc. — each one re-walks the full cart array three times.
**Fix:** wrap in `useMemo(() => ..., [cartItems])` (or `[guestItems, isGuest]` for the guest branch).
**Estimated gain:** Negligible for small carts (<10 items), but removes O(n) work from the hot render path — matters as cart size grows; free to fix.

### 8. `CartScreen.tsx` — per-row mount animation fan-out
Each `CartRow`/`GuestCartRow` runs its own `Animated.parallel` entrance animation keyed by `delay`. For large carts (20+ items) this means 40+ concurrent `Animated.timing` calls firing near-simultaneously.
**Fix:** This is the existing staggered-entrance pattern used elsewhere (`useEntrance`) — acceptable for cart sizes typical of this app (<15 items). Only worth revisiting if carts regularly exceed ~20 items; if so, cap the stagger or skip entrance animation past the first screenful.
**Estimated gain:** N/A unless cart sizes grow — flagged for awareness, not an active fix.

---

## P2 — Medium severity, real but narrower scope

### 9. No `react-native-fast-image` — all remote images use core `Image` + OS disk cache only
Confirmed: not in `package.json`. Every product/banner image (`ProductCard`, hero gallery, banners) hits network fresh unless the OS HTTP cache happens to serve it; no priority hints, no prefetch, no guaranteed disk persistence across cache eviction.
**Fix:** introduce `react-native-fast-image` for product/listing images at minimum (highest-frequency image surface). This does touch many files — confirm scope with the user before a sweeping swap, since CLAUDE.md restricts unrequested multi-file refactors.
**Estimated gain:** Faster repeat-navigation image loads (near-instant from disk cache vs. network round-trip), smoother scroll on image-heavy grids (Home, Result, Wishlist) since FastImage decodes off the JS thread.

### 10. `OTPVerificationScreen.tsx:145-161` — OTP box array rebuilt via `Array.from()` on every render
Recomputed on every keystroke even though `OTP_LENGTH` is constant and only the *contents* change.
**Fix:** `useMemo` keyed on the actual OTP value, or just render boxes directly from the OTP string without intermediate array construction.
**Estimated gain:** Trivial in isolation (tiny array), but it's recalculated on every keystroke during a flow users expect to feel instant — easy, free fix.

### 11. `ResultScreen.tsx` — `filterButton` JSX and row-rendering ternary defined inline in render body
`const filterButton = (...)` and the `rows.map(...)` branch logic are reconstructed each render rather than extracted to memoized sub-components.
**Fix:** extract `FilterButton` and the two row-shape branches (`SpanCard`, `GridPair`) into separate `React.memo` components.
**Estimated gain:** Moderate — `ResultScreen` is the product-listing/filter screen, likely to re-render often as filters/sort change; extracting prevents full-list re-render on unrelated state changes (e.g. sheet open/close).

### 12. `HomeScreen.tsx` banner-carousel `FlatList` missing `initialNumToRender`/`maxToRenderPerBatch`
Category and brand `FlatList`s (`HomeScreen.tsx:629-644,696-710`) and the banner carousel (`:147-160`) rely on RN defaults (10 items rendered up front).
**Fix:** add `initialNumToRender={4-6}`, `maxToRenderPerBatch`, `windowSize`, `removeClippedSubviews` — matching the tuning already present and correct in `ProductRail.tsx` and `WishlistScreen.tsx` (good reference implementations already in this codebase).
**Estimated gain:** Faster initial Home paint (fewer off-screen items rendered on mount); 5-10% improvement to time-to-interactive on Home.

### 13. Repeated `AsyncStorage.getItem(STORAGE_KEYS.userData)` + `JSON.parse` across independent call sites
Confirmed independently in `HomeScreen.tsx`, `useProfileCode.ts`, `useSession.ts`, `ProductScreen.tsx`, `EditProfileSheet.tsx`, `WishlistHeart.tsx` — each reads and re-parses the same blob rather than sharing a cached value. This matches the existing documented pattern in CLAUDE.md (reading directly at the call site to avoid stale `useProfileCode()` on first render), so it's intentional — but it means N bridge round-trips + N `JSON.parse` calls for the same data across a single screen's mount.
**Fix:** Not a one-line fix — would need a small in-memory cache (e.g. last-parsed user object with a short TTL, invalidated on login/logout) sitting underneath the existing call-site pattern, so each call site keeps reading "fresh" but most calls hit memory instead of the bridge. This is an architectural change — flag for discussion, don't implement unprompted (CLAUDE.md: minimize surface area, only change explicitly requested files).
**Estimated gain:** Reduces bridge crossings per screen mount from ~3-4 down to ~1; saves low-tens-of-ms per screen transition on mid-range Android, more on first cold reads.

### 14. `VariantChipGrid.tsx:29-40` — `inferLabel()` compiles 3 `RegExp` literals on every call
Regexes (`COLOR_HINTS`, `AGE_HINTS`, size pattern) are recreated each render instead of hoisted to module scope.
**Fix:** move the three regex literals to module-level `const`s outside the function.
**Estimated gain:** Trivial per-call cost, but free — no reason not to fix.

---

## P3 — Low severity / good-to-know, no action needed yet

- **Hermes is enabled** on both platforms (`gradle.properties`, `app.json`, conditional `build.gradle` dependency) — bytecode precompilation already in place. No action.
- **No dynamic imports / code-splitting** — all 21 screens statically imported in `AppNavigator.js`. For a 21-screen app this is normal and not yet worth the complexity of lazy-loading; revisit only if screen count or per-screen bundle size grows significantly.
- **No FlashList usage** — codebase uses `FlatList` exclusively. Current list sizes (product grids, order history, cart) are not large enough to need FlashList's recycling; the existing `FlatList` tuning in `ProductRail.tsx`/`WishlistScreen.tsx` is sufficient. Worth revisiting only if a screen needs to render hundreds of rows.
- **No moment.js / full lodash import / duplicate icon libraries** — dependency hygiene is good, no bundle-bloat findings.
- **`axiosInstance.ts`** caches the auth token in memory after first Keychain read (`_cachedToken`) — avoids per-request Keychain bridge calls. Already correctly implemented, no action.
- **`CartHydrator` (`App.tsx`)** fetches cart count from the server on every app mount — acceptable since it's a single call at startup, not a render-path issue.
- **`GluestackUIProvider`** is a pass-through no-op (NativeWind handles styling at build time) — zero runtime cost, no action.
- Several screens (`WishlistScreen.tsx`, `OrderHistoryScreen.tsx`, `CartScreen.tsx` rows) already correctly use `React.memo` + `useMemo` + tuned `FlatList` props — these are good reference patterns to copy when fixing the P1/P2 items above, rather than inventing new patterns.

---

## Summary Table

| # | Location | Issue | Severity | Est. Gain |
|---|----------|-------|----------|-----------|
| 1 | `CartContext.js:10-13` | Provider value not memoized | **P0** | App-wide re-render reduction |
| 2 | `ProductGrid.tsx:95,104,116,125` | Inline `onPress` defeats memo on Home grid | **P0** | 10-20% fewer re-renders, Home scroll |
| 3 | `ProductRail.tsx:32-41` | Inline `onPress` inside `renderItem` | **P0** | 5-10% fewer re-renders, all rails |
| 4 | `BrandsScreen.tsx` | `BrandCard` unmemoized + inline `onPress` | P1 | 10-15% smoother brand grid scroll |
| 5 | Multiple screens | Inline handlers in `renderItem`/`map` | P1 | 5-10% per list, cumulative |
| 6 | `ProductScreen.tsx:500-502` | Unthrottled scroll handler, no-op guard missing | P1 | Reduces gallery-swipe jank |
| 7 | `CartScreen.tsx:349-361` | Unmemoized cart total `.reduce()` | P1 | Scales with cart size, free fix |
| 8 | `CartScreen.tsx` | Per-row entrance animation fan-out | P1 (watch) | N/A unless carts grow large |
| 9 | No FastImage | Core `Image` only, no disk cache control | P2 | Faster repeat image loads, needs scope confirmation |
| 10 | `OTPVerificationScreen.tsx:145-161` | Array rebuilt every keystroke | P2 | Trivial, free fix |
| 11 | `ResultScreen.tsx` | Inline `filterButton`/row JSX, not extracted | P2 | Prevents full-list re-render on filter UI state |
| 12 | `HomeScreen.tsx` FlatLists | Missing virtualization tuning | P2 | 5-10% faster Home time-to-interactive |
| 13 | Repeated `AsyncStorage` + `JSON.parse` of `userData` | Architectural, needs discussion | P2 | Tens of ms per screen mount |
| 14 | `VariantChipGrid.tsx:29-40` | Regexes recompiled per call | P2 | Trivial, free fix |

---

## Recommended order of operations

1. Items **1-3** (P0) — small, isolated, highest leverage. Safe to do independently.
2. Items **4-7** (P1) — mechanical, same pattern repeated; can be done screen-by-screen.
3. Item **12** — copy existing tuning from `ProductRail.tsx`/`WishlistScreen.tsx` into Home's FlatLists.
4. Items **9 and 13** — both touch many files / introduce a new dependency or caching layer. Confirm scope with the user before starting, per this repo's "minimize surface area" rule.
