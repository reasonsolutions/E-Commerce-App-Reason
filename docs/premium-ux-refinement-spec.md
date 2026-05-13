# Premium UX Refinement — Implementation Spec

**Status:** Phase: Premium UX Refinement.
**Constraint:** Visual + motion + interaction work only. **No architecture changes.** Preserves `tokens.ts`, `services.ts`, `useAsyncState`, `CartContext`, the 11-route stack, the two-tier component library.
**Audience:** Claude Code, for execution planning.

---

## PART A — GLOBAL SYSTEM

### A1. Visual language direction

Register: **calm-mono editorial** (Apple Store × Shop × Zara). Not Aesop-warm-cream. Preserve current dark header + `shop.` wordmark — that DNA stays.

Principles, enforced in review:
1. **Restraint over decoration.** Fewer elements per screen.
2. **Voice through type.** Serif for product/headline/price; sans for UI/body; mono for micro-labels.
3. **Depth through tone, not shadow.** Three off-white surfaces replace `#FFFFFF` + drop-shadows.
4. **One accent, used sparingly.** Ember/terracotta, ≤3 appearances per session.
5. **Confidence as feel.** Nothing snaps. Press has weight. Failure never breaks the frame.

### A2. Typography hierarchy

Add **one** serif family. Recommended (pick in Phase 1): `Instrument Serif` (free, editorial) or `PP Editorial New` (license). Keep existing sans for UI/body. Add `JetBrains Mono` for micro-labels.

Extend `src/theme/typography.ts` — add roles, do not change existing tokens:

```ts
Type.display     // serif, 40/1.05, used for: hero headlines, OrderSuccess, Login mark
Type.title       // serif, 28/1.1,  used for: screen titles, section starters
Type.heading     // serif, 22/1.2,  used for: product names, card titles
Type.price       // serif, 22/1.1, tabular numbers — REPLACES current Price preset
Type.priceLarge  // serif, 32/1.0 — used in Cart total, ProductScreen hero
Type.body        // sans, 16/1.5
Type.bodyStrong  // sans, 16/1.5, weight 500
Type.caption     // sans, 13/1.4
Type.label       // mono, 12/1.2, letter-spacing 0.14em, uppercase — brand labels, micro-meta
Type.tab         // sans, 11/1.2, weight 500
```

Rules:
- Brand labels (`CROCS`, `NIKE`) → `Type.label`, not bold sans caps.
- Prices everywhere → `Type.price` / `Type.priceLarge`, never inline sans.
- Strike-through "was" price → `Type.caption` in mono, `Colors.ink3`, line-through — visually subordinate to current price.
- Adopt `Type.*` across all 11 screens. Audit P2-10 explicitly calls this out.

### A3. Spacing / surfaces / elevation

**Surfaces — add to `tokens.ts`:**
```ts
Colors.surface     = #F8F7F4  // page (was #FFFFFF)
Colors.surfaceSoft = #F2F0EC  // cards, list rows
Colors.surfaceDeep = #E8E5DF  // sheets, cart summary panel
Colors.ink         = #111111
Colors.ink2        = #2E2E2E
Colors.ink3        = #6B6B6B
Colors.ink4        = #A8A8A8
Colors.rule        = #E2DED7  // hairline dividers
Colors.accent      = #B25A3D  // ember — retoned; reserve for primary CTA states, success
Colors.danger      = (desaturate current; destructive only — NOT promos)
```

**Elevation:**
- Default card: `backgroundColor: surfaceSoft` on a `surface` page. No shadow.
- Sheets / overlays: `backgroundColor: surfaceDeep` with `Shadow.sm` ONLY when overlapping content (sticky cart summary, modals).
- Remove `Shadow.md`/`Shadow.lg` from inline cards (CartItem, ProductCard, OrderHistoryCard, AddressCard, WishlistCard).

**Spacing — keep Space[N] (4px grid). Add density rules:**
- `Space.screenH = 20` (was 16) — edge padding.
- Section header → content gap: **32px above section, 24px below header**.
- Card internal padding: **20px** (was 16).
- Stack rhythm in cards: `gapRow = 12` between lines, `gapBlock = 20` between blocks.

**Radius:**
- Cards: `Radius.md` (12px).
- Inputs / pills: `Radius.lg` (16px).
- Primary CTA button: `Radius.pill`.
- Image thumbnails: `Radius.sm` (8px).
- **Stop using rounded corners on hairline-separated rows** (e.g. order detail rows). Hairline + flat is more premium than nested rounded boxes.

### A4. Motion vocabulary

Three curves, three durations. Bind to `useEntrance` and a new `useTactile` hook (no new libs — RN `Animated` API).

```
Tap     120 ms  easeOut          press states, badge increments, taps
Settle  320 ms  spring(damp:18)  list entrances, screen-in, sheet rise, modal in
Carry   560 ms  easeInOut        hero parallax, OrderSuccess mark, image scrub
```

Adopted patterns:
- **Button press:** scale 0.98 + Light haptic on press-in (Tap). Restore on release.
- **Add to cart confirmed:** badge counter pops 1.15× → 1.0 (Settle), Success haptic.
- **Tab change:** Light haptic on press.
- **Sheet / modal entry:** Settle with backdrop fade 240ms.
- **Screen entry:** existing `useEntrance` — DO NOT replace, but normalize to `(delay, withScale=false, initialY=12)` across all screens. HomeScreen exception preserved per CLAUDE.md.
- **Failure / shake:** 220ms horizontal shake (±6px → 0), Warning haptic. Replaces alert modals for inline validation.

Haptics — wrap `react-native-haptic-feedback` in `src/hooks/useHaptic.ts`:
```ts
useHaptic() → { light, medium, success, warning }
```

### A5. Feedback / loading / success / error behavior

**Loading:**
- Replace opacity-pulse `Skeleton` with linear shimmer (single value sweep across surface, 1400ms loop). Same component API, internal change only.
- Skeleton color: `surfaceDeep` over `surfaceSoft`. Subtle.
- Initial fetch on any data screen → skeleton in the same shape as the loaded layout (not a generic grey box).

**Success:**
- `OrderSuccessScreen` checkmark — replace plain `✓` text with `Animated` SVG path draw on the Carry curve (~560ms), pause 700ms hold, then reveal "View My Orders" CTA with Settle. Success haptic at path completion.
- `addToCart` confirmed → bag badge bump + Success haptic. No toast required.
- Wishlist toggle → heart fill draw on Tap, Light haptic.

**Error:**
- Replace ALL native `Alert.alert()` calls (Login fail, mutation fail) with in-screen `ErrorBanner` (already exists) or a new `InlineFieldError` for form-field errors.
- Login failure: inline caption under password field + black button shake. **No modal.**
- Network/full-page error: keep existing `ErrorState` — restyle: lighter weight icon, serif title, mono retry timestamp.

**Empty:**
- `EmptyState` already covers Cart / Orders / Address. Bring Wishlist into the same component. Add a soft serif headline pattern — "Nothing saved yet." (not "Your wishlist is empty.").

### A6. Navigation / header / tab-bar

**Top header (dark variant, used on Home / Cart / Orders / Wishlist / Profile / Result / FlashDeals):**
- Keep dark ink background, white type. **Replace the soft gradient seam** with a single 1px `rgba(255,255,255,0.06)` hairline at the bottom edge.
- Header height: account for safe-area + 56px content. Title baseline aligns with back-button center.
- Title style: `Type.title` in white. Brand wordmark `shop.` on Home stays.
- Cart icon: stroke 1.75px, white at full opacity (not grey). Badge → ember accent dot with mono count.

**Top header (light variant, used on Product / Address / OrderDetails):**
- `surface` background, ink text. Same hairline seam.
- `ScreenHeader` plain variant — keep, retone.

**Bottom tab bar (`BottomNavBar`):**
- 5 tabs unchanged.
- Active state: bold weight + a **1.5px ink underline** above the icon (8px wide, centered) — replaces opacity-only signal.
- Inactive: stroke icons in `ink3`, label in `ink3`.
- Tab press: Light haptic, label scale 1.0 → 1.04 → 1.0 on Tap.
- Cart badge: ember dot + mono count, top-right of bag icon.

### A7. Premium commerce atmosphere

- **Discount badges:** retire red filled chips. Replace with ember dot + mono `-12%` at `Type.label` size, top-left of image at 12px inset.
- **Brand labels:** mono caps (`Type.label`), `ink3`, never bold sans.
- **Price treatments:** current price in serif `Type.price`; was-price in mono `Type.caption` with strikethrough; per-unit ("$X ea") in `Type.caption` `ink3`. Stacked or inline depending on context — never the same weight as the current price.
- **Product imagery:** 4:5 aspect for product cards, full-bleed 1:1 or 4:5 on ProductScreen hero. Background of image area in `surfaceDeep` so transparent/light images don't dissolve.
- **Section headers:** `Type.title` left, optional `See all →` in `Type.bodyStrong` with underline-on-press right. 32 above, 24 below.

### A8. Onboarding / Login emotion

Replace the entire screen.

- Top 55% of screen: dark ink full-bleed, carrying the wordmark `shop.` (serif, large) + a single line of identity copy in serif italic (`Made for the things you'll keep.` — placeholder; user owns final copy).
- Bottom 45%: surface lift, holding the form. No card frame — implied by tone shift.
- Form: underline-only inputs with floating labels (no pill fills). Label animates from placeholder position to compact above-field on focus (220ms Settle).
- CTA: black pill button, full-width, `Type.bodyStrong`. Press: scale 0.98 + Light.
- Entrance staging: wordmark fade-up 240ms → headline 360ms → fields 480ms → button 600ms. Each Settle.
- Failure: inline caption under password (`Type.caption` in `danger`), 220ms button shake, Warning haptic. Native alert removed.
- Loading: button label swaps to `Animated` 3-dot pulse, button stays full-width. No spinner.

Login screen also gets P1-06 cleanup: kill the 55KB inline WebView SVG entirely — no asset replaces it.

---

## PART B — SCREEN-BY-SCREEN

### Phase 2 Implementation Status

| Screen | Spec ref | Status | Frozen since |
|---|---|---|---|
| Login | B1 + A8 | **FROZEN** | May 13, 2026 |
| Home | B2 | **FROZEN** | May 13, 2026 |
| ProductScreen | B3 | **FROZEN** | May 13, 2026 |
| OrderSuccessScreen | B8 | **FROZEN** | May 13, 2026 |
| CartScreen | B6 | **FROZEN** | May 13, 2026 |
| ResultScreen | B4 | Pending Phase 3 | — |
| WishlistScreen | B5 | Pending Phase 3 | — |
| OrderHistoryScreen | B9 | Pending Phase 3 | — |
| ProfileScreen | B11 | Pending Phase 3 | — |
| AddressScreen | B7 | Pending Phase 3 | — |
| OrderDetailScreen | B10 | Pending Phase 3 | — |

Frozen screens define the visual standard. All Phase 3 work must match their register.
See `docs/project-modernization-audit.md §16` for full implementation detail and binding patterns.

---

Format per screen: **highest-impact change**, **hierarchy fixes**, **interaction**, **components touched**.

### B1. Login (`src/screens/Login.tsx`)

- **Highest impact:** Remove inline SVG illustration + WebView. Implement dark-cover top / light-form bottom composition described in A8.
- **Hierarchy:** Wordmark > identity copy > inputs > CTA. Vertical rhythm 40/16/24/24 between blocks.
- **Interaction:** Staged entrance (A8), floating labels, inline failure, button scale-on-press.
- **Components:** rewrite screen body; reuse `Button`. New: `FloatingLabelInput` (presentational, `components/ui/`). Add `useHaptic`.

### B2. Home (`src/screens/HomeScreen.tsx`)

- **Highest impact:** (a) Hero rebuild — single full-bleed photo, one headline, underlined-arrow CTA, no gradient blob; (b) categories → typographic horizontal rail (kill circle bubbles).
- **Hierarchy:** Hero > Categories > Flash Deals > Promo card. Section gap 32/24. Hero takes ~46% of viewport height.
- **Interaction:** Hero parallax (≤8px on scroll, Carry curve). Category rail snap-scroll. Flash Deals scroller paged at 88% width tile + 12% peek.
- **Components touched:** Hero block (new — local to HomeScreen), `CategoryRail` (new — `components/ui/`), `ProductCard` (restyle — see B12), `SearchBar` (keep, retone), `BottomNavBar` (per A6).
- **P1-03 fix bundled:** migrate Home from raw `useState`/`useEffect` to `useAsyncState`. Add skeleton states for categories and flash-deals rails.
- **P1-01 fix bundled:** post-login `fetchCartCount` lifted into `App.tsx` so badge is correct on first Home render.

### B3. Product Details (`src/screens/ProductScreen.tsx`)

- **Highest impact:** Image becomes the page. Edge-to-edge hero, name in serif over `surfaceSoft` plate below, price as `Type.priceLarge` typography (not a chip). Add-to-cart as fixed bottom sheet.
- **Hierarchy:** Image (60% viewport) > brand label + name > price + meta > variant selector > description > CTA bar.
- **Interaction:** Pinch-out on image opens fullscreen viewer (Settle in, easeInOut on dismiss). Variant selector → pills become hairline-stroke chips with active state in ink (no fill); haptic Light on change. QuantityStepper → Tap curve on +/−.
- **Components touched:** Hero block (local), `Price` (use `Type.priceLarge` variant), `QuantityStepper` (retone, add haptic), `Button` (sticky CTA bar). Strike-through was-price retoned per A7.

### B4. Flash Deals (`src/screens/ResultScreen.tsx` — `Result` route)

- **Highest impact:** Switch grid card to 4:5 image, brand label (mono), product name (sans 2-line clamp), price (serif), was-price (mono caption strike). Remove red corner chips → ember `-N%` at top-left.
- **Hierarchy:** Image > brand label > name > price line. 12px between blocks inside the card.
- **Interaction:** Card press → scale 0.98 + Light haptic, then Settle into ProductScreen. Skeleton matches card shape on load.
- **Components touched:** `ProductCard.tsx` — primary refactor. Re-use across Home Flash Deals rail.

### B5. Wishlist (`src/screens/WishlistScreen.tsx`)

- **Highest impact:** Single-column editorial list (full-width 16:10 image + meta below), not a 2-up grid. Premium retail apps treat the wishlist as a curated reading list, not a grid.
- **Hierarchy:** Header (`SAVED ITEMS / N pieces`) keep. Each row: image > brand label > name > price > remove (icon-only, ink3).
- **Interaction:** Swipe-left to remove (220ms slide-out + Settle), with undo toast 4s. Heart icon on each row, filled in ink (not red). Tap row → Product.
- **Components touched:** `WishlistCard` (new — `components/ui/`), `EmptyState` (already covers). Wishlist endpoints remain mock (P2-04 deferred).

### B6. Cart (`src/screens/CartScreen.tsx`)

- **Highest impact:** Split layout — items area on `surface`, **summary panel on `surfaceDeep`** (currently on full ink-black). Total in `Type.priceLarge` serif. Keep dark CTA but as part of `surfaceDeep` panel, not a black overlay.
- **Hierarchy:** Header (`YOUR BAG / N items`) keep. Item row: 88×110 image (4:5) > brand label > name > variant > stepper + price column. Hairline dividers between items, not rounded cards.
- **Interaction:** Quantity stepper — Tap haptic, optimistic update unchanged. **P1-02 fix bundled:** loop server call `|delta|` times OR add a `setQuantity` endpoint (coordinate). Swipe-left to remove with undo toast.
- **Components touched:** `CartItem.js` — migrate to `CartItem.tsx` (P2-03), use new visual rhythm. `Price` (`Type.priceLarge` for total). `Button` (CTA).

### B7. Checkout / Address (`src/screens/AddressScreen.tsx`)

- **Highest impact:** Saved addresses become full-width selectable rows separated by hairlines (not rounded cards). Active address: 2px ink left-bar + bold name. Form below with floating labels (same `FloatingLabelInput` as Login).
- **Hierarchy:** Header > Saved Addresses (list) > Add New Address (collapsed by default, expands on tap) > sticky `Place Order` CTA bar at bottom.
- **Interaction:** Tap row → Light haptic + radio fills. Address-form expand → Settle. P2-06 fix bundled: remove `CustomerProfileCode` from visible labels.
- **Components touched:** `FloatingLabelInput`, `Button` (sticky bar), `RadioRow` (new — `components/ui/`).
- **Missing `ErrorState` for fetch failure — add it.**

### B8. Order Success (`src/screens/OrderSuccessScreen.tsx`)

- **Highest impact:** Replace plain `✓` with `Animated` SVG checkmark — drawn on the Carry curve over an ember-tinted circle. 700ms hold before CTAs appear.
- **Hierarchy:** Mark > Headline (`Order placed.`) > Order number row (mono, monospace digits, no quote marks around id) > body copy > primary CTA `View My Orders` > secondary `Continue Shopping`.
- **Interaction:** Mark draw + Success haptic at completion. CTAs fade up Settle. **Disable hardware back button** for the first 1200ms so the moment lands.
- **Components touched:** New `AnimatedCheckmark.tsx` (`components/ui/`). `Button` (primary + secondary variants). Existing screen layout otherwise.

### B9. Orders (`src/screens/OrderHistoryScreen.tsx`)

- **Highest impact:** Each card → hairline-separated list row, not nested rounded box. Status chip → `StatusBadge` retoned: ember dot for confirmed/shipped, ink for delivered, danger desaturated for cancelled.
- **Hierarchy:** Header (`YOUR ORDERS / N orders`) keep. Row: 64×80 thumbnail (4:5) > brand label > name (1-line clamp) > order# + date (mono `Type.caption`) > price (serif right-aligned) + status badge below.
- **Interaction:** Row tap → press scale + Settle into OrderDetails. Pull-to-refresh with shimmer on header.
- **Components touched:** `OrderRow` (new — `components/ui/`), `StatusBadge` (retone).

### B10. Order Details (`src/screens/OrderDetailScreen.tsx`)

- **Highest impact:** Two-section flat layout — Order section + Delivery section. Sections introduced by `Type.title` headers with 32px above. Inside each section: hairline-separated rows (`Label: value` becomes `Label` left, `value` right, both on baseline). No nested cards.
- **Hierarchy:** Product summary header (image + name) > Order rows (Brand/Variant/Quantity/Amount/Status/Date) > Delivery rows.
- **Interaction:** Tap product header → opens ProductScreen. Status row: animated dot if in-flight (shipped/processing) — pulse on Tap curve, infinite.
- **Components touched:** `DetailRow` (new — `components/ui/`). `StatusBadge` reused. SafeAreaView fix bundled (replaces `StatusBar.currentHeight` hack — audit known issue).

### B11. Profile (`src/screens/ProfileScreen.tsx`)

- **Highest impact:** Strip card containers. Information becomes a typographic column on `surface`, with hairline rows. Section labels (`ACCOUNT`, `ADDRESS`, `ACTIVITY`) in `Type.label` mono.
- **Hierarchy:** Header (dark, with name in serif + email caption) keep. Sections in flat hairline list. Log out row stays red, bottom-anchored.
- **Interaction:** Row press → Light haptic + Settle into target screen. **P1-04 fix bundled:** correct route name to `Orders` not `OrderScreen`.
- **Components touched:** `ProfileRow` (new — `components/ui/`). Reuse `BottomNavBar`.

### B12. ProductCard (`src/components/ProductCard.tsx`) — global

Used by Home Flash Deals, ResultScreen, WishlistScreen (potentially). Single refactor benefits 3 screens.

- 4:5 image area, `surfaceDeep` background.
- Discount badge (top-left): ember dot + mono `-N%`.
- Below image: brand label (mono, `ink3`, `Type.label`) → name (sans, 2-line clamp, `Type.heading` reduced) → price line.
- Price line: current `Type.price` serif, was-price `Type.caption` mono strike inline 8px gap.
- Press: scale 0.98 + Light.

### B13. Loading / Empty / Error states — global

- **Loading:** shimmer skeleton matching the loaded layout — never a generic block.
- **Empty:** `EmptyState` with serif headline + sans body + optional ghost CTA. Headlines should read like editorial: `Nothing saved yet.`, `No orders yet — once you place one, it lives here.`
- **Error:** `ErrorState` with serif title (`Something didn't load`), sans body (`Pull to retry, or tap below.`), single primary retry button. No icon stack — one quiet mark only.
- **Form errors:** inline caption beneath field, `danger` tone, fade-in Tap.

---

## PART C — COMPONENT TOUCH MATRIX

| Component | Action | Phase |
|---|---|---|
| `tokens.ts` | Add `surface`/`surfaceSoft`/`surfaceDeep`/`rule`/`ink2-4`; retone `accent`, `danger` | 1 |
| `typography.ts` | Add roles `display`/`title`/`heading`/`price`/`priceLarge`/`label`/`tab`; load serif font | 1 |
| `Button.tsx` | Press scale 0.98 + Light haptic; adopt `Type.bodyStrong` label | 1 |
| `Price.tsx` | Add `size: 'sm' \| 'base' \| 'lg' \| 'xl'` variants mapped to serif tokens | 1 |
| `Skeleton.tsx` | Replace opacity pulse with linear shimmer | 1 |
| `BottomNavBar.tsx` | Underline-active state, haptic on tab change, badge retone | 1 |
| `ScreenHeader.tsx` | Hairline seam, serif title | 1 |
| `StatusBadge.tsx` | Ember-dot + ink palette retone | 1 |
| `EmptyState.tsx` | Serif headline pattern | 1 |
| `ErrorState.tsx` | Quiet mark + serif title | 1 |
| `ErrorBanner.tsx` | Adopt `surfaceDeep` background, ink text | 1 |
| `ProductCard.tsx` | Full refactor per B12 | 2 |
| `QuantityStepper.tsx` | Tap haptic + scale | 2 |
| `useHaptic.ts` | **NEW** — wraps `react-native-haptic-feedback` | 1 |
| `useTactile.ts` | **NEW** — press-scale animator | 1 |
| `FloatingLabelInput.tsx` | **NEW** — `components/ui/` | 2 |
| `RadioRow.tsx` | **NEW** — `components/ui/` | 2 |
| `CategoryRail.tsx` | **NEW** — `components/ui/` | 2 |
| `AnimatedCheckmark.tsx` | **NEW** — `components/ui/` | 2 |
| `WishlistCard.tsx` | **NEW** — `components/ui/` | 3 |
| `OrderRow.tsx` | **NEW** — `components/ui/` | 3 |
| `DetailRow.tsx` | **NEW** — `components/ui/` | 3 |
| `ProfileRow.tsx` | **NEW** — `components/ui/` | 3 |
| `CartItem.tsx` | Migrate from `.js`, restyle (bundles P2-03) | 2 |

---

## PART D — IMPLEMENTATION SEQUENCING

### Phase 1 — Foundation (≈1 week)

Goal: token + global components updated so every screen inherits the new register at once.

1. Extend `tokens.ts` with surface/ink/rule/accent retone.
2. Load chosen serif font (one weight, regular). Extend `typography.ts` with new role presets.
3. Add `useHaptic` and `useTactile` hooks.
4. Update global components: `Button`, `Skeleton`, `BottomNavBar`, `ScreenHeader`, `StatusBadge`, `EmptyState`, `ErrorState`, `ErrorBanner`, `Price`.
5. Migrate HomeScreen from `useState`/`useEffect` → `useAsyncState` (P1-03).
6. Lift `fetchCartCount` into `App.tsx` post-auth (P1-01).
7. Fix `ProfileScreen` route name to `Orders` (P1-04).

Acceptance: All 11 screens render with the new tokens, no layout regression, all existing behavior preserved.

### Phase 2 — Signature moments (≈2 weeks)

Goal: high-emotion screens get their dedicated treatment.

1. **Login** — full redesign per B1 + A8. Remove WebView SVG (P1-06).
2. **Home** — hero rebuild + category rail + Flash Deals card refactor per B2.
3. **ProductScreen** — image-as-page + sticky CTA bar per B3.
4. **OrderSuccessScreen** — animated checkmark per B8.
5. New components: `FloatingLabelInput`, `CategoryRail`, `AnimatedCheckmark`, refactored `ProductCard`.
6. Cart quantity multi-unit fix coordinated (P1-02).

Acceptance: Login, Home, Product, Success feel premium end-to-end with new motion language. Other screens unchanged but inherit Phase 1 tokens.

### Phase 3 — Atmosphere across the rest (≈2–3 weeks)

Goal: same vocabulary applied to remaining flows.

1. **Cart** — split surfaces + CartItem.tsx migration + swipe-to-remove.
2. **Address** — list rows + floating labels + missing `ErrorState`.
3. **Orders** — `OrderRow` + retoned `StatusBadge`.
4. **OrderDetails** — flat `DetailRow` layout + SafeAreaView fix.
5. **Wishlist** — single-column editorial list, `WishlistCard`.
6. **Profile** — flat hairline `ProfileRow`.
7. All empty/error states retoned per B13.

Acceptance: every screen reads from the same vocabulary. Audit's P1/P2 visual debt closed.

---

## PART E — EXPLICIT NON-GOALS

Do not, in this work:
- Introduce Redux, Zustand, React Query, or any state library.
- Replace `useAsyncState` or `useEntrance`.
- Convert `.js` files to `.ts` except where listed (`CartItem.tsx` only).
- Change navigation topology, route names beyond P1-04, or initial route.
- Add icon library or replace `react-native-vector-icons`.
- Introduce a motion framework — RN `Animated` API only.
- Add a global error boundary that swallows per-screen error handling.
- Open the wishlist real-endpoint scope (P2-04).
- Modify the API mock/real router or `services.ts`.

---

## PART F — REVIEW HOOKS

A change ships only if it can answer:

1. Which **principle** (A1) does this advance?
2. Which **token** (A2/A3) does it bind to — no hardcoded values.
3. Which **curve** (A4) governs its motion — no ad-hoc durations.
4. Does the **fallback state** (loading / error / empty) match A5 and B13?
5. Did we **remove** something (decoration, shadow, color, badge) — or only add?
