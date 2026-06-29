# Security Audit — E-Commerce App (React Native)

**Date:** 2026-06-26  
**Branch:** `dev`  
**Scope:** Authentication, token storage, API layer, payment flow, data handling, transport security

---

## Summary

| Severity | Count |
|----------|-------|
| HIGH     | 3     |
| MEDIUM   | 2     |

---

## HIGH Severity

---

### VULN-1: Hardcoded Payment Gateway Credentials in Source Code

**File:** [src/screens/PaymentScreen.tsx](src/screens/PaymentScreen.tsx) — Lines 89–93, 171–175, 273–277

**Category:** `credentials_exposure`  
**Confidence:** 10/10

**Description:**  
Three sets of credentials for the MIPS payment gateway are hardcoded directly in TypeScript source:

- `Login: 'mu@postglobal'` / `Password: '#mu@76*3'` — used to obtain the MIPS auth token
- `user: 'mplpgPay'` / `password: '#mpl&2384kewrf'` — used as HTTP Basic-style headers on `loadPaymentZone` and `getPaymentStatus` calls

These are production credentials for a live payment processor (Mauritius Post MIPS). Anyone with access to the compiled app binary, the git repository, or this source file can extract them.

**Exploit Scenario:**  
An attacker decompiles the APK/IPA (trivial with standard tools), extracts the credentials, and directly calls `https://maupost.mauritiuspost.mu:8087/api/token/create` and subsequent payment endpoints outside of the app. Depending on MIPS's authorization model, this could allow: forging payment status responses for arbitrary order IDs, initiating fraudulent payment zones, or enumerating transaction data.

**Recommendation:**  
- Move all payment gateway credentials to the backend. The app should request a short-lived, order-scoped token from your own server, which holds the MIPS credentials in a secrets manager (e.g., Azure Key Vault).  
- Never put third-party API credentials in client-side code. The React Native bundle is easily reversible regardless of obfuscation.

---

### VULN-2: Keychain Token Stored at `SECURITY_LEVEL.ANY` — Bypasses Secure Enclave

**File:** [src/screens/Login.tsx](src/screens/Login.tsx) — Lines 191–202  
**File:** [src/api/axiosInstance.ts](src/api/axiosInstance.ts) — Lines 36–39

**Category:** `insecure_credential_storage`  
**Confidence:** 9/10

**Description:**  
Both the access token and the refresh token are stored in the iOS/Android Keychain with `securityLevel: Keychain.SECURITY_LEVEL.ANY`. On iOS, `ANY` uses `kSecAttrAccessibleAlwaysThisDeviceOnly` — accessible even when the device is locked, and not backed by the Secure Enclave. On Android, `ANY` allows storage in the software keystore without requiring user authentication (biometric/PIN).

For a refresh token — which is long-lived and can mint new access tokens — this is a significant downgrade from the available protection level.

**Exploit Scenario:**  
On a jailbroken iOS device or a rooted Android device (common in a shared/compromised device scenario), an attacker with filesystem access can read Keychain entries stored at `ANY` without needing to pass biometric authentication. They extract the refresh token and use it to obtain fresh access tokens for the victim's account indefinitely, even after the device is recovered.

**Recommendation:**  
- Use `SECURITY_LEVEL.SECURE_HARDWARE` for the refresh token (falls back to `SECURE_SOFTWARE` where hardware is unavailable).  
- For the access token, `SECURE_SOFTWARE` is acceptable given its short lifetime, but `ANY` removes all OS-enforced access control.  
- Consider adding `accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET` for the refresh token to require re-authentication on sensitive flows.

---

### VULN-3: Product Images Served Over Plaintext HTTP

**File:** [src/utils/resolveImageUrl.ts](src/utils/resolveImageUrl.ts) — Line 1

**Category:** `transport_security` / `mitm`  
**Confidence:** 9/10

**Description:**  
All product images are fetched from a hardcoded plaintext HTTP origin: `http://122.175.15.28:8110/`. This is a raw IP address (no hostname, no TLS). Every product image load in the app — including images shown on the Home screen, Product Detail screen, Cart, and Order History — transits the network unencrypted.

`mixedContentMode="always"` in the WebView (PaymentScreen line 512) was likely added to accommodate this HTTP origin being loaded inside a payment WebView context.

**Exploit Scenario:**  
On any network the user doesn't fully control (public Wi-Fi, mobile carrier with transparent proxy, hotel/airport network), an attacker performing a network MitM can:
1. Replace product images with malicious content (phishing, scam banners).
2. Observe which products a user is browsing (PII leak — browsing behavior tied to session).
3. On Android where `mixedContentMode="always"` is set for the payment WebView, a MitM could inject content into the WebView frame that hosts payment flows.

The `mixedContentMode="always"` setting is particularly dangerous for point 3 — it explicitly allows HTTP resources to load within an HTTPS payment page context.

**Recommendation:**  
- Serve all media assets over HTTPS. Obtain a TLS certificate for the image server.  
- Remove the raw IP address; use a hostname that can receive a valid certificate.  
- Remove `mixedContentMode="always"` from the payment WebView — use the default `"never"` or `"compatibility"`.  
- On iOS, add a `NSAppTransportSecurity` exception only for the specific domain during migration, not a blanket `NSAllowsArbitraryLoads`.

---

## MEDIUM Severity

---

### VULN-4: User Password Transmitted in Navigation Route Params

**File:** [src/screens/RegisterScreen.tsx](src/screens/RegisterScreen.tsx) — Lines 106–113  
**File:** [src/screens/OTPVerificationScreen.tsx](src/screens/OTPVerificationScreen.tsx) — Line 42

**Category:** `sensitive_data_exposure`  
**Confidence:** 9/10

**Description:**  
During registration, the user's plaintext password is passed as a navigation route parameter to `OTPVerificationScreen`:

```typescript
navigation.navigate('OTPVerification', {
  CustomerName: name.trim(),
  EmailID:      email.trim(),
  MobileNumber: mobile.trim(),
  CountryCode:  230,
  Password:     password,   // ← plaintext
});
```

`OTPVerificationScreen` reads `Password` from `route.params` and re-sends it to the API on OTP resend and on confirmation. React Navigation stores route params in navigation state, which is accessible via `navigation.getState()` from any screen in the navigator, and can be serialized to `AsyncStorage` if deep-link state persistence is enabled.

**Exploit Scenario:**  
Any component with access to the navigation ref (including `navigationService.ts` which is module-global) can read the full navigation state and extract the password from the OTPVerification route params. If navigation state persistence is ever enabled (common React Navigation pattern), the password would also be written to `AsyncStorage` in plaintext.

**Recommendation:**  
- Do not pass secrets through navigation params. Instead, store the password temporarily in a module-scoped variable or React context that is explicitly cleared after OTP verification completes.  
- Alternatively, re-prompt for the password on OTP confirmation rather than carrying it forward.

---

### VULN-5: WebView `originWhitelist={['*']}` Allows Arbitrary Navigation in Payment Screen

**File:** [src/screens/PaymentScreen.tsx](src/screens/PaymentScreen.tsx) — Line 511

**Category:** `webview_security`  
**Confidence:** 8/10

**Description:**  
The payment WebView uses `originWhitelist={['*']}`, which allows the WebView to navigate to any URL or scheme, including `javascript:`, `file://`, `intent://` (Android), and custom deep-link schemes. Combined with `mixedContentMode="always"` and `thirdPartyCookiesEnabled`, this creates an open surface for the payment page (or a MitM-injected payload) to redirect the WebView to a local file, execute JavaScript, or invoke native Android intents.

**Exploit Scenario:**  
If the MIPS payment page contains an open redirect, or if a MitM injects a redirect (enabled by the HTTP image server on the same session — see VULN-3), the WebView can be navigated to `file:///data/data/<package>/` (Android) to read app-local storage, or to a `javascript:` URL to execute arbitrary JS within the WebView's origin.

**Recommendation:**  
- Restrict `originWhitelist` to the specific MIPS domain: `['https://maupost.mauritiuspost.mu']`.  
- Add an `onNavigationStateChange` or `onShouldStartLoadWithRequest` handler that blocks navigations to non-MIPS origins.  
- Remove `mixedContentMode="always"` (see VULN-3).  
- Consider `setSupportMultipleWindows={true}` is already set to `false`, which is correct — keep it.

---

## Informational Notes (Not Ranked)

These are not exploitable vulnerabilities under the defined scope but are noted for completeness:

- **`src/config/reactotron.ts`:** Reactotron's `useReactNative({ networking: true })` intercepts all network traffic for inspection. It is correctly guarded by `if (__DEV__)` and poses no production risk as-is. Ensure the `__DEV__` flag is correctly set to `false` in all production build configurations.
- **`src/api/apiLogger.ts`:** All logger functions are guarded by `if (!__DEV__) return` — no logging in production. The `maskSensitive` function correctly redacts `token`, `authorization`, `accesstoken`, `refreshtoken` keys. The `SENSITIVE_KEYS` set does not cover `password` or `LoginID` — these would appear in dev logs during login requests. This is low risk (dev-only) but worth noting.
- **Token refresh race condition (`axiosInstance.ts`):** The `_refreshPromise` deduplication correctly prevents multiple concurrent refresh calls. No issue.
- **`isLoggedIn()` in `auth.ts`:** Returns `true` based solely on Keychain key presence without validating token expiry. This is intentional (expiry detected reactively via 401) and is documented. The 401 interceptor handles cleanup correctly.
