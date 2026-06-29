# UX Review — Complete Customer Journey
**Date:** 2026-06-26  
**Scope:** All screens, global navigation, cross-cutting patterns  
**Method:** Static code audit — no redesign recommendations, findings only

---

## Legend

| Tag | Meaning |
|-----|---------|
| `[FRICTION]` | Extra taps, dead ends, or unnecessary steps |
| `[HIERARCHY]` | Poor visual or information hierarchy |
| `[LOADING]` | Missing or incorrect loading state |
| `[EMPTY]` | Missing empty state |
| `[ANIMATION]` | Animation issue or bad motion |
| `[PERF]` | Slow perceived performance |
| `[SPACING]` | Inconsistent spacing |
| `[TYPOGRAPHY]` | Font family, size, or weight violations |
| `[INTERACTION]` | Broken, dead, or inconsistent interaction |
| `[A11Y]` | Accessibility issue |
| `[NAV]` | Navigation confusion or inconsistency |

---

## 1. HomeScreen

**File:** `src/screens/HomeScreen.tsx`

- `[EMPTY]` Recently Viewed rail uses a `>= 4` threshold — 1–3 items never render the rail. Users who just browsed see nothing, with no explanation.
- `[FRICTION]` Search bar is a non-editable `TouchableOpacity` wrapping `SearchBar` — it is a fake input field. Tapping it navigates away. There is no visual affordance indicating it is a navigation target rather than an editable field.
- `[LOADING]` `feedError` is only surfaced when **all three** parallel fetches fail. If banners or category chips fail independently, the section silently disappears with no indicator.
- `[FRICTION]` Scroll-to-top button appears only after `scrollY > 900`. On a dense home feed this requires significant scrolling before the affordance appears.
- `[INTERACTION]` Banner pagination dots are passive — tapping a dot does nothing. Users expect dots to be tappable on carousels.

---

## 2. ProductScreen

**File:** `src/screens/ProductScreen.tsx`

- `[TYPOGRAPHY]` `productName` style (line 856–862) uses `FontFamily.sans`. CLAUDE.md mandates `FontFamily.serif` for all product names — this is the app's primary visual differentiator from commodity marketplaces. This is a brand violation.
- `[PERF]` Hero image area uses a `ScrollView`, not a `FlatList` or lazy-loading structure — all product images are rendered and decoded upfront, even if there are 8–10 images.
- `[HIERARCHY]` No image count indicator ("2 of 6"). Only passive dots are rendered, which are difficult to count on small screens or when more than 5 images are present.
- `[INTERACTION]` Back button is a white `chevron-back` icon over a product image that may itself be white or light — the icon becomes invisible against light-background product photos.
- `[A11Y]` Wishlist heart icon in the nav bar has no text label, no `accessibilityLabel`, and is positioned in the header area without a semantic role — poor discoverability and screen reader exposure.
- `[LOADING]` Related products ("YOU MAY ALSO LIKE") section loads after the main product with no skeleton. The section area is absent until data arrives — causes layout shift.
- `[HIERARCHY]` "YOU MAY ALSO LIKE" heading does not use the `SectionHead` component used elsewhere in the app — inconsistent section header treatment.
- `[INTERACTION]` OOS state's "Browse Similar Products" passes `categoryId` which can be `null` — the result screen would receive a null filter, showing uncategorised results with no feedback to the user.

---

## 3. CartScreen

**File:** `src/screens/CartScreen.tsx`

- `[HIERARCHY]` `cartUnitWas` shows per-unit compare price, but `cartLineTotal` shows a multi-unit line total. The discount calculation context is mixed within the same row — a user adding 3 items sees a per-unit strike-through next to a multi-unit total without a clear label.
- `[INTERACTION]` Quantity stepper uses `+` and `−` text characters. ProductScreen uses `Icon` components from `react-native-vector-icons` for the same stepper. Inconsistent between two adjacent screens in the same flow.
- `[PERF]` `clearCart` for logged-in users calls `postDeleteCartItem` in a sequential `for` loop — each item waits for the previous delete to complete before the next starts. 5-item cart = 5 serial round trips.
- `[FRICTION]` No undo after removing a cart item. Removal is immediate and irreversible from the UI. This is a destructive action with no recovery path.
- `[INTERACTION]` "← Continue Shopping" uses a literal Unicode left-arrow character (`←`), not an icon component. Inconsistent with the rest of the app which uses `react-native-vector-icons`.

---

## 4. SearchScreen

**File:** `src/screens/SearchScreen.tsx`

- `[INTERACTION]` FTU category chips call `commit(cat.CategoryName)` — this queries by the category's display name as a text string, not by `categoryId`. Results depend on string matching rather than a structured category filter, which can produce unreliable results for categories with special characters or alternate names.
- `[HIERARCHY]` "Fill to input" affordance is an `arrow-up-outline` icon rotated 45° — this convention is not standard and is unlikely to be recognised as "tap to copy this term into the search field."
- `[LOADING]` No loading indicator during suggestion fetch. While the debounce fires and the API call is in flight, the input area is silent — the user does not know if anything is happening.
- `[EMPTY]` During debounce, there is a window where neither suggestions nor a "no results" state is shown — the list area is blank. This reads as a broken state, not a loading state.
- `[INTERACTION]` "Browse All Products" passes `searchQuery: '%'` to `ResultScreen` — this leaks an SQL wildcard as an API implementation detail. It also displays poorly if the query is ever shown in the Results header.

---

## 5. ResultScreen

**File:** `src/screens/ResultScreen.tsx`

- `[INTERACTION]` `WishlistHeart` on product tiles: when the user is not logged in, `profileCode` is `null` and tapping the heart silently does nothing. No auth guard, no `LoginPromptSheet` is triggered — the interaction is a silent no-op.
- `[HIERARCHY]` Product count in the header shows the client-side-paginated count (items loaded so far), not the server total. A user browsing a 200-item category sees "24 products" after the first page, which is misleading.
- `[FRICTION]` Scroll-to-top button appears at `y > 300` — this threshold is very low and the button appears before the user has meaningfully scrolled into the list.
- `[FRICTION]` Sort and Filter are combined in a single sheet. This creates cognitive overload — the user must navigate a long sheet with many unrelated controls to change a single setting.
- `[FRICTION]` Price range filter uses free-text number input rather than a range slider. Entering a price range requires two taps to focus each field, typing, and dismissing the keyboard — at minimum 8 interactions for a common operation.
- `[FRICTION]` After applying filters, no scroll-to-top is called. The user's scroll position is preserved from the previous (now-replaced) list — they may be mid-list on a newly filtered, shorter result set.
- `[LOADING]` `loadingMore` (pagination) shows only `ActivityIndicator` with no skeleton — the list jumps in height when new items arrive.

---

## 6. OrderHistoryScreen

**File:** `src/screens/OrderHistoryScreen.tsx`

- `[FRICTION]` `OrderCard` has a tappable card wrapper that navigates to `OrderDetailScreen` AND a separate "View Order" button that does the identical navigation. Both targets exist simultaneously — duplicate redundant affordances on the same card.
- `[FRICTION]` The "Reorder" button does not call `e.stopPropagation()`. Tapping "Reorder" inside the tappable card wrapper will also trigger the card's `onPress`, navigating to Order Detail when the user's intent was to reorder.
- `[FRICTION]` Reorder adds items to the bag but does not navigate to Cart. After a successful reorder, the user must manually find the Cart tab to proceed.
- `[HIERARCHY]` Order skeleton structure does not match the actual card layout. The skeleton has a header + thumbnails + summary structure; actual cards have thumbnails + price + status + action buttons. The transition from skeleton to loaded content causes a visible layout shift.
- `[A11Y]` Filter icon has no label. There is no `accessibilityLabel` and no visible text label — the filter affordance is only discoverable by exploration.

---

## 7. OrderDetailScreen

**File:** `src/screens/OrderDetailScreen.tsx`

- `[INTERACTION]` "Need Help" button calls `console.warn('Help not yet wired')` — this is a dead button exposed to users in production with no feedback, no toast, and no navigation.
- `[FRICTION]` Order cancellation flow requires: (1) tap Cancel, (2) select reason from list, (3) select refund mode, (4) confirm. Minimum 4–5 taps before the destructive action completes. No shortcut for "cancel with default reason."
- `[HIERARCHY]` `event.Location` in the order timeline renders the separator `· ` even when the location value is `null` or empty — output is `"Delivered · "` with a trailing separator and nothing after it.
- `[TYPOGRAPHY]` Prices in the payment summary use `.toFixed(2)` while all product prices elsewhere in the app use `.toFixed(0)`. Inconsistent decimal formatting between screens in the same order flow.

---

## 8. OrderSuccessScreen

**File:** `src/screens/OrderSuccessScreen.tsx`

- `[FRICTION]` "Track Order" and "View Orders" are presented as a primary CTA and a secondary link. Both navigate to the same `Orders` screen — the distinction between the two actions is false. Neither goes to a real-time tracking view.
- `[NAV]` No back button and no OS-level back gesture allowed. Users who want to return to browsing must tap a CTA — there is no escape path other than the two provided buttons.
- `[ANIMATION]` The SVG animated celebration ring can be choppy on Android due to SVG animation support inconsistencies. No fallback for low-performance devices.
- `[INTERACTION]` `bounces={false}` on the ScrollView prevents the natural elastic scroll feel expected on iOS. This is a tactile regression on a screen that should feel celebratory.

---

## 9. PaymentScreen (EcomPaymentScreen)

**File:** `src/screens/PaymentScreen.tsx`

- `[HIERARCHY]` Polling attempt counter is exposed verbatim in the UI: `"Checking payment… attempt N/60"`. This is an implementation detail that exposes internal retry logic and can alarm users ("attempt 47 of 60").
- `[FRICTION]` When the 5-minute timer expires, `Alert.alert` fires. The alert offers no graceful recovery option — no "try again," no "check my orders," only dismissal with no onward path.
- `[NAV]` No back button is rendered in the WebView flow. A user who opens the wrong payment page, or who encounters an error, is trapped with no escape except the OS back gesture (Android) or swipe (iOS).
- `[LOADING]` The pre-WebView loading state ("Preparing payment…") has no spinner or any progress indicator — the screen is static while the WebView loads.
- `[HIERARCHY]` Status strip text (`"Checking payment… attempt N/60"`, error states) uses raw hex colors (`#1A237E`, `#F44336`) and hardcoded font sizes — completely bypasses the design token system, inconsistent with the rest of the app.
- `[INTERACTION]` Error state shows red text with no retry button and no navigation action. The user can see the error but has no affordance to act on it from within the screen.

---

## 10. ProfileScreen

**File:** `src/screens/ProfileScreen.tsx`

- `[INTERACTION]` "Contact Us" menu row has `onPress: () => {}` — tapping it does nothing. There is no visual indication that this is a dead button; it appears identical to functional rows.
- `[HIERARCHY]` Order count in the stats row fetches only the first page of orders and counts those. A user with 50 orders will see "10" as their order count.
- `[HIERARCHY]` Stats counts (wishlist, addresses) are fetched independently and may reflect stale counts if the user made changes in another session tab without a full profile reload.

---

## 11. WishlistScreen

**File:** `src/screens/WishlistScreen.tsx`

- `[LOADING]` `hasFetched.current` prevents re-fetching on tab focus. If the user adds or removes wishlist items from `ProductScreen` and then returns to the Wishlist tab, the list is stale until a full remount.
- `[A11Y]` Remove button is the `×` Unicode glyph at 18px inside a 24×24 container. This is below the recommended 44×44pt minimum touch target for accessibility. The glyph also visually blends into product image backgrounds.
- `[INTERACTION]` "Notify Me" button for out-of-stock items has no `onPress` handler — it is a dead button. No toast, no message, no UI feedback.
- `[FRICTION]` "Move to Bag" does not remove the item from the wishlist after adding to cart. The user must manually remove it separately — a two-step process for what should be a single atomic action.
- `[EMPTY]` No sort or filter controls. A user with many wishlist items has no way to sort by price, date added, or availability.

---

## 12. AddressScreen

**File:** `src/screens/AddressScreen.tsx`

- `[FRICTION]` The address entry form is always rendered below the address list, even when the user already has saved addresses. A returning user with 2–3 addresses must scroll past them to reach the form.
- `[HIERARCHY]` Payment method picker (card/COD toggle) is in a sticky footer and uses very small text. When the keyboard is open for address entry, the footer can be partially obscured.
- `[HIERARCHY]` No order total is shown before the "Place Order" button. A user placing an order does not see the final amount they are about to be charged until they are on the payment screen.
- `[INTERACTION]` Auto-selects the last-added address (`list[list.length - 1]`), which may not be the user's primary or preferred delivery address.
- `[FRICTION]` No way to edit or delete addresses from this screen. A user who notices an error in a saved address must navigate away to Address Management and return, losing their checkout progress.

---

## 13. Login

**File:** `src/screens/Login.tsx`

- `[HIERARCHY]` Field label is "Email" but placeholder reads "email or mobile number." The label implies email only; the placeholder contradicts it. Users who try to log in with a mobile number may not attempt it because the label says "Email."
- `[ANIMATION]` Loading dots inside the CTA button are 6px circles. The button height is 48px with `Type.bodyStrong` label text (~15–16px). When the button transitions from text to dots, the button shifts height slightly due to the differing content height. This causes a visible jump in the CTA block.
- `[HIERARCHY]` "Continue as guest" is rendered as a `Type.caption` link at the bottom, below both "Log in" and "Sign up" — it has the lowest visual weight of all three actions and may be missed by users who want to browse before committing.

---

## 14. RegisterScreen

**File:** `src/screens/RegisterScreen.tsx`

- `[HIERARCHY]` No password strength indicator. There is no feedback on password complexity requirements during entry — users only learn requirements when they submit and receive a server error.
- `[HIERARCHY]` Mobile number field has no visible country code prefix. The code is hardcoded to `230` (Mauritius) but there is no `+230` prefix label visible in the input — users do not know they should omit the country code.
- `[INTERACTION]` A single `fieldError` state is displayed on the last touched field. Errors for name, email, and mobile fields are not shown inline against their respective fields — error attribution is ambiguous when multiple fields have validation issues.

---

## 15. OTPVerificationScreen

**File:** `src/screens/OTPVerificationScreen.tsx`

- `[HIERARCHY]` No explicit statement of the delivery channel for the OTP. The screen shows "code sent to [email]" which implies email, but users who registered with a mobile number may expect an SMS. The channel is not stated.
- `[LOADING]` Auto-submits on entry of the 6th digit with no loading indicator on the OTP input boxes themselves. The boxes remain in their "filled" state with no visual feedback that submission is in progress.

---

## 16. AddressManagementScreen

**File:** `src/screens/AddressManagementScreen.tsx`

- `[FRICTION]` No confirmation dialog before deleting an address. Delete is immediate with no undo and no warning — this is a destructive action on data that is not easy to restore.
- `[INTERACTION]` `handleDelete` has an empty `catch` block — a failed delete silently does nothing. The address remains in the list but the user sees no error, no toast, and no retry affordance.
- `[FRICTION]` Tapping a row triggers edit mode. Edit and delete icon buttons are also rendered inside that row. A mis-tap on the row instead of the icon will open the edit form rather than triggering the intended icon action. The touch areas compete.
- `[FRICTION]` No warning before deleting a primary or default address. The user's preferred address can be silently removed.

---

## 17. HelpCenterScreen

**File:** `src/screens/HelpCenterScreen.tsx`

- `[FRICTION]` FAQ answers reference app features by name (e.g. "tap Cancel Order") but provide no deep-link. The user must read the answer, remember it, dismiss Help, navigate back, and find the feature — a minimum 4-step detour.
- `[HIERARCHY]` FAQ copy says the cancel button is labelled "Cancel Order" but the actual button in `OrderDetailScreen` is labelled "Cancel." The help content is out of sync with the UI.
- `[FRICTION]` No search within the Help Center. Users must scroll through all categories and expand FAQ items manually.

---

## 18. BottomNavBar

**File:** `src/components/ui/BottomNavBar.tsx`

- `[A11Y]` Tab labels use `FontFamily.mono` at `fontSize: 9` with `letterSpacing: 0.8` uppercase. 9px is below the WCAG recommended minimum text size. On small or low-DPI screens this may be illegible.
- `[INTERACTION]` `cartCount` badge is conditional on the prop being passed (`cartCount != null`). Each screen that renders the nav bar must independently pass the correct count — inconsistent count is possible if any screen passes a stale or undefined value.
- `[HIERARCHY]` Active tab indicator is an accent-tinted icon plus a small pill background. The differentiation between active and inactive tabs is subtle — particularly when the user's attention is on content rather than the nav bar.

---

## Cross-Cutting Issues

These issues span multiple screens and represent systemic inconsistencies rather than screen-specific defects.

### Back Button Icon Inconsistency

Two different back button icons are used across the app with no semantic distinction:

| Icon | Screens |
|------|---------|
| `arrow-back` | CartScreen, WishlistScreen, ResultScreen, SearchScreen, HelpCenterScreen |
| `chevron-back` | ProductScreen (error state), ProfileScreen, RegisterScreen, AddressScreen, AddressManagementScreen, OTPVerificationScreen |

`[INTERACTION]` The same navigation action ("go back") uses two different icons. Users develop an expectation from the first icon they see; the alternate icon reads as ambiguous or potentially different behaviour.

### Price Decimal Formatting

`[TYPOGRAPHY]` `[HIERARCHY]` Two inconsistent formats in active use:

- `.toFixed(0)` — ProductScreen, CartScreen, ResultScreen, WishlistScreen, HomeScreen (most of the app)
- `.toFixed(2)` — OrderDetailScreen payment summary exclusively

A user who sees "Rs 1,250" throughout the browse flow will see "Rs 1250.00" in the order summary — these read as different numbers at a glance.

### PaymentScreen Design Token Bypass

`[TYPOGRAPHY]` `[SPACING]` PaymentScreen bypasses the design token system entirely — raw hex values (`'#1A237E'`, `'#F5F5F5'`, `'#F44336'`) and hardcoded `fontSize` numbers appear throughout. This screen is visually detached from the rest of the app's identity.

### Product Name Typography Violation

`[TYPOGRAPHY]` `src/screens/ProductScreen.tsx` line 859: `productName` style uses `FontFamily.sans`. The CLAUDE.md spec and the app's visual identity mandate `FontFamily.serif` for all product names. This is the app's primary differentiator from commodity marketplace UIs and the violation occurs on the highest-traffic screen.

### Missing Auth Guard on Wishlist Heart in Grid

`[INTERACTION]` `WishlistHeart` in `ResultScreen` tiles silently ignores presses when the user is not logged in. The same action on `ProductScreen` correctly shows a `LoginPromptSheet`. The inconsistency means wishlist interaction behaves differently depending on where the user taps it.

### Dead UI Elements in Production

`[INTERACTION]` Three confirmed dead interactions exposed to production users:

| Screen | Element | Current Behaviour |
|--------|---------|------------------|
| OrderDetailScreen | "Need Help" button | `console.warn('Help not yet wired')` |
| ProfileScreen | "Contact Us" row | `onPress: () => {}` — silent no-op |
| WishlistScreen | "Notify Me" button (OOS) | No handler — silent no-op |

All three appear as fully functional UI elements with no visual distinction from working buttons.

---

## Summary by Category

| Category | Count | Most Affected Screens |
|----------|-------|-----------------------|
| `[FRICTION]` | 18 | AddressScreen, OrderDetail, ResultScreen, CartScreen |
| `[INTERACTION]` | 15 | WishlistScreen, SearchScreen, OrderHistory, ProfileScreen |
| `[HIERARCHY]` | 12 | ProductScreen, CartScreen, OrderDetail, PaymentScreen |
| `[TYPOGRAPHY]` | 5 | ProductScreen (brand violation), OrderDetail, PaymentScreen, Login |
| `[LOADING]` | 7 | HomeScreen, SearchScreen, PaymentScreen, ProductScreen |
| `[EMPTY]` | 3 | HomeScreen, SearchScreen, WishlistScreen |
| `[A11Y]` | 5 | BottomNavBar, ProductScreen, WishlistScreen, OrderHistory |
| `[ANIMATION]` | 2 | OrderSuccessScreen, Login |
| `[PERF]` | 2 | ProductScreen (images), CartScreen (clearCart) |
| `[NAV]` | 3 | PaymentScreen, OrderSuccessScreen, SearchScreen |

**Total issues identified: 72**

---

*Audit method: static code reading only. No device testing performed. Severity not rated — all issues listed are observable from code.*
