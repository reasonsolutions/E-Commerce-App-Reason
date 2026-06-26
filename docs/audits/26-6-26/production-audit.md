# Production Readiness Audit — E-Commerce App (React Native)

**Audit date:** 2026-06-26
**Scope:** Full codebase review (184 source files) — architecture, navigation, state, API layer, auth, error handling, offline handling, AsyncStorage, performance, animations, accessibility, TypeScript, security, memory leaks, crash risks, duplication, tech debt.
**Method:** Static code review across four parallel passes (Navigation/State/API/Auth; Error/Offline/Storage/Security; Performance/Animation/Memory/Crash; TypeScript/Accessibility/Duplication/Debt). No code changes made — findings only.

**Overall verdict:** Architecture is sound and follows the documented patterns (domain-scoped API ownership, Context+useAsyncState, flat navigation). The blocking issues are concentrated in **payment security** and a handful of **unguarded `route.params` / `JSON.parse` crash paths**. Fix the P0s below before any store submission.

---

## Severity Summary

| Severity | Count | Theme |
|---|---|---|
| P0 | 5 | Hardcoded payment credentials, insecure WebView, logout navigation bug, route.params crashes |
| P1 | 12 | Error boundary missing, request cancellation, cart context memoization, JSON.parse crashes, image error handling, animation perf |
| P2 | 17 | Offline detection, AsyncStorage race conditions, accessibility coverage, TS `any` usage, payment UX edge cases |
| P3 | 10 | Logging hygiene, dead code, minor validation gaps, navigation typing |

---

## P0 — Launch Blockers

### P0-1. Hardcoded payment gateway credentials in client source
- **File:** `src/screens/PaymentScreen.tsx:90-91, 173, 275`
- **Component:** `EcomPaymentScreen` (MIPS payment gateway integration)
- **Why it's a problem:** MIPS credentials are hardcoded in plaintext: `Login: 'mu@postglobal'`, `Password: '#mu@76*3'`, and a second credential pair `user: 'mplpgPay'` / `password: '#mpl&2384kewrf'`. These ship inside the compiled APK/IPA and are trivially recoverable via decompilation (`apktool`, `jadx`, or even `strings` on the binary).
- **Real-world impact:** Anyone can extract these credentials and call the MIPS payment API directly — forge payment confirmations, attempt fraudulent transactions, or access the payment account. This is a PCI-DSS-relevant exposure for a live payment integration, not a theoretical risk.
- **Recommended fix:** Move all MIPS authentication server-side. The app should call your own backend to obtain a short-lived, scoped payment token; the backend holds the MIPS credentials and never exposes them to the client. Audit git history — these credentials must be rotated even after removal from the working tree, since they're already in past commits.
- **Estimated effort:** L (backend endpoint + client refactor, coordinate with payment gateway team)

### P0-2. Insecure WebView configuration on payment screen
- **File:** `src/screens/PaymentScreen.tsx:503-522`
- **Component:** `EcomPaymentScreen` WebView
- **Why it's a problem:** `originWhitelist={['*']}` accepts navigation to any URL/scheme (including `javascript:`/`data:`), and `mixedContentMode="always"` permits insecure HTTP resources to load inside a payment page. Combined with `javaScriptEnabled` and `thirdPartyCookiesEnabled`, this is a meaningful injection/MITM surface on the one screen handling money.
- **Real-world impact:** A compromised network, DNS hijack, or malicious redirect inside the payment flow could inject script or load insecure content during checkout, risking payment data interception.
- **Recommended fix:** Restrict `originWhitelist` to the exact MIPS domain(s); set `mixedContentMode="never"`; disable `thirdPartyCookiesEnabled` unless MIPS explicitly requires it; validate the `mipsUrl` is on the expected host before loading.
- **Estimated effort:** M

### P0-3. `resetToLogin()` navigates to Home, not Login
- **File:** `src/utils/navigationService.ts:7`
- **Component:** `resetToLogin`
- **Why it's a problem:** Function is named and used (from the 401-handling logout path) to send a logged-out user to re-authenticate, but it resets the stack to `{ name: 'Home' }`. The session is cleared, yet the user lands on Home looking logged in until they hit a guarded action.
- **Real-world impact:** Token-expiry logout is silent and confusing — users browse as if logged in, then get an unexpected `LoginPromptSheet` mid-checkout, risking cart abandonment.
- **Recommended fix:** Change the reset route to `{ name: 'Login' }` (or to Home with a visible "session expired" toast if product wants guest browsing to continue — but currently neither happens intentionally).
- **Estimated effort:** S

### P0-4. Unguarded `route.params` destructuring crashes on direct/stale navigation
- **Files:**
  - `src/screens/PaymentScreen.tsx:64` — `const { profileCode, cartItems, selectedAddress, orderTotal } = route.params;`
  - `src/screens/OTPVerificationScreen.tsx:42` — `const { CustomerName, EmailID, MobileNumber, CountryCode, Password } = route.params;`
  - `src/screens/AddressScreen.tsx:270-291` — checks `items.length === 0` but accesses `items[0].CartMasterCode` in a path that can still see an empty array
- **Component:** Checkout/registration flow screens
- **Why it's a problem:** None of these guard against missing/partial `route.params`. Any stale deep link, fast double-tap navigation, or future caller that omits a param crashes the screen with no recovery.
- **Real-world impact:** Full checkout or OTP-registration flow crash — these are the two highest-stakes flows in the app (money and account creation).
- **Recommended fix:** Add `route.params ?? {}` fallback plus an explicit guard that renders an error/redirect state when required fields are absent, instead of destructuring directly.
- **Estimated effort:** S (15-30 min per screen, 3 screens)

### P0-5. No app-level Error Boundary
- **File:** `App.tsx` (root component tree)
- **Component:** App root
- **Why it's a problem:** There is no `componentDidCatch`/`getDerivedStateFromError` boundary anywhere in the tree. Any uncaught render-time error in any screen takes down the entire app to a white/red screen with no recovery path.
- **Real-world impact:** A single null-pointer bug in one screen (several of which are flagged below) becomes a full app crash rather than a contained, recoverable error. This is the difference between a bad review and a 1-star crash report.
- **Recommended fix:** Add a top-level Error Boundary component wrapping `AppNavigator`, logging the error and rendering a fallback "Something went wrong" screen with a restart/retry action.
- **Estimated effort:** M

---

## P1 — High Priority

### P1-1. `CartContext` value object recreated every render
- **File:** `src/context/CartContext.js:10-13`
- **Why it's a problem:** `{ cartCount, setCartCount }` is a new object literal each render, so every `useCart()` consumer re-renders whenever `CartProvider` re-renders, regardless of whether `cartCount` actually changed.
- **Real-world impact:** Unnecessary re-renders across every screen using the cart badge — minor jank/battery cost, compounding on lower-end devices.
- **Recommended fix:** `const value = useMemo(() => ({ cartCount, setCartCount }), [cartCount]);`
- **Estimated effort:** S

### P1-2. No request cancellation on unmount
- **File:** `src/api/axiosInstance.ts` (global), consumed via `useAsyncState`
- **Why it's a problem:** `useAsyncState`'s `cancelled` ref stops state updates after unmount but never cancels the underlying Axios request. In-flight requests keep running and consuming bandwidth/battery after a user navigates away.
- **Real-world impact:** Wasted bandwidth/battery on slow networks; possible stale-data writes if a screen remounts before the old request resolves.
- **Recommended fix:** Wire `AbortController` (or Axios `CancelToken`) through `useAsyncState`, aborting on unmount.
- **Estimated effort:** M

### P1-3. API response envelope (`statusCode !== 1`) auto-raise disabled, enforcement inconsistent
- **File:** `src/api/axiosInstance.ts:92-100`; call sites vary across screens
- **Why it's a problem:** This is intentional per `CLAUDE.md` ("do not uncomment"), but the consequence is that every call site must manually check `statusCode`, and not all of them do (e.g., some `HomeScreen` fetches assume success). This produces inconsistent handling of application-level failures across the codebase.
- **Real-world impact:** A backend returning `{ statusCode: 0, result: null }` (e.g., degraded service) is silently treated as success in some screens, surfacing as a crash or blank state instead of a clear error.
- **Recommended fix:** Don't fight the documented architecture decision — instead, create one shared `unwrapEnvelope(response)` helper that all `xxxApi.ts` files call, so the inconsistency is fixed once centrally without re-enabling the global interceptor.
- **Estimated effort:** M (audit + adopt helper across domains)

### P1-4. Guest-cart-to-server-cart merge on login is not atomic
- **File:** `src/screens/Login.tsx:207-248`
- **Why it's a problem:** Guest cart items are merged via per-item API calls; failures are not collected. `clearGuestCart()` runs regardless, and cart count is set to the *expected* merged total rather than a confirmed server count.
- **Real-world impact:** Items silently disappear from a user's cart on login if any merge call fails — cart badge shows a count that doesn't match what's actually on the server.
- **Recommended fix:** Collect merge failures; only clear the guest cart if all items merged successfully (or selectively retain failed items); re-fetch the authoritative cart count from the server after merge rather than computing it locally.
- **Estimated effort:** M

### P1-5. `JSON.parse` on AsyncStorage data without try/catch (crash risk)
- **Files (representative, not exhaustive):**
  - `src/screens/OrderDetailScreen.tsx:374, 412`
  - `src/screens/OrderHistoryScreen.tsx:322`
  - `src/screens/AddressScreen.tsx:174`
  - `src/screens/CartScreen.tsx:304`
  - `src/screens/AddressManagementScreen.tsx:138`
  - `src/screens/SearchScreen.tsx:48`
  - `src/screens/ProductScreen.tsx:204, 207`
  - `src/components/ui/WishlistHeart.tsx:33`
- **Why it's a problem:** All parse `STORAGE_KEYS.userData` (or similar) without a try/catch. Corrupted/partial AsyncStorage writes (app killed mid-write, OS storage issues) throw a `SyntaxError` that crashes the screen.
- **Real-world impact:** A single corrupted storage entry can break order history, cart, addresses, search, and wishlist screens — and because there's no Error Boundary (P0-5), it can crash the whole app.
- **Recommended fix:** Add a small `safeJsonParse<T>(raw: string | null, fallback: T): T` utility and route all of these through it instead of bare `JSON.parse`.
- **Estimated effort:** M (one utility + ~10 call-site swaps)

### P1-6. Missing `onError` handlers on product/cart images
- **Files:** `src/screens/HomeScreen.tsx` (BannerCard), `src/screens/WishlistScreen.tsx:92-98`, `src/screens/ResultScreen.tsx:182-186,253-257,324-328`, `src/screens/CartScreen.tsx:95-100,190-196`
- **Why it's a problem:** Every product/cart/wishlist image has `onLoad` but no `onError`. A broken image URL (common with user-generated or third-party CDN content) fails silently, leaving a blank box instead of a fallback.
- **Real-world impact:** Visually broken product cards/cart rows on any image failure — directly affects purchase confidence at the point of checkout.
- **Recommended fix:** Add a shared `onError` fallback (placeholder image or initials block) to the existing image components; consider one wrapped `ProductImage` component if duplicated enough times.
- **Estimated effort:** M (touches ~6 components)

### P1-7. Scroll-driven animation uses `useNativeDriver: false`
- **File:** `src/screens/ProductScreen.tsx:487-490`
- **Why it's a problem:** The nav-bar color/opacity interpolation on scroll runs on the JS thread because color interpolation isn't native-driver-compatible with the classic `Animated` API. On a long product detail page, this is the highest-frequency animation in the app.
- **Real-world impact:** Visible scroll jank on mid/low-tier Android devices — directly on the most-viewed screen in an e-commerce app.
- **Recommended fix:** Move the color transition to state-driven updates (snap color at a scroll threshold instead of continuous interpolation) or migrate to `react-native-reanimated` worklets, which the app already depends on for other animations.
- **Estimated effort:** M

### P1-8. No offline/network-state detection anywhere in the app
- **Files:** N/A — confirmed absent (no NetInfo or equivalent in `package.json`)
- **Why it's a problem:** The app has no way to distinguish "slow request" from "no network" for the user, and no proactive detection before firing requests that are doomed to fail.
- **Real-world impact:** On flaky connections (common for mobile e-commerce), users see generic timeout/error states with no indication to reconnect, and may retry destructive actions (checkout) repeatedly without understanding why they're failing.
- **Recommended fix:** Add `@react-native-community/netinfo`; surface a lightweight offline banner; gate checkout/payment initiation behind a connectivity check.
- **Estimated effort:** M

### P1-9. Refresh token never rotates
- **File:** `src/api/axiosInstance.ts:25-45`
- **Why it's a problem:** Access tokens refresh, but the same refresh token is reused indefinitely rather than being rotated by the backend on each use — a deviation from standard OAuth2/OIDC practice.
- **Real-world impact:** A leaked refresh token (device backup, logs, compromised device) grants indefinite re-authentication ability with no expiry-based mitigation.
- **Recommended fix:** Coordinate with backend to rotate the refresh token on every use and update Keychain storage accordingly. This is a backend + client change, not client-only.
- **Estimated effort:** M (requires backend coordination)

### P1-10. Dead/orphaned files: `src/data/mockData.js`, `src/components/CartItem.js`
- **Why it's a problem:** Neither file is imported anywhere in the codebase (confirmed via grep). `mockData.js` duplicates `src/api/mock/mockData.ts`; `CartItem.js` duplicates the inline `CartRow`/`GuestCartRow` already used by `CartScreen.tsx`.
- **Real-world impact:** Low direct risk, but actively misleads future contributors into editing the wrong file.
- **Recommended fix:** Delete both files.
- **Estimated effort:** S

### P1-11. `WishlistItemInterface`/`WishlistApiProduct` use `any` for Taxes/PhysicalAttributes
- **File:** `src/api/interfaces.ts:647, 668-669`
- **Why it's a problem:** Every other domain interface types these fields properly (`VariantTax[]`, `PhysicalAttributes`); wishlist's fallback to `any` is an inconsistency that defeats type-checking specifically on data that touches tax/pricing display.
- **Real-world impact:** A backend shape change here won't be caught at compile time, while it would be for product/cart.
- **Recommended fix:** Reuse the existing `VariantTax[]` and `PhysicalAttributes` types already defined elsewhere in the file.
- **Estimated effort:** S

### P1-12. Accessibility labels absent on ~74% of interactive UI components
- **Files:** `src/components/ProductCard.tsx:66`, `src/components/ui/BrandTile.tsx`, `CategoryTile.tsx`, `ProductGrid.tsx`, `OrderProgressBar.tsx`, `Rating.tsx`, `Price.tsx`, `DarkHeader.tsx:28` (back button), and 26+ more
- **Why it's a problem:** Primary tap targets across the product browsing and checkout path (product cards, category tiles, header back buttons) have no `accessibilityLabel`/`accessibilityRole`, so screen readers (VoiceOver/TalkBack) cannot describe them.
- **Real-world impact:** App is effectively unusable for screen-reader users on its core shopping flow. Both Apple and Google increasingly flag accessibility gaps in review, and this is also a legal exposure area (ADA/EN 301 549) for a commerce app.
- **Recommended fix:** Prioritize the checkout-critical path first (ProductCard, DarkHeader back button, CTA buttons), then sweep the remaining `ui/` components. Define labels at the data layer (e.g., `${BrandName} ${ProductName}, ${Price}`) so they stay correct as content changes.
- **Estimated effort:** M (3-4 hours for a full pass; can be split into a P0-path subset done quickly + the rest later)

---

## P2 — Medium Priority

| # | Issue | File(s) | Fix effort |
|---|---|---|---|
| P2-1 | Token refresh race: concurrent 401s could double-trigger refresh under specific timing | `src/api/axiosInstance.ts:110-125` | M |
| P2-2 | API timeout fixed at 10s — too short for 3G/poor WiFi, especially on checkout/payment | `src/api/axiosInstance.ts:49` | S |
| P2-3 | `_orgByInventory` module-level cache never cleared on login/logout — stale org mapping across accounts on shared device | `src/api/product/productApi.ts:7-19` | M |
| P2-4 | `recentlyViewed`/`recentSearches` guest scope (`_guest` suffix) shared across all guests on one device — privacy leak on shared devices | `src/screens/HomeScreen.tsx:290-298`, `storageKeys.ts` | S–M |
| P2-5 | AsyncStorage concurrent-write race on rapid search-term commit/clear | `src/screens/SearchScreen.tsx:109-127` | M |
| P2-6 | Debounce timers (`SearchScreen` suggestion fetch, focus timeout) not always cleared on unmount | `src/screens/SearchScreen.tsx:46-56, 90-100` | S |
| P2-7 | Transaction ID generated client-side as `TXN-{cartCode}-{timestamp}` — theoretical collision risk; prefer backend-issued or UUID | `src/screens/AddressScreen.tsx:291`, `PaymentScreen.tsx` | S |
| P2-8 | MIPS auth token re-fetched on every payment screen visit instead of cached/backend-brokered (compounds P0-1) | `src/screens/PaymentScreen.tsx:85-98` | M |
| P2-9 | Payment countdown/polling interval may continue after user navigates away before completion/failure resolves | `src/screens/PaymentScreen.tsx:196-224` | S |
| P2-10 | `selectedAddr` used with non-null assertion after a `.find()` that could return `undefined` if address is deleted mid-flow | `src/screens/AddressScreen.tsx:297, 375-378` | S |
| P2-11 | `console.error`/`console.log` calls in PaymentScreen and axios refresh path are not `__DEV__`-gated, risking log leakage of payment/error detail in production builds | `src/screens/PaymentScreen.tsx:187,333,456`, `axiosInstance.ts:42` | S |
| P2-12 | No certificate pinning on API or payment traffic — relies solely on OS-level TLS validation | `src/api/axiosInstance.ts` | M |
| P2-13 | No app-wide dynamic font scaling support — zero `allowFontScaling`/`maxFontSizeMultiplier` usage found | All `Text` usage | M |
| P2-14 | Color contrast ratios undocumented in `src/theme/` — can't produce accessibility compliance evidence on request | `src/theme/tokens.ts` | S |
| P2-15 | Catch blocks typed `any` instead of `unknown` across ~10 screens, undermining `strict: true` | `Login.tsx:252`, `RegisterScreen.tsx:113`, `OrderHistoryScreen.tsx:368,442`, `OrderDetailScreen.tsx:432`, `OTPVerificationScreen.tsx:126`, `AddressScreen.tsx:387` | M |
| P2-16 | Response/array callbacks typed `any` (e.g. `.reduce((sum: number, item: any) => ...)`) despite well-typed interfaces existing | `Login.tsx:211,244`, `ProfileScreen.tsx:392`, `SearchScreen.tsx:78` | M |
| P2-17 | Mobile number field validates only non-empty, not format — bad data reaches delivery backend | `src/screens/AddressScreen.tsx:208-220` | S |

---

## P3 — Minor

| # | Issue | File(s) | Fix effort |
|---|---|---|---|
| P3-1 | `apiLogger.ts` logs response bodies (truncated, headers masked) but not full PII masking — fine for dev-only logging today, but a latent risk if remote log aggregation is ever added | `src/api/apiLogger.ts:96-119` | S |
| P3-2 | Several empty `catch {}` blocks with no logging, hiding real storage/cache failures during debugging | `unsplashImage.ts:24`, `HomeScreen.tsx:296`, `SearchScreen.tsx:52`, `useProfileCode.ts:14`, `AddressManagementScreen.tsx:252`, `ResultScreen.tsx:126,672` | S |
| P3-3 | `Promise.all(...)` chains in `CategoriesScreen.tsx:97-107` and `ProductScreen.tsx:257-262` have per-item `.catch()` but no `.catch()` on the aggregate, relying on swallowed inner errors | both files | S |
| P3-4 | Inline arrow functions / inline style objects inside `FlatList`/list `renderItem`, defeating memoization | `HomeScreen.tsx:641, 648` | S |
| P3-5 | Per-screen ad-hoc `navigate: (screen: string, params?: any) => void` types instead of a shared `RootStackParamList` | `HomeScreen.tsx:187`, `BrandsScreen.tsx:35`, `SearchScreen.tsx:27`, `HelpCenterScreen.tsx:25`, others | M (broad but mechanical) |
| P3-6 | TODO/commented-out interceptor block restates a CLAUDE.md-documented decision, slightly ambiguous for new contributors | `src/api/axiosInstance.ts:92-100` | S |
| P3-7 | Non-null assertion (`homeCache.categories!`) relies on render-order guarantee rather than a type-narrowing guard | `SearchScreen.tsx:287` | S |
| P3-8 | `getInitialRoute()` always returns `'Home'` with no session rehydration cue — likely intentional per CLAUDE.md, but worth confirming product intent given P0-3's related confusion | `src/utils/auth.ts:6-8` | — (decision, not a bug) |
| P3-9 | `CartHydrator` reads `userData` on startup without try/catch around its `JSON.parse` (same family as P1-5 but isolated to app boot path) | `App.tsx:21-44` | S |
| P3-10 | Defensive `allProducts?.length` vs `allProducts.length` nit in price-bounds effect — low risk since state is array-initialized | `ResultScreen.tsx:794-800` | S |

---

## Recommended Sequencing

1. **Before writing any more features:** Fix all P0s. Items P0-1/P0-2 (payment security) and P0-5 (Error Boundary) are non-negotiable for a commerce app; P0-3/P0-4 are each under an hour.
2. **Next sprint:** Clear P1s, prioritizing P1-5 (JSON.parse crashes) and P1-6 (image error handling) since they're mechanical, low-risk, high-frequency-impact fixes, alongside P1-12's checkout-path accessibility subset.
3. **Following release:** P2 batch — offline detection (P2 mentions throughout) and the AsyncStorage race conditions are the highest-value items; the `any`-typing cleanup (P2-15/16) can ride along with other touches to those files.
4. **Ongoing/backlog:** P3 items — mostly hygiene, safe to batch into unrelated PRs that already touch the same files.

No code changes have been made as part of this audit.
