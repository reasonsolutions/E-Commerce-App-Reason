# Launch Checklist — App Store & Google Play Submission

App: **EasyCom** (`com.ecommerceapp`)
Audit date: 2026-06-26
Status notation: 🔴 BLOCKER · 🟡 LIKELY REJECTION · 🟠 REVIEW RISK · ⚪ MINOR / BEST PRACTICE

---

## 🔴 BLOCKERS — Will be rejected or app will crash in review

### 1. Hardcoded payment gateway credentials in source code
**Files:** `src/screens/PaymentScreen.tsx:90-93, 173, 275`

Three plaintext secrets shipped in the binary:
```
Login: 'mu@postglobal'       (line 90)
Password: '#mu@76*3'         (line 90)
password: '#mpl&2384kewrf'   (lines 173, 275)
```
Both Apple and Google scan for embedded credentials. The MIPS gateway credentials are also visible in any decompiled APK/IPA. Additionally, `customerProfileCode: 136636` (line 167) is a hardcoded test user code, not `profileCode` from `route.params`.

**Fix:** Move all credentials to a backend proxy. The mobile app should never call the MIPS API directly — route payment requests through your own server which holds the secrets in environment variables.

---

### 2. Release build signed with debug keystore
**File:** `android/app/build.gradle:100-103`

```gradle
release {
  signingConfig signingConfigs.debug  // ← debug keystore on release build
}
```
The Play Store will reject an APK signed with the Android debug keystore. Google Play requires a proper release keystore, and release signing must not use `android` / `androiddebugkey` credentials.

**Fix:** Generate a production keystore, store it outside the repo, configure `signingConfigs.release` with keystore credentials from `~/.gradle/gradle.properties`, and update `buildTypes.release.signingConfig`.

---

### 3. Empty location permission description — iOS
**File:** `ios/EcommerceApp/Info.plist:34-35`

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string></string>
```
Apple rejects any app where a `NSUsageDescription` key has an empty string. If location is not actually used, remove the key entirely. If it is used (e.g., for address autofill), provide a plain-English justification explaining what benefit the user receives.

**Fix:** Either delete the key (if unused — no location code was found in the codebase), or populate the string with a meaningful description.

---

### 4. Missing Privacy Policy link — required by both stores
**All screens checked — no `PrivacyPolicy` screen or URL found anywhere.**

Apple App Store Review Guideline 5.1.1 and Google Play Policy both require:
- A privacy policy link on the store listing
- A link accessible within the app before account creation

The `RegisterScreen` and `Login` screens have no privacy policy or terms link. There is no privacy policy screen in the navigator.

**Fix:**
1. Host a privacy policy (at minimum: what data is collected, how it's used, third parties).
2. Add a tappable link on `RegisterScreen` ("By registering you agree to our [Privacy Policy] and [Terms]").
3. Add a "Privacy Policy" entry to `ProfileScreen` settings list.
4. Paste the privacy policy URL into both store listings.

---

### 5. Missing Terms of Service
Same scope as #4. Both stores expect terms to be linked at account creation. Currently absent from all registration flows.

---

### 6. App name mismatch between iOS and Android
- Android (`strings.xml`): **EasyCom**
- iOS (`Info.plist` CFBundleDisplayName): **EcommerceApp**

Both stores will show the iOS binary name "EcommerceApp" to App Store reviewers while the Android listing shows "EasyCom". Apple in particular flags generic or placeholder app names. `CFBundleDisplayName` needs to match the intended product name.

**Fix:** Set `CFBundleDisplayName` in `Info.plist` to `EasyCom`.

---

## 🟡 LIKELY REJECTION — High risk of reviewer action

### 7. Cleartext HTTP traffic to image server
**File:** `src/utils/resolveImageUrl.ts:1`

```typescript
const IMAGE_BASE = 'http://122.175.15.28:8110/';
```
All product images load over HTTP from a bare IP address. Android's `usesCleartextTraffic` is set via a build variable (`${usesCleartextTraffic}`) — the debug build resolves to `true`, but no release-specific override was found. Google Play's Data Safety policy flags unencrypted traffic, and Apple's ATS (`NSAllowsArbitraryLoads: false` in plist) will block HTTP image requests at runtime, causing all product images to fail on iOS release builds.

**Fix:** Serve images over HTTPS. If the server can't be updated immediately, add a scoped `NSExceptionDomains` entry in `Info.plist` for the specific host (not `NSAllowsArbitraryLoads: true`), and add a `network_security_config.xml` for Android with a domain-scoped cleartext exception.

---

### 8. Reactotron imported unconditionally at app entry
**File:** `index.js:6`

```js
import './src/config/reactotron';
```
Even though the Reactotron config is `__DEV__`-gated inside the file, the module itself and `reactotron-react-native` are bundled into the release build. This adds a dev-tooling dependency to the production bundle and may be flagged by automated store scanners as a debug artifact. More importantly, it increases bundle size unnecessarily.

**Fix:** Wrap the import: `if (__DEV__) require('./src/config/reactotron');`

---

### 9. Proguard / R8 disabled on Android release
**File:** `android/app/build.gradle:60,104`

```gradle
def enableProguardInReleaseBuilds = false
```
Without R8/Proguard, the entire Java + Kotlin class tree ships unobfuscated. Payment logic, internal class names, API endpoint patterns, and any remaining hardcoded strings are trivially readable from a decompiled APK. Google Play's developer policies require reasonable protection of user data; a plain-text APK with payment code fails that bar.

**Fix:** Set `enableProguardInReleaseBuilds = true` and validate the proguard-rules file doesn't strip required React Native classes.

---

### 10. `console.log` in production API layer — axiosInstance.ts
**File:** `src/api/axiosInstance.ts:42`

```typescript
console.log('[refresh] error:', e);
```
This is not `__DEV__`-gated. On Android, logs are readable via `adb logcat` even in production builds. Refresh token errors could leak auth state. The API logger (`apiLogger.ts`) is correctly gated, but this line isn't.

**Fix:** Wrap in `if (__DEV__)` or use the existing `apiError.ts` logging path.

---

### 11. `console.warn('Help not yet wired')` on OrderDetailScreen — unwired feature
**File:** `src/screens/OrderDetailScreen.tsx:605`

```typescript
<OrderActionBar onHelp={() => console.warn('Help not yet wired')} />
```
The Help button in order detail does nothing. Reviewers test the full order flow including post-purchase actions. A tappable button that silently does nothing is a rejection reason under Apple's guideline 2.1 (Completeness) and Google's Minimum Functionality policy.

**Fix:** Wire the Help button to `navigation.navigate('HelpCenter')` (screen already exists).

---

## 🟠 REVIEW RISK — Likely to generate reviewer questions or a warning

### 12. No offline / no-network state
No `@react-native-community/netinfo` or equivalent. When the device has no connectivity, every screen that calls an API will show the `ErrorState` component (which is correct), but:
- The Home screen may show a blank or partial state on first load with no network
- There is no proactive "You are offline" banner

This won't cause a rejection on its own but will fail review if a reviewer tests in airplane mode and the app presents a confusing blank screen on first launch.

**Fix:** Wrap the first fetch in a network-availability check, or ensure `ErrorState` copy is clear enough that "no connection" is understandable without a specific offline UI.

---

### 13. "Notify Me" button on WishlistScreen does nothing
**File:** `src/screens/WishlistScreen.tsx:165-170`

The button is visible and tappable but has no handler. No push notification system exists in the codebase (no FCM, no APNs token registration, no notification permission request). Apple guideline 2.1 and Google Minimum Functionality flag interactive elements that don't work.

**Fix:** Either remove the button until the feature is built, or disable it with a `TODO` toast ("Coming soon").

---

### 14. `OrderHistoryScreen` empty state requires login — but screen is accessible without auth
**File:** `src/screens/OrderHistoryScreen.tsx:505-535`

The empty state prompts "Sign in to view your orders" — good. But if a guest user somehow reaches the screen and there is a network error on top of being unauthenticated, the error state and the empty state can compete. The screen needs a clear priority: unauthenticated → empty/login prompt always wins over error.

---

### 15. `AddressScreen` FlatList has no `ListEmptyComponent`
**File:** `src/screens/AddressScreen.tsx`

The address selection screen at checkout uses a `FlatList` with no empty state component. A user with no saved addresses sees a blank list. This is a broken flow in the checkout path — a reviewer testing checkout will hit this.

**Fix:** Add a `ListEmptyComponent` with a prompt to add an address.

---

### 16. Bundle ID is generic — `com.ecommerceapp`
**File:** `android/app/build.gradle:80`, `ios/EcommerceApp.xcodeproj/project.pbxproj`

`com.ecommerceapp` is a placeholder bundle ID. Both stores require a unique reverse-domain identifier. This specific ID may already be taken on Google Play, and Apple will reject a bundle ID that doesn't correspond to your Apple Developer account's App ID.

**Fix:** Update to something like `com.mauritiuspost.easycom` before first submission. Changing bundle ID after first submission requires creating a new app listing.

---

### 17. iOS supports landscape — likely unintentional
**File:** `ios/EcommerceApp/Info.plist:67-72`

```xml
<string>UIInterfaceOrientationPortrait</string>
<string>UIInterfaceOrientationLandscapeLeft</string>
<string>UIInterfaceOrientationLandscapeRight</string>
```
The app is portrait-only by design (no landscape layouts exist). If reviewers rotate the device, layouts will break. Apple flags apps that claim to support orientations they don't actually handle.

**Fix:** Remove `UIInterfaceOrientationLandscapeLeft` and `UIInterfaceOrientationLandscapeRight` from `UISupportedInterfaceOrientations`.

---

### 18. No crash/error reporting in production
No Firebase Crashlytics, Sentry, or equivalent is configured. The `apiError.ts` TODO comment acknowledges this. Without it, post-launch crashes are invisible. This is a best-practice issue — stores won't reject for it, but the first crash wave will be undiagnosable.

**Fix:** Integrate Sentry (`@sentry/react-native`) or Firebase Crashlytics before launch.

---

### 19. No app icon for iOS (placeholder likely)
`CFBundleDisplayName` is "EcommerceApp" (placeholder) — likely the icons in `ios/EcommerceApp/Images.xcassets/AppIcon.appiconset` are also placeholder React Native defaults. Apple rejects apps with default/placeholder icons.

**Fix:** Provide a proper 1024×1024 icon and all required @1x/@2x/@3x sizes.

---

## ⚪ MINOR — Won't cause rejection but should be addressed

### 20. Accessibility coverage is thin (69 labels across 365 touchable elements)
Only ~19% of interactive elements have `accessibilityLabel`. Screens like `CartScreen`, `ProductScreen`, and `HomeScreen` have unlabelled buttons. Won't cause a rejection unless the reviewer specifically tests with VoiceOver/TalkBack, but Apple's App Review guidelines do note accessibility compliance.

---

### 21. No deep link / URL scheme configured
No `linking` config in `AppNavigator.js`, no `intentFilter` for custom URI schemes. Not a rejection reason, but means the app can't be linked into from emails/SMS/browsers — a common expectation for e-commerce apps.

---

### 22. Console logs in PaymentScreen — production
**File:** `src/screens/PaymentScreen.tsx:187, 333, 456, 516`

Four `console.error` / `console.warn` calls not gated by `__DEV__`. In release builds these become `adb logcat` output and are visible to anyone with USB access to an Android device. Low risk but worth cleaning before launch.

---

### 23. `.env` committed — Unsplash key exposed
**File:** `.env`

```
UNSPLASH_ACCESS_KEY=JJDtu053bYRmTkqFoOwVZR5iOyD_VDW_Z297bVsBhJ4
```
`.env` is correctly in `.gitignore`. Verify it was never committed to the repo (`git log --all -- .env`). The Unsplash key is public-facing and low-risk, but rotate it if the file was ever committed.

---

### 24. `versionCode 1` / `versionName "1.0"` — ensure never resubmitted with same versionCode
**File:** `android/app/build.gradle:85-86`

Google Play rejects any upload where `versionCode` is not strictly greater than the current live build. Track this rigorously — increment both `versionCode` and `versionName` for every submission.

---

### 25. iOS name "EcommerceApp" in `CFBundleName`
`CFBundleName` is `$(PRODUCT_NAME)` which resolves to the Xcode scheme name "EcommerceApp". The display name shown to users is from `CFBundleDisplayName` — fix that per item #6 above.

---

## Summary by priority

| # | Issue | Store | Severity |
|---|-------|-------|----------|
| 1 | Hardcoded payment credentials in binary | Both | 🔴 BLOCKER |
| 2 | Release APK signed with debug keystore | Google Play | 🔴 BLOCKER |
| 3 | Empty `NSLocationWhenInUseUsageDescription` | App Store | 🔴 BLOCKER |
| 4 | No Privacy Policy anywhere in-app or on listing | Both | 🔴 BLOCKER |
| 5 | No Terms of Service | Both | 🔴 BLOCKER |
| 6 | App name mismatch iOS vs Android | App Store | 🔴 BLOCKER |
| 7 | HTTP image base URL — ATS blocks on iOS release | Both | 🟡 LIKELY |
| 8 | Reactotron in production bundle | Both | 🟡 LIKELY |
| 9 | Proguard disabled — unobfuscated APK with payment code | Google Play | 🟡 LIKELY |
| 10 | `console.log` in axiosInstance not `__DEV__`-gated | Both | 🟡 LIKELY |
| 11 | Help button does nothing in Order Detail | Both | 🟡 LIKELY |
| 12 | No offline state on first launch | Both | 🟠 RISK |
| 13 | "Notify Me" button unimplemented | Both | 🟠 RISK |
| 14 | Unauthenticated + error state conflict on OrderHistory | Both | 🟠 RISK |
| 15 | AddressScreen FlatList has no empty state (breaks checkout) | Both | 🟠 RISK |
| 16 | Generic bundle ID `com.ecommerceapp` | Both | 🟠 RISK |
| 17 | Landscape orientations declared but not supported | App Store | 🟠 RISK |
| 18 | No production crash reporting | Both | ⚪ Minor |
| 19 | Likely placeholder app icon | App Store | ⚪ Minor |
| 20 | Low accessibility label coverage | Both | ⚪ Minor |
| 21 | No deep link configuration | Both | ⚪ Minor |
| 22 | Console logs in PaymentScreen | Both | ⚪ Minor |
| 23 | Verify `.env` never committed | Both | ⚪ Minor |
| 24 | Track versionCode on every submission | Google Play | ⚪ Minor |
| 25 | `CFBundleName` still "EcommerceApp" | App Store | ⚪ Minor |

---

**Minimum to submit:** Fix items 1–6. Items 7, 11, 13, 15 will fail during active review testing — fix those too before submitting to avoid the 2–7 day re-review cycle.
