# Code Smell Audit

Scope: `src/` (167 TS/TSX files). Generated via static analysis (`rg`/manual review). Line numbers are best-effort — verify before editing, files may have shifted.

---

## 1. God Components / Giant Files

| File | Lines | Mixes |
|---|---|---|
| [CartScreen.tsx](src/screens/CartScreen.tsx) | 1092 | guest+logged-in cart fetch, inline `CartRow`/`GuestCartRow` components, optimistic mutation logic, summary panel, styling |
| [ResultScreen.tsx](src/screens/ResultScreen.tsx) | 1088 | search/pagination fetch, filter+sort state, inline `WishlistHeart`/`FeaturedCard`/`GridTile`/`SpanCard` components |
| [ProductScreen.tsx](src/screens/ProductScreen.tsx) | 1019 | detail fetch, image gallery, variant selection, cart+wishlist mutations, reviews, related products |
| [OrderHistoryScreen.tsx](src/screens/OrderHistoryScreen.tsx) | 898 | fetch, filter/sort, order grouping, inline `OrderCard` |
| [AddressScreen.tsx](src/screens/AddressScreen.tsx) | 895 | address CRUD, checkout flow, payment method selection, multi-section form validation |
| [OrderDetailScreen.tsx](src/screens/OrderDetailScreen.tsx) | 866 | detail fetch, reorder logic, timeline/items/payment breakdown rendering |
| [HomeScreen.tsx](src/screens/HomeScreen.tsx) | 781 | feed fetch, carousels, section rendering, deeplink handling, caching |
| [ProfileScreen.tsx](src/screens/ProfileScreen.tsx) | 758 | profile mutation, logout, address management, menu nav, logged-out view, form sheets |

**Pattern:** every large screen defines its list-row/card subcomponent *inline* in the same file instead of extracting it. This is the single biggest driver of file size.

---

## 2. Duplicate Code / Copy-Pasted Logic

- **Shake animation** — near-identical 5-step `Animated.timing` sequences (durations `50,55,50,50,55`) copy-pasted in [Login.tsx](src/screens/Login.tsx) (~137-171), [RegisterScreen.tsx](src/screens/RegisterScreen.tsx), [OTPVerificationScreen.tsx](src/screens/OTPVerificationScreen.tsx). No shared hook.
- **Image fade-in on load** — same `opacity` Animated pattern duplicated in CartScreen (~64-71, 179-181), ResultScreen's `FeaturedCard`/`GridTile`/`SpanCard` (~162-167, 228-235, 298-305), and ProductScreen's gallery.
- **Staggered row entrance** (opacity + translateY) duplicated in CartScreen (~53-61, 167-175) and ResultScreen's card components (~157, 221-223, 293).
- **WishlistHeart redefined inline** in [ResultScreen.tsx](src/screens/ResultScreen.tsx) (~95-146) despite a standalone [WishlistHeart.tsx](src/components/ui/WishlistHeart.tsx) already existing in `components/ui` — should import instead of redefining.
- **Price formatting** (`.toLocaleString('en-IN', …)`) repeated independently in ProductCard, CartScreen, OrderHistoryScreen, OrderDetailScreen, OrderSuccessScreen — no shared `formatPrice()` util, so rounding/options drift between call sites.
- **Manual form validation** with hand-rolled error-object literals duplicated across AddressScreen (~208-220), RegisterScreen, ProfileScreen — no shared validation helper.
- **Repeated user-facing message strings** ("Added to bag", "Could not add to bag", "Something went wrong.") duplicated verbatim across CartScreen/WishlistScreen/OrderHistoryScreen rather than defined once.

---

## 3. Magic Numbers

**Animation durations not using `Motion.duration.*`:**
- Login.tsx: `duration: 300` (Login.tsx:110,117) — closest token is `settle` (320)
- Shake sequences across Login/Register/OTP: `50, 55, 50, 50, 55` — no token exists for this pattern at all
- HomeScreen.tsx: `duration: 350` and `duration: 200` — neither matches an existing token
- ResultScreen.tsx: `duration: 200`
- ProductCard.tsx: `duration: 300`
- Skeleton.tsx shimmer: `duration: 1400`

**Spacing/gap not using `Space[*]` tokens:** scattered raw values across ProductCard, Login, RegisterScreen, AddressScreen, ProductScreen, ProfileScreen, Rating.tsx, SectionHead.tsx (e.g. `gap: 2`, `gap: 8`, `gap: 3`, `gap: 5`, `padding: 24`).

**Font sizes not using a token enum:** CategoriesScreen (`22,14,10`), ProductScreen (`10,20,14,12,15,28`), PaymentScreen (`16,15,14,12,11`), OTPVerificationScreen (`32`), ProfileScreen (`26,11`). No single `FontSize` source of truth covers all of these.

**Ad-hoc dimension/opacity constants:** `THUMB_SIZE = 52` in OrderHistoryScreen; icon sizes `36x36` repeated in ProductScreen/CategoriesScreen; raw `rgba(0,0,0,0.16/0.20/0.42)` opacity literals in ProductScreen.

This directly violates the CLAUDE.md rule: *"Never hardcode hex colors, raw spacing, font sizes, or animation durations. Always use tokens from `src/theme/`."*

---

## 4. Hardcoded Colors

Most concentrated in:
- **PaymentScreen.tsx** — `#FFFFFF`, `#555`, `#D32F2F`, `#F5F5F5`, `#1A237E`, `#888`, `#444` — none map to existing `Colors` tokens.
- **ProfileScreen.tsx** — `#EDE9E4`, `#EEEAE5`, `#F8F5F2`, plus several `rgba(0,0,0,…)` tint overlays.
- **ProductScreen.tsx** — `#FFFFFF`, `rgba(27,12,8,0.88)`, `rgba(255,255,255,0.95/0.45)`.
- **CartScreen.tsx** — `#226B3C` (success green, repeated), `rgba(34,107,60,0.07)`, `rgba(40,32,24,0.22)`.
- **Login.tsx / RegisterScreen.tsx** — `#F8F5F2`, `#111111`, `#FFFFFF` for StatusBar/button/text.
- **WishlistScreen.tsx, OTPVerificationScreen.tsx, OrderDetailScreen.tsx, SearchScreen.tsx, ResultScreen.styles.ts** — assorted `#FFFFFF` / `rgba(...)` literals.

Several of these (success green, warm off-white surfaces) appear *repeatedly* with the same literal value — strong signal they should be promoted to named tokens in `src/theme/colors.ts` rather than left as copy-pasted hex.

---

## 5. Hardcoded Strings

No centralized strings/i18n file exists. User-facing copy is embedded directly in JSX/logic, with the same message duplicated verbatim in multiple files (see §2). Notable clusters:
- Error toasts: "Couldn't load your bag.", "Couldn't add to bag", "This variant is currently unavailable.", "Something went wrong."
- Success toasts: "Added to bag", "Profile updated", "Password updated"
- Empty-state copy in CartScreen ("Your bag is empty.", "Add items you love and they'll appear here.")
- Form validation messages in AddressScreen (~208-220)

Lower severity than colors/magic numbers, but worth a `src/strings.ts` (or per-domain message constants) if/when localization or copy review becomes a concern.

---

## 6. Deeply Nested JSX

- [CartScreen.tsx](src/screens/CartScreen.tsx) ~514-539: `View → ScrollView → View → {isGuest ? <Fragment>{index>0 && <View/>}<GuestCartRowWrapper/></Fragment> : …}` — conditional+map+fragment nesting.
- [CartScreen.tsx](src/screens/CartScreen.tsx) ~597-620: `View → Animated.View → TouchableOpacity → Animated.View → PrimaryButton`.
- [ProductScreen.tsx](src/screens/ProductScreen.tsx) ~493-559: hero ScrollView → image array map → conditional Image + gradient overlay + dot indicators.
- [ResultScreen.tsx](src/screens/ResultScreen.tsx) ~515-540: list map with conditional Fragment + divider logic.

---

## 7. Deeply Nested Conditionals

- [AddressScreen.tsx](src/screens/AddressScreen.tsx) `buyProducts()` (~256-400): 4 sequential validation guards, then payment-method branch, then a large nested org-mapping/order-construction else-branch.
- [Login.tsx](src/screens/Login.tsx) `handleLogin()` (~174-259): response check → nested `if (userData.CustomerProfileCode)` → `Promise.all` with nested array `.map`.
- [CartScreen.tsx](src/screens/CartScreen.tsx) `renderBody()` (~431-503): 4 sequential conditional render blocks (skeleton/error/empty/items) — readable but long; candidate for extraction into named helper components.

---

## 8. Unnecessary Abstraction

- `src/components/primitives/Box.tsx`, `Text.tsx`, `Image.tsx` — thin pass-throughs to RN core components with no added behavior. Per CLAUDE.md these exist intentionally as the primitives layer, but `Box` specifically has only **one** import site in the whole codebase — confirm it's pulling its weight or fold the call site back to plain `View`.

No other single-use HOCs/wrappers found beyond what's flagged as dead/unused below.

---

## 9. Dead Code

- [src/api/axiosInstance.ts](src/api/axiosInstance.ts) (~90-100) — commented-out response interceptor for envelope `statusCode` auto-raise, with a "when screens migrate to centralized error handling, uncomment…" TODO. **Per CLAUDE.md this is intentional — do not uncomment** — but it's worth confirming the TODO is still tracked somewhere rather than living only as a code comment.

No other significant commented-out blocks or unreachable branches found.

---

## 10. Unused Files / Hooks

Confirmed via repo-wide grep — these files have **zero import references** anywhere outside their own definition:

- `src/hooks/useSession.ts` — dead, safe to delete.
- `src/hooks/useProductImage.ts` — dead (Unsplash image-fetch hook), safe to delete.

---

## 11. Unused / Obsolete Components

- `src/components/system/InlineError.tsx` — **zero usages** outside its own barrel re-export in `src/components/system/index.ts`. CLAUDE.md explicitly states *"InlineError is deprecated; use ErrorBanner instead."* This is confirmed dead and should be deleted along with its export.

A handful of other `components/ui/*` exports (e.g. `TrustLine`, `TrustStrip`) had ambiguous grep results (possible use inside conditionally-rendered sheets) — flagged as **needs manual verification before deletion**, not confirmed dead.

---

## 12. Unused Imports

Spot-checked large files (Login.tsx, CartScreen.tsx, ProductScreen.tsx) — no clearly unused imports found by sampling. A full sweep should be done with `npx eslint . --ext .js,.jsx,.ts,.tsx` (already configured) rather than manual grep, since the linter will catch this category exhaustively and cheaply.

---

## Refactoring Priority

**P0 — zero-risk cleanup (do first, ~15 min):**
1. Delete `src/hooks/useSession.ts` and `src/hooks/useProductImage.ts` (confirmed unused).
2. Delete `src/components/system/InlineError.tsx` + remove its export from `system/index.ts` (confirmed obsolete per CLAUDE.md).
3. Run `npx eslint . --ext .js,.jsx,.ts,.tsx` to exhaustively catch unused imports.

**P1 — duplication with real maintenance cost:**
1. Extract shake animation (Login/Register/OTP) into `useShakeAnimation()` hook.
2. Extract image fade-in into a shared hook/component; replace the inline redefinitions in ResultScreen's card components.
3. Replace ResultScreen's inline `WishlistHeart` with the existing `components/ui/WishlistHeart.tsx`.
4. Add a single `formatPrice()` utility and replace the 5+ independent `toLocaleString` call sites.
5. Centralize repeated toast/error strings (at minimum the ones duplicated 2+ times) into shared constants.

**P2 — token compliance (visible in design QA, not urgent functionally):**
1. Sweep PaymentScreen.tsx and ProfileScreen.tsx hardcoded hex colors into `Colors` tokens — these two files are the worst offenders.
2. Add missing `Motion.duration` tokens for the `200/300/350/1400`ms durations currently hardcoded, or conform call sites to existing tokens.
3. Audit raw `gap`/`padding`/`fontSize` literals against `Space`/`FontSize` tokens, starting with ProductScreen.tsx and ProfileScreen.tsx (highest concentration).

**P3 — structural, higher risk/effort (only if actively touching these screens):**
1. Extract inline card components (`CartRow`, `OrderCard`, `GridTile`, `SpanCard`, `FeaturedCard`) out of their host screens into `components/ui/` files — biggest lever for shrinking CartScreen/ResultScreen/OrderHistoryScreen.
2. Break `AddressScreen.tsx`'s `buyProducts()` and `Login.tsx`'s `handleLogin()` into smaller named functions to reduce nesting depth.
3. Consider whether `Box` primitive (single usage site) is worth keeping vs. inlining `View` at that call site.

Per CLAUDE.md, none of P3 should be done speculatively — only when a screen in that list is already being modified for a real feature/fix, and only for the file(s) actually touched.
