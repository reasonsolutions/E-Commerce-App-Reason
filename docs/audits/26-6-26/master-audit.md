# Master Audit — EasyCom (React Native)

**Date:** 2026-06-26  
**Branch:** dev  
**Sources merged:** architecture-review · launch-checklist · security-audit · technical-debt · ux-review  
**Codebase snapshot:** 19 screens · 12,389 screen LOC · 47 UI components · 6 API domains

---

## Scores

| Dimension            | Score | Rationale                                                                                                                                         |
| -------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production Readiness | 3/10  | Six hard store blockers, three live security vulnerabilities, three dead UI elements                                                              |
| Security             | 4/10  | Auth token lifecycle is strong; payment credential exposure and HTTP transport are critical failures                                              |
| Performance          | 6/10  | Serial delete loop and eager image loading are the only measurable perf issues; fetch/pagination patterns are sound                               |
| Architecture         | 7/10  | Domain API structure, error infrastructure, and theme system are excellent; navigation type safety and state ownership need targeted fixes        |
| Code Quality         | 5/10  | Consistent patterns in most areas; 15+ hardcoded colors, 10+ ad-hoc animation durations, monolithic screen files, and 20+ untyped catch blocks    |
| UX                   | 4/10  | 72 issues found; three dead production buttons, brand-breaking typography violation on the highest-traffic screen, multiple broken checkout flows |

---

# P0 — Launch Blockers

Issues that will result in store rejection, security breach, or broken core user flows before first launch.

---

### P0-01 · Hardcoded payment gateway credentials in source code

**Description:** Three sets of MIPS payment gateway credentials are hardcoded directly in `PaymentScreen.tsx` — login/password to obtain auth tokens, and HTTP Basic-style credentials on payment zone and status calls. They are compiled into the binary and trivially extractable from a decompiled APK or IPA.

**Why it matters:** Any attacker with the compiled app can extract the credentials and call the MIPS API directly — forging payment status responses, initiating fraudulent payment zones, or enumerating transaction data. Both Apple and Google scan for embedded credentials and will reject the binary. This is the single most critical issue in the codebase.

**Files affected:**

- `src/screens/PaymentScreen.tsx` — lines 89–93, 171–175, 273–277

**Found by:** launch-checklist (issue 1) · security-audit (VULN-1)

**Estimated effort:** 3–5 days (requires backend proxy endpoint, coordination with MIPS)

**Expected impact:** Eliminates credential exposure risk entirely; required for store submission.

---

### P0-02 · Release APK signed with debug keystore

**Description:** `android/app/build.gradle` sets `signingConfig signingConfigs.debug` on the release build type. The Play Store rejects any APK signed with the Android debug keystore.

**Why it matters:** Google Play will reject the submission outright. The debug keystore (`android` / `androiddebugkey`) is public knowledge and provides no trust guarantee.

**Files affected:**

- `android/app/build.gradle` — lines 100–103

**Found by:** launch-checklist (issue 2)

**Estimated effort:** 2h (generate keystore, configure `signingConfigs.release`, store credentials in `~/.gradle/gradle.properties`)

**Expected impact:** Unblocks Play Store submission.

---

### P0-03 · Empty iOS location permission description

**Description:** `Info.plist` declares `NSLocationWhenInUseUsageDescription` with an empty string. Apple rejects any app where a usage description key has an empty value.

**Why it matters:** App Store review will reject on this alone. No location code was found in the codebase — if location is unused, the key should be removed entirely.

**Files affected:**

- `ios/EcommerceApp/Info.plist` — lines 34–35

**Found by:** launch-checklist (issue 3)

**Estimated effort:** 15m (delete the key if unused, or provide a meaningful description)

**Expected impact:** Eliminates an App Store rejection vector.

---

### P0-04 · No Privacy Policy or Terms of Service anywhere in the app

**Description:** No `PrivacyPolicy` screen, no URL, no tappable link exists anywhere in the app or store listing. Both Apple (Guideline 5.1.1) and Google Play Policy require a privacy policy linked on the store listing and accessible within the app before account creation. Terms of Service are also required by both stores at account creation.

**Why it matters:** Hard blocker for both stores. `RegisterScreen` and `Login` have no privacy policy or terms link. Without these, no submission can clear review.

**Files affected:**

- `src/screens/RegisterScreen.tsx` (link needed here)
- `src/screens/ProfileScreen.tsx` (settings entry needed here)
- Store listing metadata (both platforms)

**Found by:** launch-checklist (issues 4, 5)

**Estimated effort:** 1 day (draft policy, host it, add links in app and store listing)

**Expected impact:** Required for submission to both stores.

---

### P0-05 · App name mismatch between iOS and Android

**Description:** Android `strings.xml` names the app **EasyCom**; iOS `Info.plist` `CFBundleDisplayName` reads **EcommerceApp**. Apple flags generic or placeholder app names and reviewers will see a mismatched identity.

**Why it matters:** App Store reviewers see "EcommerceApp" — a placeholder name — which triggers guideline violations around completeness and brand identity.

**Files affected:**

- `ios/EcommerceApp/Info.plist` — `CFBundleDisplayName` and `CFBundleName`

**Found by:** launch-checklist (issues 6, 25)

**Estimated effort:** 15m

**Expected impact:** Fixes App Store name presentation and reviewer impression.

---

### P0-06 · Product images served over plaintext HTTP — ATS blocks on iOS, MitM risk everywhere

**Description:** `resolveImageUrl.ts` uses `http://122.175.15.28:8110/` — a bare IP address over HTTP. Apple's App Transport Security (ATS) will block all HTTP image requests on iOS release builds, causing every product image to fail. On Android, `mixedContentMode="always"` in the payment WebView was added to accommodate this HTTP origin — creating a MitM injection surface within payment flows.

**Why it matters:** On iOS release builds, the app will be visually broken (no product images). On both platforms, a network MitM attacker can replace product images with malicious content or inject into the payment WebView. Google Play's Data Safety policy flags unencrypted traffic.

**Files affected:**

- `src/utils/resolveImageUrl.ts` — line 1
- `src/screens/PaymentScreen.tsx` — line 512 (`mixedContentMode="always"`)
- `ios/EcommerceApp/Info.plist` — ATS configuration

**Found by:** launch-checklist (issue 7) · security-audit (VULN-3)

**Estimated effort:** 2–3 days (requires HTTPS on image server; interim: scoped `NSExceptionDomains` for iOS, `network_security_config.xml` for Android)

**Expected impact:** Fixes broken iOS images in production, eliminates MitM injection vector in payment flow.

---

### P0-07 · Dead UI elements in production — three confirmed broken interactions

**Description:** Three tappable elements in production are completely non-functional with no user feedback:

| Screen                       | Element            | Current Behaviour                    |
| ---------------------------- | ------------------ | ------------------------------------ |
| `OrderDetailScreen.tsx:605`  | "Need Help" button | `console.warn('Help not yet wired')` |
| `ProfileScreen.tsx`          | "Contact Us" row   | `onPress: () => {}` — silent no-op   |
| `WishlistScreen.tsx:165-170` | "Notify Me" (OOS)  | No handler — silent no-op            |

**Why it matters:** Apple Guideline 2.1 (Completeness) and Google's Minimum Functionality policy reject apps with interactive elements that silently do nothing. The Help button is on the post-purchase screen that reviewers will actively test.

**Files affected:**

- `src/screens/OrderDetailScreen.tsx` — line 605
- `src/screens/ProfileScreen.tsx`
- `src/screens/WishlistScreen.tsx` — lines 165–170

**Found by:** launch-checklist (issues 11, 13) · technical-debt (issue 14) · ux-review (cross-cutting: Dead UI Elements)

**Estimated effort:** 2h (wire Help to `HelpCenterScreen`; remove or disable "Contact Us" and "Notify Me" with a "Coming soon" toast)

**Expected impact:** Eliminates functional completeness rejection vectors.

---

### P0-08 · `AddressScreen` FlatList has no empty state — breaks checkout for new users

**Description:** The address selection screen in the checkout flow renders a `FlatList` with no `ListEmptyComponent`. A user with no saved addresses sees a blank list. Reviewers testing checkout with a fresh account will hit this immediately.

**Why it matters:** Checkout is the core revenue flow. A blank screen at the address step creates a dead end for all new users. This is a functional completeness rejection risk.

**Files affected:**

- `src/screens/AddressScreen.tsx`

**Found by:** launch-checklist (issue 15) · ux-review (issue 12)

**Estimated effort:** 1h

**Expected impact:** Unblocks checkout for new users; removes reviewer rejection vector.

---

### P0-09 · Generic bundle ID `com.ecommerceapp`

**Description:** Both platforms use the placeholder bundle identifier `com.ecommerceapp`. This ID may already be registered on Google Play, and Apple requires the bundle ID to match a registered App ID in your developer account.

**Why it matters:** Cannot submit to either store with a placeholder ID. Changing the bundle ID after first submission requires creating an entirely new app listing — the earlier this is fixed, the less rework is required.

**Files affected:**

- `android/app/build.gradle` — line 80
- `ios/EcommerceApp.xcodeproj/project.pbxproj`

**Found by:** launch-checklist (issue 16)

**Estimated effort:** 2h (update both configurations, re-provision iOS signing)

**Expected impact:** Required for store registration and submission.

---

# P1 — High Priority

Issues that represent serious security vulnerabilities, significant UX failures on core flows, or architectural risks that compound quickly.

---

### P1-01 · Keychain tokens stored at `SECURITY_LEVEL.ANY` — bypasses Secure Enclave

**Description:** Both the access token and the refresh token are stored in the Keychain with `securityLevel: Keychain.SECURITY_LEVEL.ANY`. On iOS this means `kSecAttrAccessibleAlwaysThisDeviceOnly` — accessible even when the device is locked, not backed by Secure Enclave. On Android, it allows storage in the software keystore without requiring biometric or PIN authentication.

**Why it matters:** On a jailbroken iOS or rooted Android device, an attacker with filesystem access can extract the refresh token (long-lived, mints new access tokens) and maintain persistent account access indefinitely. The refresh token in particular warrants hardware-backed storage.

**Files affected:**

- `src/screens/Login.tsx` — lines 191–202
- `src/api/axiosInstance.ts` — lines 36–39

**Found by:** security-audit (VULN-2)

**Estimated effort:** 2h

**Expected impact:** Upgrades token storage to OS-enforced hardware protection for refresh tokens.

---

### P1-02 · User password transmitted in navigation route params

**Description:** During registration, the plaintext user password is passed as a route parameter to `OTPVerificationScreen`. React Navigation stores route params in navigation state, which is accessible via `navigation.getState()` from any screen and can be serialized to `AsyncStorage` if state persistence is ever enabled.

**Why it matters:** Any component with access to the navigation ref (including the module-global `navigationService.ts`) can read the full navigation state and extract the password. If navigation state persistence is enabled in future (a common developer reflex), the password is written to `AsyncStorage` in plaintext.

**Files affected:**

- `src/screens/RegisterScreen.tsx` — lines 106–113
- `src/screens/OTPVerificationScreen.tsx` — line 42

**Found by:** security-audit (VULN-4)

**Estimated effort:** 2h (store password in a module-scoped variable or context that is explicitly cleared post-verification)

**Expected impact:** Eliminates password exposure via navigation state.

---

### P1-03 · PaymentScreen WebView `originWhitelist={['*']}` — arbitrary navigation allowed

**Description:** The payment WebView uses `originWhitelist={['*']}`, allowing navigation to any URL or scheme including `javascript:`, `file://`, and `intent://`. Combined with `mixedContentMode="always"` (see P0-06), this creates an open surface for MitM-injected redirects to local storage or arbitrary JS execution.

**Why it matters:** If the MIPS payment page contains an open redirect, or if a MitM injects a redirect (feasible via the HTTP image origin on the same session), the WebView can navigate to `file:///data/data/<package>/` on Android or execute arbitrary JS within the WebView's origin.

**Files affected:**

- `src/screens/PaymentScreen.tsx` — line 511

**Found by:** security-audit (VULN-5)

**Estimated effort:** 1h (restrict `originWhitelist` to `['https://maupost.mauritiuspost.mu']`; add `onShouldStartLoadWithRequest` guard)

**Expected impact:** Closes WebView-based code execution vector.

---

### P1-04 · Product name typography violation — `FontFamily.sans` on highest-traffic screen

**Description:** `ProductScreen.tsx` line 859 renders product names using `FontFamily.sans`. CLAUDE.md mandates `FontFamily.serif` for all product names — described as "the app's primary differentiator from commodity marketplace UIs."

**Why it matters:** This violation occurs on every product detail page view — the highest-traffic screen in the app. It directly undermines the editorial identity that distinguishes the app from Amazon/Flipkart-style UIs.

**Files affected:**

- `src/screens/ProductScreen.tsx` — line 859 (productName style)

**Found by:** ux-review (ProductScreen · cross-cutting: Product Name Typography Violation)

**Estimated effort:** 30m

**Expected impact:** Restores brand identity on the highest-traffic screen.

---

### P1-05 · WishlistHeart in ResultScreen silently ignores unauthenticated taps

**Description:** `WishlistHeart` on product tiles in `ResultScreen` has no auth guard — when a guest user taps the heart, nothing happens and no feedback is given. The identical action on `ProductScreen` correctly shows a `LoginPromptSheet`.

**Why it matters:** The inconsistency destroys trust. Users who discover the wishlist feature on product cards and are silently ignored will not know the feature exists or assume it is broken. This is a direct conversion loss.

**Files affected:**

- `src/screens/ResultScreen.tsx`

**Found by:** ux-review (ResultScreen · cross-cutting: Missing Auth Guard)

**Estimated effort:** 1h

**Expected impact:** Consistent auth guard behaviour across all wishlist entry points; removes silent UX dead-end.

---

### P1-06 · Navigation has no type safety — `AppNavigator.js` is untyped JavaScript

**Description:** `AppNavigator.js` is a JavaScript file with no TypeScript. All `navigation.navigate('ScreenName', { params })` calls are untyped strings. A param rename or screen name change is a silent runtime regression invisible to the compiler. Ten screens declare their navigation prop as a loose callback or `any`.

**Why it matters:** At current scale, silent regressions from param mismatches are already possible. This compounds at every new screen added. The fix is a one-time migration with no call-site changes.

**Files affected:**

- `src/navigation/AppNavigator.js`
- `src/screens/BrandsScreen.tsx`, `OrderHistoryScreen.tsx`, `CartScreen.tsx`, `HelpCenterScreen.tsx`, `ResultScreen.tsx`, `SearchScreen.tsx`, `HomeScreen.tsx`, `WishlistScreen.tsx`, `OrderDetailScreen.tsx`, `CategoriesScreen.tsx` (navigation prop types)

**Found by:** architecture-review (Risk C) · technical-debt (issues 9, 20)

**Estimated effort:** 4h (define `RootStackParamList`, migrate `AppNavigator.js` to `.tsx`, type all navigation props)

**Expected impact:** Compile-time detection of all navigate call errors; prerequisite for safe scaling.

---

### P1-07 · Auth identity read from AsyncStorage in 13+ screens — no `SessionContext`

**Description:** `CustomerProfileCode` and user session data are read directly via `AsyncStorage.getItem(STORAGE_KEYS.userData)` + `JSON.parse` inside every screen that needs them. `useProfileCode` and `useSession` hooks exist but are explicitly avoided for API calls because they return null on first render.

**Why it matters:** Account switching, profile updates, or server-side field renames require hunting and updating 13+ read sites. The current defensive workaround (read AsyncStorage inside every fetch function) is correct but fragile at scale.

**Files affected:**

- 13+ screens reading `AsyncStorage.getItem(STORAGE_KEYS.userData)` directly

**Found by:** architecture-review (Risk B) · architecture-review (Dependency Graph)

**Estimated effort:** 1 day (implement `SessionContext`, wrap app root, migrate read sites)

**Expected impact:** Single invalidation point for identity; eliminates first-render-null problem; prerequisite for account switching safety.

---

### P1-08 · Proguard/R8 disabled — unobfuscated APK with payment logic

**Description:** `enableProguardInReleaseBuilds = false` in `build.gradle`. The entire Java/Kotlin class tree ships unobfuscated. Payment logic, internal class names, API endpoint patterns, and any remaining hardcoded strings are readable from a decompiled APK.

**Why it matters:** Google Play's developer policies require reasonable protection of user data. An unobfuscated APK with payment code fails that bar and makes reverse engineering trivial.

**Files affected:**

- `android/app/build.gradle` — lines 60, 104

**Found by:** launch-checklist (issue 9)

**Estimated effort:** 2h (enable flag, validate proguard rules don't strip RN classes)

**Expected impact:** Reduces APK reversibility; satisfies Google Play data protection requirements.

---

### P1-09 · iOS landscape orientations declared but unsupported

**Description:** `Info.plist` declares `UIInterfaceOrientationLandscapeLeft` and `UIInterfaceOrientationLandscapeRight` alongside portrait. No landscape layouts exist in the app. Apple flags apps that claim to support orientations they don't actually handle.

**Why it matters:** If an App Store reviewer rotates the device, layouts will break. Apple will flag or reject on this basis.

**Files affected:**

- `ios/EcommerceApp/Info.plist` — lines 67–72

**Found by:** launch-checklist (issue 17)

**Estimated effort:** 15m

**Expected impact:** Prevents layout failures during App Store review.

---

### P1-10 · Reactotron bundled into production binary

**Description:** `index.js:6` unconditionally imports `./src/config/reactotron`, shipping the Reactotron module and `reactotron-react-native` into the production bundle. The config file is `__DEV__`-gated internally, but the module itself is included in the binary.

**Why it matters:** Adds a dev-tooling dependency to the production bundle (size increase); may be flagged by automated store scanners as a debug artifact. More critically, `useReactNative({ networking: true })` intercepts all network traffic — even if `__DEV__` prevents activation, the module is present.

**Files affected:**

- `index.js` — line 6

**Found by:** launch-checklist (issue 8)

**Estimated effort:** 15m (`if (__DEV__) require('./src/config/reactotron')`)

**Expected impact:** Removes debug tooling from production bundle.

---

### P1-11 · `console.log` leaking to production — payment and auth paths

**Description:** Multiple unguarded `console.*` calls ship in production builds:

- `axiosInstance.ts:42` — logs raw refresh token errors (auth state leakage via `adb logcat`)
- `PaymentScreen.tsx:187, 333, 456, 516` — logs payment zone, polling, finalise, and WebView error paths

**Why it matters:** On Android, `adb logcat` is readable by anyone with USB access in a release build. Auth and payment debug output is directly visible without any special privileges.

**Files affected:**

- `src/api/axiosInstance.ts` — line 42
- `src/screens/PaymentScreen.tsx` — lines 187, 333, 456, 516

**Found by:** launch-checklist (issues 10, 22) · technical-debt (issue 1)

**Estimated effort:** 1h

**Expected impact:** Closes auth and payment state leakage via device logs.

---

# P2 — Medium Priority

Issues that degrade code correctness, maintainability, or UX quality but do not block launch.

---

### P2-01 · Hardcoded hex colors — 15+ violations across screens

**Description:** Multiple screens bypass the design token system with literal hex values. Worst offenders: `OrderSuccessScreen` (4 violations), `OrderHistoryScreen` (4 violations), `ProfileScreen` (15 violations), `Login` (5 violations), `BrandsScreen` (1 violation). `PaymentScreen` also uses raw hex throughout its status strip.

**Why it matters:** Breaks the single source of truth for the color palette. A brand color change requires hunting through dozens of style blocks. The `PaymentScreen` violations make it visually detached from the rest of the app.

**Files affected:**

- `src/screens/OrderSuccessScreen.tsx` — lines 381, 395, 398, 462
- `src/screens/OrderHistoryScreen.tsx` — lines 218, 303, 806, 885
- `src/screens/ProfileScreen.tsx` — lines 67, 122, 127, 138, 193, 312, 427, 451, 476, 638, 643, 653, 656, 727, 730
- `src/screens/Login.tsx` — lines 263, 393, 445, 455, 467
- `src/screens/BrandsScreen.tsx` — line 293
- `src/screens/PaymentScreen.tsx` — status strip styles

**Found by:** technical-debt (issue 4) · ux-review (PaymentScreen: Design Token Bypass)

**Estimated effort:** 3h

**Expected impact:** Restores design token authority; enables future rebrand without per-file archaeology.

---

### P2-02 · Hardcoded animation durations — 10+ violations against `Motion.duration.*` contract

**Description:** CLAUDE.md states "ad-hoc durations are a hard failure." Currently 10+ `duration:` values bypass `Motion.duration.*` across Login shake animation, HomeScreen, ResultScreen, ProductCard, AddressScreen, OrderHistoryScreen, and AddressManagementScreen.

**Why it matters:** Animation timing that drifts from the token system creates temporal inconsistency — some transitions feel faster or slower than others for no discernible reason. This degrades the "calm, curated" feel that is central to the app's identity.

**Files affected:**

- `src/screens/Login.tsx` — lines 71–74, 110, 116
- `src/screens/HomeScreen.tsx` — line 76
- `src/screens/ResultScreen.tsx` — line 163
- `src/components/ProductCard.tsx` — line 52
- `src/screens/AddressScreen.tsx` — line 499
- `src/screens/OrderHistoryScreen.tsx` — line 618
- `src/screens/AddressManagementScreen.tsx` — line 386

**Found by:** technical-debt (issue 5)

**Estimated effort:** 2h

**Expected impact:** Restores motion token authority; consistent animation feel across the app.

---

### P2-03 · Inconsistent error state handling — blank screens on fetch failure

**Description:** Several screens fetch data but do not render `ErrorState` on failure, leaving users with a blank or stale screen. The canonical pattern (`if (isError) return <ErrorState .../>`) is absent or incomplete in `BrandsScreen`, `CategoriesScreen`, `WishlistScreen`, and `AddressManagementScreen`.

**Why it matters:** A user who hits a network error on these screens sees nothing — no message, no retry button. This is a trust-damaging failure state that is also a review risk if a reviewer encounters it.

**Files affected:**

- `src/screens/BrandsScreen.tsx`
- `src/screens/CategoriesScreen.tsx`
- `src/screens/WishlistScreen.tsx`
- `src/screens/AddressManagementScreen.tsx`

**Found by:** technical-debt (issue 10)

**Estimated effort:** 3h

**Expected impact:** Consistent, recoverable error experience across all screens.

---

### P2-04 · Price decimal formatting inconsistency

**Description:** Two formats are in active use: `.toFixed(0)` (ProductScreen, CartScreen, ResultScreen, WishlistScreen, HomeScreen) and `.toFixed(2)` (OrderDetailScreen payment summary exclusively). A user sees "Rs 1,250" throughout the browse flow and "Rs 1250.00" in the order summary — these read as different numbers.

**Why it matters:** Decimal inconsistency in a financial app erodes trust. The order summary is the final confirmation a user sees before money leaves their account.

**Files affected:**

- `src/screens/OrderDetailScreen.tsx` — payment summary price rendering

**Found by:** ux-review (cross-cutting: Price Decimal Formatting) · ux-review (OrderDetailScreen)

**Estimated effort:** 1h

**Expected impact:** Consistent price formatting throughout the purchase flow.

---

### P2-05 · Back button icon inconsistency — `arrow-back` vs `chevron-back` with no semantic distinction

**Description:** Two different back button icons are used across the app with identical navigation semantics. `arrow-back` appears on CartScreen, WishlistScreen, ResultScreen, SearchScreen, HelpCenterScreen. `chevron-back` appears on ProductScreen (error state), ProfileScreen, RegisterScreen, AddressScreen, AddressManagementScreen, OTPVerificationScreen.

**Why it matters:** Users develop an expectation from the first back icon they encounter. A different icon reads as potentially different behaviour — the kind of subtle inconsistency that makes an app feel unpolished.

**Files affected:** 10 screens across the app.

**Found by:** ux-review (cross-cutting: Back Button Icon Inconsistency)

**Estimated effort:** 1h (standardise on one icon across all screens)

**Expected impact:** Consistent navigation affordance throughout the app.

---

### P2-06 · `catch (err: any)` pattern — 20+ catch blocks defeat type narrowing

**Description:** `catch (err: any)` appears in 20+ catch blocks across screens and components. This defeats TypeScript's type narrowing. The correct pattern — `catch (err) { const message = extractMessage(err); }` using the existing `apiError.ts` utility — is established but not consistently applied.

**Why it matters:** `any` in catch blocks silences type errors. A shape change in error responses becomes a silent runtime failure rather than a compile-time error.

**Files affected:**

- `src/screens/AddressScreen.tsx` — line 387
- `src/screens/OrderHistoryScreen.tsx` — lines 368, 442
- `src/screens/PaymentScreen.tsx` — lines 186, 332, 455
- `src/screens/Login.tsx` — line 252
- `src/components/ui/EditProfileSheet.tsx` — line 245
- `src/components/ui/ForgotPasswordSheet.tsx` — lines 78, 104
- `src/components/ui/ChangePasswordSheet.tsx` — line 169
- ~10 more (full list: `rg 'catch \(e\w*: any\)'`)

**Found by:** technical-debt (issue 8)

**Estimated effort:** 2h

**Expected impact:** Restores type safety in all error paths.

---

### P2-07 · `any[]` return types in API layer — silent runtime failures on shape changes

**Description:** Two critical API gaps: (1) `interfaces.ts` has `Taxes: any[]` and `PhysicalAttributes: any` in `SaveCartItemInterface` and `OrderDetailItemInterface`; (2) `orderApi.ts` returns `Promise<{ items: any[]; hasMore: boolean }>` for the order history list. Backend shape changes in these areas are invisible to the compiler.

**Why it matters:** Order data is financial — silent type mismatches in order history and tax fields are high-consequence. A field rename or restructure from the backend produces runtime failures with no compile-time warning.

**Files affected:**

- `src/api/interfaces.ts` — lines 647, 668–669
- `src/api/order/orderApi.ts` — line 50
- `src/screens/ProductScreen.tsx` — lines 648–649 (`as any` casts on `AdditionalInfo`)

**Found by:** technical-debt (issues 11, 12, 13)

**Estimated effort:** 3h

**Expected impact:** Type safety on all order and financial data paths.

---

### P2-08 · `OrderHistoryScreen` — duplicate navigation affordances and broken Reorder tap

**Description:** `OrderCard` has both a tappable card wrapper and a "View Order" button that perform identical navigation to `OrderDetailScreen`. Additionally, the "Reorder" button is inside the tappable card wrapper without `stopPropagation`, meaning tapping "Reorder" also triggers card navigation — the user ends up on Order Detail when they intended to reorder.

**Why it matters:** The reorder flow is double-broken: the tap is intercepted by the card, and even if it completes, there is no navigation to Cart afterward — the user has no indication reorder succeeded.

**Files affected:**

- `src/screens/OrderHistoryScreen.tsx`

**Found by:** ux-review (OrderHistoryScreen)

**Estimated effort:** 2h

**Expected impact:** Correct reorder UX; removes duplicate navigation affordance.

---

### P2-09 · `homeCache` is a mutable module-level singleton with no consistency guarantees

**Description:** `src/utils/homeCache.ts` exports a plain mutable object `{ categories: null, brands: null }`. `HomeScreen` writes to it; `SearchScreen` reads from it. There is no subscription, no update notification, and no invalidation. If `HomeScreen` hasn't fetched yet, `SearchScreen` gets `null` silently.

**Why it matters:** This pattern breaks under any multi-consumer scenario. Adding a third consumer requires knowing the singleton exists. After account switch or deep link remount, stale cache values persist. Category/brand chips in Search may silently be empty.

**Files affected:**

- `src/utils/homeCache.ts`
- `src/screens/HomeScreen.tsx`
- `src/screens/SearchScreen.tsx`

**Found by:** architecture-review (Risk G)

**Estimated effort:** 2h (move into `SessionContext` or a `useRef`-backed hook)

**Expected impact:** Eliminates silent empty state in Search; correct invalidation on account events.

---

### P2-10 · Wishlist stale on tab focus — `hasFetched.current` blocks re-fetch

**Description:** `WishlistScreen` uses `hasFetched.current` to prevent re-fetching on tab focus. If the user toggles wishlist status from `ProductScreen` and returns to the Wishlist tab, the list reflects stale data until full remount.

**Why it matters:** Wishlist is a core engagement feature. Stale display after modification destroys confidence that the action was recorded.

**Files affected:**

- `src/screens/WishlistScreen.tsx`

**Found by:** ux-review (WishlistScreen)

**Estimated effort:** 1h

**Expected impact:** Wishlist always reflects current state when the tab is focused.

---

### P2-11 · No production crash reporting

**Description:** No Firebase Crashlytics, Sentry, or equivalent is configured. `apiError.ts` has a TODO comment acknowledging this. Post-launch crashes are completely invisible.

**Why it matters:** The first crash wave post-launch will be undiagnosable without crash reporting. Given the payment flow complexity, this is a significant operational risk.

**Files affected:**

- `src/api/apiError.ts` — line 156 (TODO)

**Found by:** launch-checklist (issue 18) · technical-debt (issue 21)

**Estimated effort:** 1 day (integrate Sentry `@sentry/react-native`, route all catch paths)

**Expected impact:** Full crash and error visibility in production from day one.

---

### P2-12 · `apiLogger.ts` logs full request/response payloads unconditionally

**Description:** All API traffic is logged regardless of build mode. This includes addresses, order details, and other PII visible in development device logs — logs that other apps on a shared device may be able to capture on Android.

**Why it matters:** PII leakage in device logs is a privacy risk. Performance overhead in production from logging full payloads is also unnecessary.

**Files affected:**

- `src/api/apiLogger.ts` — lines 85, 111, 139

**Found by:** technical-debt (issue 17)

**Estimated effort:** 2h

**Expected impact:** Eliminates PII exposure in production device logs.

---

### P2-13 · SearchScreen category chips query by display name, not `categoryId`

**Description:** FTU category chips in `SearchScreen` call `commit(cat.CategoryName)` — querying by display name as a text string rather than a structured `categoryId`. Results depend on string matching and will be unreliable for categories with special characters or alternate names.

**Why it matters:** Search is a primary discovery path. Category navigation that returns wrong or empty results on the first interaction destroys the Search experience and the user's confidence.

**Files affected:**

- `src/screens/SearchScreen.tsx`

**Found by:** ux-review (SearchScreen)

**Estimated effort:** 2h

**Expected impact:** Reliable category-driven search results.

---

### P2-14 · `CartScreen` — serial delete loop for clear cart

**Description:** `clearCart` for logged-in users calls `postDeleteCartItem` in a sequential `for` loop — each item waits for the previous delete before the next starts. A 5-item cart requires 5 serial round trips.

**Why it matters:** On a slow connection, clearing a cart can take 5–10 seconds with the user waiting. This is a straightforward parallelization fix.

**Files affected:**

- `src/screens/CartScreen.tsx`

**Found by:** ux-review (CartScreen)

**Estimated effort:** 1h (convert to `Promise.all`)

**Expected impact:** Clear cart completes in ~1 round-trip time regardless of cart size.

---

### P2-15 · Dead exports — `HeroNavButton`, `DeptFooter`, `InlineError`

**Description:** Two components (`HeroNavButton`, `DeptFooter`) are exported from `ui/index.ts` but have zero import references anywhere. `InlineError` is deprecated per CLAUDE.md but still exists and is exported, inviting future misuse.

**Why it matters:** Dead exports inflate the bundle, confuse developers about what is in active use, and create maintenance surface for code that provides no value.

**Files affected:**

- `src/components/ui/HeroNavButton.tsx`
- `src/components/ui/DeptFooter.tsx`
- `src/components/system/InlineError.tsx`
- `src/components/ui/index.ts`

**Found by:** technical-debt (issues 2, 3)

**Estimated effort:** 45m

**Expected impact:** Cleaner component surface; smaller bundle.

---

### P2-16 · `AddressManagementScreen` — silent delete failure and destructive delete with no confirmation

**Description:** `handleDelete` has an empty `catch` block — a failed delete silently does nothing, the address stays in the list, and the user receives no error, no toast, and no retry affordance. Additionally, there is no confirmation dialog before deleting an address (including primary addresses), and no undo.

**Why it matters:** Silent failure + destructive action with no recovery is a compounding UX failure on data the user cannot easily restore.

**Files affected:**

- `src/screens/AddressManagementScreen.tsx`

**Found by:** ux-review (AddressManagementScreen)

**Estimated effort:** 1h

**Expected impact:** Correct error feedback; protection against accidental address deletion.

---

# P3 — Nice to Have

Issues that are genuine improvements but safe to defer post-launch.

---

### P3-01 · `interfaces.ts` is 753 lines — monolithic type file

**Description:** All API types across every domain live in one file: 35+ interfaces, covering product, cart, order, address, auth, and wishlist. Merge conflicts, slow editor indexing, and unclear domain ownership are the result.

**Files affected:**

- `src/api/interfaces.ts` — 753 lines

**Found by:** architecture-review (Risk D) · technical-debt (issue 15)

**Estimated effort:** 1 day (split into `api/<domain>/types.ts`; `interfaces.ts` becomes a re-export barrel during migration)

**Expected impact:** Domain-scoped type ownership; faster compiler; eliminates the global dependency bottleneck.

---

### P3-02 · Eight screens exceed 600 lines — semantic extraction opportunity

**Description:** Eight screens mix fetch logic, derived state, multiple sub-views, and styles in single files:

| Screen                   | Lines |
| ------------------------ | ----- |
| `CartScreen.tsx`         | 1,092 |
| `ResultScreen.tsx`       | 1,088 |
| `ProductScreen.tsx`      | 1,019 |
| `OrderHistoryScreen.tsx` | 898   |
| `AddressScreen.tsx`      | 895   |
| `OrderDetailScreen.tsx`  | 866   |
| `HomeScreen.tsx`         | 781   |
| `ProfileScreen.tsx`      | 758   |

**Files affected:** Above screens.

**Found by:** architecture-review (Risk A) · technical-debt (issue 19)

**Estimated effort:** 3 days

**Expected impact:** Reviewable, independently testable screen regions; reduced merge conflict surface.

---

### P3-03 · `usePagination<T>` hook — pagination solved twice, not generalised

**Description:** `OrderHistoryScreen` and `ResultScreen` both implement pagination manually with their own `page` state, `hasMore` flag, append logic, and empty/loading/error handling. Bugs fixed in one do not propagate to the other.

**Files affected:**

- `src/screens/OrderHistoryScreen.tsx`
- `src/screens/ResultScreen.tsx`

**Found by:** architecture-review (Risk F)

**Estimated effort:** 4h (extract `usePagination<T>` hook, migrate both screens)

**Expected impact:** Single pagination implementation; consistent behaviour across all list screens.

---

### P3-04 · `src/components/ui/` flat organisation — 47 components, no sub-grouping

**Description:** 47 components ranging from stateless atoms (`Price`, `Rating`) to multi-step stateful sheets (`ForgotPasswordSheet`, `EditProfileSheet`) are in a flat folder. A new developer cannot distinguish a primitive from a screen fragment from the listing.

**Files affected:**

- `src/components/ui/` (all files)
- `src/components/ui/index.ts`

**Found by:** architecture-review (Risk E)

**Estimated effort:** 2h (create sub-groups: `product/`, `order/`, `auth/`, `feedback/`, `layout/`; barrel re-exports all)

**Expected impact:** Discoverable component ownership; clear category separation.

---

### P3-05 · Mock/real API toggle inconsistent — not all domains use `MOCK_MODE`

**Description:** Each domain `index.ts` uses a hardcoded boolean rather than `MOCK_MODE` from `src/config/env.ts`. There is no single switch that flips all domains to mock. A developer adding a new domain must remember to wire the toggle correctly.

**Files affected:**

- All domain `index.ts` files under `src/api/<domain>/`

**Found by:** architecture-review (Risk H)

**Estimated effort:** 1h

**Expected impact:** `MOCK_MODE` in `env.ts` becomes the single authoritative control surface for all domains.

---

### P3-06 · Unsplash runtime dependency for product images

**Description:** `useProductImage.ts` and `unsplashImage.ts` call the Unsplash API at runtime to resolve product images. This is load-bearing in production — real product images depend on a third-party API call, AsyncStorage caching, and fallback chains. The `.env` Unsplash key is also present.

**Why it matters:** Product image availability becomes a function of Unsplash rate limits and network conditions — an invisible third-party dependency not part of the API contract.

**Files affected:**

- `src/utils/useProductImage.ts`
- `src/utils/unsplashImage.ts`
- `.env` — `UNSPLASH_ACCESS_KEY`

**Found by:** architecture-review (Risk I) · launch-checklist (issue 23)

**Estimated effort:** 2h (audit whether Unsplash is used when backend image field is null; gate it explicitly or remove it)

**Expected impact:** Eliminates hidden third-party image dependency; clarifies image resolution contract.

---

### P3-07 · `FilterSheet.tsx` — 716-line component with multiple independent concerns

**Description:** The filter sheet manages sort, category, brand, price range, and in-stock state as a monolithic component. Any single concern requires navigating the full file.

**Files affected:**

- `src/components/ui/FilterSheet.tsx` — 716 lines

**Found by:** technical-debt (issue 16)

**Estimated effort:** 4h

**Expected impact:** Independent, testable filter sections; reduced cognitive load on future edits.

---

### P3-08 · Accessibility coverage — 69 labels across 365 touchable elements (~19%)

**Description:** Only ~19% of interactive elements have `accessibilityLabel`. Notable gaps: Wishlist heart (no label, no role), Filter icon on OrderHistory (no label), BottomNavBar tab labels at 9px (below WCAG minimum), WishlistScreen remove button at 24×24px (below 44pt minimum touch target).

**Files affected:**

- `src/screens/CartScreen.tsx`, `src/screens/ProductScreen.tsx`, `src/screens/HomeScreen.tsx` (most unlabelled buttons)
- `src/components/ui/BottomNavBar.tsx` — tab label font size
- `src/screens/WishlistScreen.tsx` — remove button touch target

**Found by:** launch-checklist (issue 20) · ux-review (multiple screens)

**Estimated effort:** 2 days

**Expected impact:** VoiceOver/TalkBack compatibility; passes App Review accessibility checks.

---

### P3-09 · No deep link / URL scheme configured

**Description:** No `linking` config in `AppNavigator.js`, no `intentFilter` for custom URI schemes. E-commerce apps are commonly linked into from emails, SMS, and push notifications.

**Files affected:**

- `src/navigation/AppNavigator.js`

**Found by:** launch-checklist (issue 21)

**Estimated effort:** 1 day

**Expected impact:** Enables marketing links, push notification deep links, and shareable product URLs.

---

### P3-10 · Minor UX polish — low-effort wins

Consolidated minor UX issues with individual effort under 30 minutes each:

| Issue                                                                              | File                                            | Effort |
| ---------------------------------------------------------------------------------- | ----------------------------------------------- | ------ |
| `OrderDetailScreen`: trailing `· ` separator when `event.Location` is null         | `OrderDetailScreen.tsx`                         | 15m    |
| PaymentScreen: expose polling count as "Checking payment…" with no counter         | `PaymentScreen.tsx`                             | 15m    |
| PaymentScreen: no back button in WebView flow — users trapped                      | `PaymentScreen.tsx`                             | 30m    |
| PaymentScreen: no spinner during "Preparing payment…"                              | `PaymentScreen.tsx`                             | 15m    |
| Login: CTA button height shift when text transitions to loading dots               | `Login.tsx`                                     | 30m    |
| Login: "Email" label contradicts "email or mobile number" placeholder              | `Login.tsx`                                     | 10m    |
| RegisterScreen: no password strength indicator                                     | `RegisterScreen.tsx`                            | 30m    |
| RegisterScreen: no visible `+230` country code prefix                              | `RegisterScreen.tsx`                            | 20m    |
| RegisterScreen: single `fieldError` state for multiple fields                      | `RegisterScreen.tsx`                            | 45m    |
| OTPVerificationScreen: OTP delivery channel not stated                             | `OTPVerificationScreen.tsx`                     | 10m    |
| HomeScreen: Recently Viewed only appears at ≥ 4 items (lower threshold)            | `HomeScreen.tsx`                                | 15m    |
| HomeScreen: banner pagination dots are not tappable                                | `HomeScreen.tsx`                                | 30m    |
| WishlistScreen: "Move to Bag" should remove item from wishlist atomically          | `WishlistScreen.tsx`                            | 1h     |
| OrderHistoryScreen: skeleton layout does not match card layout                     | `OrderHistoryScreen.tsx`                        | 1h     |
| OrderSuccessScreen: "Track Order" and "View Orders" go to the same screen          | `OrderSuccessScreen.tsx`                        | 20m    |
| `stale TODO` comments in `axiosInstance.ts`, `apiError.ts`                         | both files                                      | 30m    |
| `unsplashImage.ts`: bare string AsyncStorage prefix, not a `STORAGE_KEYS` constant | `src/utils/unsplashImage.ts`                    | 30m    |
| Hardcoded snappoint percentages in bottom sheets                                   | `OrderDetailScreen.tsx`, `LoginPromptSheet.tsx` | 30m    |

**Found by:** ux-review · technical-debt

---

# Implementation Roadmap

Optimal fix order to maximise launch readiness per engineering day, sequenced so each fix unblocks the next.

---

## Phase 1 — Store Submission Unblock (3–4 days)

_Goal: Clear all store rejection vectors so a submission can be made._

1. **P0-05** — App name (`CFBundleDisplayName` → "EasyCom") — 15m
2. **P0-03** — Remove empty `NSLocationWhenInUseUsageDescription` — 15m
3. **P1-09** — Remove landscape orientation declarations — 15m
4. **P1-10** — Gate Reactotron import on `__DEV__` — 15m
5. **P0-09** — Update bundle ID from `com.ecommerceapp` — 2h
6. **P0-02** — Generate production keystore, fix release signing — 2h
7. **P1-08** — Enable Proguard/R8 — 2h
8. **P0-07** — Wire dead UI elements (Help → HelpCenter; disable Contact Us and Notify Me) — 2h
9. **P0-08** — Add `ListEmptyComponent` to `AddressScreen` FlatList — 1h
10. **P1-11** — Gate all `console.*` calls in payment and auth paths — 1h
11. **P0-04** — Draft and host Privacy Policy + Terms; add links to RegisterScreen, ProfileScreen, store listings — 1 day

---

## Phase 2 — Critical Security (3–5 days)

_Goal: Close the three security vulnerabilities before any live payment traffic._

12. **P0-01** — Move MIPS credentials to backend proxy — 3–5 days _(longest item; start immediately in parallel with Phase 1)_
13. **P1-03** — Restrict WebView `originWhitelist` to MIPS domain; remove `mixedContentMode="always"` — 1h _(prerequisite: P0-06 HTTPS migration)_
14. **P0-06** — Serve images over HTTPS; remove HTTP exception — 2–3 days _(infrastructure + iOS/Android config)_
15. **P1-01** — Upgrade Keychain token security level — 2h
16. **P1-02** — Remove password from navigation route params — 2h

---

## Phase 3 — Core UX Fixes (3–4 days)

_Goal: Fix broken interactions reviewers will test and highest-traffic UX violations._

17. **P1-04** — Fix `FontFamily.sans` → `FontFamily.serif` on product name — 30m
18. **P1-05** — Add auth guard to `WishlistHeart` in `ResultScreen` — 1h
19. **P2-04** — Standardise price decimal formatting — 1h
20. **P2-05** — Standardise back button icon — 1h
21. **P2-08** — Fix `OrderHistoryScreen` duplicate nav + broken Reorder tap — 2h
22. **P2-10** — Fix Wishlist stale-on-focus — 1h
23. **P2-16** — Add delete confirmation + error feedback to `AddressManagementScreen` — 1h
24. **P2-14** — Parallelise `clearCart` with `Promise.all` — 1h
25. **P2-13** — Fix SearchScreen category chips to use `categoryId` — 2h
26. **P3-10** — Minor UX polish items (batch the 15m–30m fixes) — 1 day

---

## Phase 4 — Code Quality + Architecture (5–7 days)

_Goal: Bring code quality to a maintainable baseline before the next development sprint._

27. **P1-06** — Define `RootStackParamList`, migrate `AppNavigator` to TypeScript, type all navigation props — 4h
28. **P1-07** — Implement `SessionContext`, remove scattered `AsyncStorage` identity reads — 1 day
29. **P2-01** — Replace hardcoded hex colors with design tokens — 3h
30. **P2-02** — Replace hardcoded animation durations with `Motion.duration.*` — 2h
31. **P2-03** — Add `ErrorState` to the four screens missing it — 3h
32. **P2-06** — Replace `catch (err: any)` with typed error handling — 2h
33. **P2-07** — Type `any[]` return types in API layer — 3h
34. **P2-09** — Move `homeCache` into `SessionContext` or hook — 2h
35. **P2-11** — Integrate Sentry for production crash reporting — 1 day
36. **P2-12** — Gate `apiLogger.ts` on `__DEV__` — 2h
37. **P2-15** — Delete dead exports (`HeroNavButton`, `DeptFooter`, `InlineError`) — 45m

---

## Phase 5 — Post-Launch Structural Improvements (as capacity allows)

_These do not affect launch but compound positively over the next 3–6 months._

38. **P3-01** — Split `interfaces.ts` into domain-scoped `types.ts` files
39. **P3-02** — Extract semantic sub-components from the 8 oversized screens
40. **P3-03** — Extract `usePagination<T>` hook; migrate `ResultScreen` and `OrderHistoryScreen`
41. **P3-04** — Sub-group `src/components/ui/` by domain
42. **P3-05** — Standardise mock/real API toggle to use `MOCK_MODE` from `env.ts`
43. **P3-06** — Audit and gate/remove Unsplash runtime dependency
44. **P3-07** — Extract `FilterSheet` sections into sub-components
45. **P3-08** — Accessibility audit pass — labels, roles, touch targets
46. **P3-09** — Configure deep linking / URL schemes

---

_Total estimated effort to launch-ready: ~10–14 engineering days (Phase 1–3 in parallel, Phase 4 sequentially)._

# note only for my reference

P0-01
P0-04
P0-07
P0-08
P1-01
P1-02
P1-05
P1-06
P1-07
