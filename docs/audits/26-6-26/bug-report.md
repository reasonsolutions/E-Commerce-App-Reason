# Bug Report — QA Pass (React Native E-Commerce App)

Scope: all screens (`src/screens/`), shared UI (`src/components/`), hooks, context, navigation, and the Axios/auth layer. Every finding below was verified by reading the actual code path — items that looked suspicious but turned out to be correctly handled are listed at the end of each section as "checked, not a bug" so they aren't re-investigated later.

Severity legend: **High** = crash, duplicate order/payment, data loss, or stuck state. **Medium** = incorrect state shown to user, recoverable. **Low** = latent/edge-case, not reachable today but fragile.

---

## 1. Checkout & Payment (highest risk — real money/orders)

### 1.1 [High] Hardcoded `customerProfileCode` sent to payment gateway
**File:** `src/screens/PaymentScreen.tsx:167`
```js
customerProfileCode: 136636, //profileCode
```
The real `profileCode` passed via route params is ignored; every user's MIPS `loadPaymentZone` call reports the same hardcoded test profile code to the payment gateway.
**Repro:** Place any card order as any account → inspect the `loadPaymentZone` request payload → `customerProfileCode` is always `136636` regardless of who's logged in.
**Impact:** Payment gateway reconciliation/analytics is wrong for every transaction.

### 1.2 [High] No back-navigation guard after a completed order
**File:** `src/screens/OrderSuccessScreen.tsx` (whole file), `src/screens/PaymentScreen.tsx:437`, `src/navigation/AppNavigator.js:46-56`
`finaliseOrder` calls `navigation.navigate('OrderSuccess', …)` — a normal push, not `navigation.reset`. `OrderSuccessScreen` never resets the stack or installs a `BackHandler`. `gestureEnabled` is not disabled for `OrderSuccess` or `EcomPayment` in the navigator config.
**Repro:** Complete an order → on the success screen, press Android hardware back (or iOS swipe-back) → lands back on the stale `PaymentScreen`/WebView for the already-completed order → back again → lands on `AddressScreen` with the original (already-ordered) cart items still in route params, inviting a second purchase attempt.

### 1.3 [Medium] No `BackHandler`/disabled gesture on the payment screen despite an explicit warning
**File:** `src/screens/PaymentScreen.tsx:490-493`
The screen displays "Do not press the back button or close this screen" but enforces nothing — no `BackHandler` listener, no `gestureEnabled: false` in the navigator. Backing out mid-transaction leaves the polling/timer state torn down client-side while the transaction may still complete on the gateway, with the app never calling `finaliseOrder`.
**Repro:** Start a card payment, get redirected to the bank's page, then swipe back (iOS) or press back (Android) before the poll resolves → app returns to `AddressScreen`; if the bank later approves the transaction, the order is never finalized client-side.

### 1.4 [Low] `selectedAddr!` non-null assertion can crash `PaymentScreen`
**File:** `src/screens/AddressScreen.tsx:284-297`, consumed at `src/screens/PaymentScreen.tsx:146`
`selectedAddr` is force-unwrapped after a `.find()` against `selectedAddressCode`. If the address list is mid-refetch or the selected address was deleted elsewhere, `selectedAddr` is `undefined`, and `PaymentScreen` crashes on `selectedAddress.OrderDeliveryAddressCode`.
**Repro:** Select an address, delete it from another session/tab before tapping "Place Order", tap "Place Order" → crash on `PaymentScreen` mount.

### 1.5 [Medium] `cancelTarget.SubOrder.Code` accessed without a null guard
**File:** `src/screens/OrderDetailScreen.tsx:417-420`
`handleConfirmCancel` checks `!cancelTarget` but not `cancelTarget.SubOrder`. Other fields in this screen are treated as nullable (`Events ?? []`, etc.) but this one isn't.
**Repro:** Open order detail for an order/item whose DTO lacks a `SubOrder` field (e.g. certain legacy/state combinations) → tap "Confirm Cancellation" → `Cannot read properties of undefined (reading 'Code')` crash.

### 1.6 [Low/speculative] `ResultScreen` destructures `route.params` without a guard
**File:** `src/screens/ResultScreen.tsx`
`const { categoryId, brandId, ... } = route.params as {...}` has no fallback for `route.params` being `undefined`. No current call site omits params, so this is latent, not observed — but it's a one-line `navigation.navigate('Result')` away from crashing.

**Checked, not a bug:** double-order submission is correctly blocked in `AddressScreen.buyProducts` via `orderSubmitting` guard (`AddressScreen.tsx:256-301`); `PaymentScreen`'s polling/countdown timers are cleaned up correctly; duplicate `finaliseOrder` calls across refocus are prevented by instance-scoped refs; `OrderHistoryScreen` correctly mutex's refresh vs. load-more via `fetchingRef`; `HelpCenterScreen` has no external links at all (static FAQ content) so the suspected "unguarded Linking.openURL" issue doesn't apply here.

---

## 2. Shopping Flow (Home / Product / Search / Cart / Wishlist)

### 2.1 [High] Search-as-you-type: out-of-order responses overwrite newer results
**File:** `src/screens/SearchScreen.tsx:66-100`
`fetchSuggestions` has no request-id or "is this still the current query" check before calling `setSuggestions`.
**Repro:** Type "sh", wait under 300ms, then type "shoe" before the first request resolves. If the "sh" response (larger result set, slower) lands after the "shoe" response, it overwrites the correct results with stale ones.
**Also:** the debounce timer isn't cleared on unmount — navigating away within the 300ms window still fires `fetchSuggestions`, calling `setSuggestions`/`setSearchError` on an unmounted screen.

### 2.2 [High] "Add to Cart" can be double-tapped into duplicate requests
**File:** `src/screens/ProductScreen.tsx:719-735`
```tsx
<PrimaryButton label="Add to Bag" loading={addingToCart} onPress={handleAddToCart} isDisabled={false} height={44} />
```
`isDisabled` is hardcoded `false`. `addingToCart` drives the spinner but never blocks re-entry into `handleAddToCart`.
**Repro:** Tap "Add to Bag" twice quickly → two `postSaveCartItems` calls fire, `cartCount` is double-incremented.

### 2.3 [Medium] Failed quantity-update can resurrect an item the user already deleted
**File:** `src/screens/CartScreen.tsx:363-377`
If a quantity-update PATCH for item A is in flight and the user taps "Remove" on item A before it resolves, and the PATCH then fails, the `catch` block calls `fetchCart()`, which can repopulate item A from the server if the DELETE hasn't landed yet (or also failed silently).
**Repro:** Tap quantity+ on an item, immediately tap Remove on the same item, force the quantity request to fail (e.g. flaky network) → the removed item reappears after the screen refetches.

### 2.4 [Medium] "Clear Bag" is non-atomic — partial failure leaves silently inconsistent state
**File:** `src/screens/CartScreen.tsx:409-429`
Items are deleted in a sequential `for` loop with one `await postDeleteCartItem(...)` per item. If item 3 of 5 fails, the `catch` falls back to `fetchCart()` — but items 1–2 are already gone server-side with no partial-success message ever shown to the user.
**Repro:** Have 5 cart items, simulate a network failure partway through "Clear Bag" → some items vanish, user gets a generic error with no indication of what actually happened.

### 2.5 [Medium] Wishlist heart toggle never removes the item server-side
**File:** `src/components/ui/WishlistHeart.tsx:35-37`
```js
setSaved(false); // removeFromWishlist requires WishlistCode — optimistic only
```
`removeFromWishlist(customerprofilecode, wishlistCode)` exists and is exported but is never called from this component.
**Repro:** Heart a product from a product card, then un-heart it from the same card → the heart icon shows unsaved, but opening the Wishlist screen still shows the item as saved — the un-save never reached the server.

### 2.6 [Medium] Wishlist screen doesn't render a refresh that returns empty
**File:** `src/screens/WishlistScreen.tsx:225-227`
```js
React.useEffect(() => {
  if (fetched && fetched.length > 0) setItems(fetched);
}, [fetched]);
```
A refetch that legitimately returns `[]` (e.g. wishlist cleared from another device) never syncs into `items` because of the `length > 0` guard.
**Repro:** Empty your wishlist from a second device/session, pull-to-refresh the Wishlist screen on this device → stale (already-deleted) items remain visible.

### 2.7 [Low/latent] `cartCount` quantity-update deltas lack a floor guard
**File:** `src/context/CartContext.js`, `src/screens/CartScreen.tsx:371,384`
`handleUpdateQuantity`/`handleUpdateGuestQuantity` do `setCartCount(prev => prev + delta)` with no `Math.max(0, …)`, unlike the remove handlers which do guard. Not reachable today since the stepper floors at 1, but inconsistent with the rest of the codebase's defensive pattern — a regression in the stepper's lower bound would silently produce a negative badge count.

**Checked, not a bug:** `HomeScreen`'s three parallel section fetches (categories/products/brands) fail independently and don't block each other; `CartScreen`'s primary remove-vs-update race is otherwise handled correctly (optimistic state layers on live `prev`, not a stale snapshot); `ProductScreen`'s quantity stepper is integer-only and properly bounded; `CategoriesScreen`'s count fetches are cancellation-guarded; variant/quantity state on `ProductScreen` doesn't need to reset between products because React Navigation pushes a new screen instance per `navigate('Product', …)` call (would become a real bug only if a future change switches to `setParams` reuse).

---

## 3. Auth & Account (Login / Register / OTP / Address / Profile)

### 3.1 [Medium] Address mutation refetch is not cancellation-safe, can race with focus refetch
**File:** `src/screens/AddressScreen.tsx:240`, `src/screens/AddressManagementScreen.tsx:214,232,249`
Mutation handlers call `run(async () => list)` without passing a `cancelled` ref, so they fall back to `useAsyncState`'s internal ref, which is never linked to the screen's `useFocusEffect` cleanup.
**Repro:** Edit an address on a slow connection, navigate away and back before the edit response lands (this re-triggers a fast focus refetch) → the slow edit response arrives afterward and overwrites the freshly fetched list, showing stale data.

### 3.2 [Medium] Address delete has no in-flight guard
**File:** `src/screens/AddressManagementScreen.tsx:245-253`
```js
const handleDelete = async (code: number) => {
  try { const response = await postDeleteDeliveryAddress(code); ... }
  catch {}
};
```
No `submitting` state disables the trash icon during the request, and the catch is empty.
**Repro:** Rapidly double-tap the delete icon on the same address row → two delete requests fire for the same address code; the second's failure is silently swallowed.

### 3.3 [Low] Address form accepts non-numeric phone/pincode via paste
**File:** `src/screens/AddressScreen.tsx:208-220`, `src/screens/AddressManagementScreen.tsx:159-171,205`
Validation only checks `.trim()` truthiness, not numeric format. `keyboardType="numeric"` blocks typed non-digits but not pasted text.
**Repro:** Paste "abc" into the mobile number field → validation passes → `Number(form.MobileNumber.trim())` evaluates to `NaN`, silently sent to the backend.

### 3.4 [Low] OTP auto-verify + manual tap can both pass the loading guard
**File:** `src/screens/OTPVerificationScreen.tsx:97-138`
Typing the 6th digit auto-calls `handleVerify`. The guard `if (code.length < OTP_LENGTH || loading) return;` reads `loading` from closure; tapping the now-enabled "Verify" button in the same tick as the auto-fire is a narrow window where both calls can pass the guard before `setLoading(true)` commits.
**Repro:** Type the 6th OTP digit and simultaneously tap "Verify" the instant it becomes visible → possible duplicate `postConfirmCustomer` call.

### 3.5 [Low] Uncancelled `setTimeout` navigates after OTP success
**File:** `src/screens/OTPVerificationScreen.tsx:123-125`
```js
setTimeout(() => {
  navigation.reset({ index: 0, routes: [{ name: 'Login', params: { skipEntrance: true } }] });
}, 250);
```
No cleanup if the screen unmounts within the 250ms window (e.g. user backgrounds the app right after OTP success).

**Checked, not a bug:** `axiosInstance.ts`'s concurrent-401 handling is safe — every queued request awaits the same shared `_refreshPromise`; if refresh fails, each queued request calls `clearSession()`/`resetToLogin()` redundantly but harmlessly (both are idempotent, no double-stack-push); the empty `else` branch in the request interceptor when no token exists is correct (unauthenticated request proceeds, 401 triggers refresh flow reactively); `Login.tsx`'s cart-merge-on-login swallows individual item failures via `.catch(() => {})` but still completes navigation — reasonable by design; `ProfileScreen.loadProfile` correctly guards every nested `.then` with a cancellation check.

---

## 4. Shared UI Components

### 4.1 [Medium] Toast timers leak on `ToastOverlay` unmount
**File:** `src/components/ui/ToastOverlay.tsx:16-31`
Per-toast `setTimeout` timers stored in `timers.current` are never cleared on unmount (only the `toastEmitter` subscription is cleaned up).
**Repro:** Trigger a toast, then force `ToastOverlay` to remount/unmount before the toast's auto-dismiss timer fires (e.g. a parent-level remount) → the timer still fires later and calls `setToasts` on an unmounted component.

### 4.2 [Medium] `FadeImage` doesn't reset state when its `uri` prop changes
**File:** `src/components/ui/FadeImage.tsx:39-55`
`opacity`/`loaded`/`failed` are set once via `onLoad`/`onError` with no effect keyed on `uri` to reset them.
**Repro:** Re-render a mounted `FadeImage` instance with a new `uri` (e.g. a swappable image slot, not a fresh mount) → the new image pops in at full opacity with no fade-in, and any skeleton/placeholder is skipped since `loaded` is already `true` from the previous image.

### 4.3 [Low] `ConfirmSheet` has no exit animation
**File:** `src/components/ui/ConfirmSheet.tsx:60-66,99`
`slideAnim` only animates the entrance; on close/confirm the component unmounts immediately with no reverse animation, abruptly disappearing instead of sliding out — inconsistent with the app's "restrained motion" standard in CLAUDE.md.

### 4.4 [Low] `src/components/gluestack/Actionsheet.tsx` has zero importers
Despite CLAUDE.md flagging this file as infrastructure to keep, nothing in `src/` currently imports `ActionsheetContent`/`ActionsheetItem`/etc. Its multi-sheet, backdrop-dismiss, and Android-back behaviors are therefore unverified in any live screen — worth a smoke test before relying on it for a new feature.

**Checked, not a bug:** `useTactile`/`useHaptic` are clean with proper cleanup; `OrderHistoryScreen`'s `onEndReached` is correctly mutex'd against `onRefresh` via `fetchingRef`; `SearchScreen`'s recent-search `keyExtractor` embeds the item value so list-reorder doesn't cause stale-key scroll bugs; `useProfileCode`/`useSession` cancellation is handled correctly elsewhere in the codebase.

---

## Priority Fix Order

1. **1.1** — hardcoded `customerProfileCode: 136636` in PaymentScreen (one-line fix, real-money correctness issue)
2. **1.2 / 1.3** — back-navigation into payment/checkout after order completion (needs `navigation.reset` on success + `gestureEnabled: false`/`BackHandler` on `EcomPayment`)
3. **2.2** — Add-to-Cart double-tap duplicate requests (wire `isDisabled={addingToCart}`)
4. **2.5** — Wishlist heart un-save not persisted server-side (silent data-loss-of-intent bug)
5. **2.1** — Search race condition (add a request-id/latest-query check before `setSuggestions`)
6. Remaining Medium items (2.3, 2.4, 2.6, 3.1, 3.2, 4.1, 4.2) — recoverable but visibly incorrect to users
7. Low/latent items — fix opportunistically or leave as documented technical debt
