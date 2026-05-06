# CLAUDE.md

## Safety Rules (Strict)

These rules override all other instructions.

- Do not read `.env` files or any sensitive configuration/secrets
- Never run `git add`, `commit`, `push`, `branch`, or `merge` commands
- Never execute destructive shell commands (`rm`, `mv`, overwrite files)
- Do not refactor multiple files unless explicitly requested
- Limit changes strictly to explicitly mentioned files only
- Do not generate or suggest changes outside the requested scope

---

## Operating Mode

- Directly implement changes when asked — use Edit/Write tools to modify source files
- Analyze the repository and provide precise, minimal changes
- Respect existing architecture, patterns, and naming conventions
- Ask for clarification if scope is ambiguous

---

## Project Overview

React Native e-commerce mobile app (iOS + Android) built with TypeScript. Supports product browsing, cart management, checkout with address input, and order history. Authentication is login-based with customer profile codes persisted via AsyncStorage.

---

## Commands

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android

# Metro bundler
npx react-native start

# TypeScript check
npx tsc --noEmit

# Lint
npx eslint . --ext .js,.jsx,.ts,.tsx

# Tests
npx jest
```

There is no Vite dev server — this is a React Native app using Metro bundler.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native 0.81.4 |
| Language | TypeScript 5.8.3 (mixed with JS in some files) |
| Navigation | React Navigation v7 (Stack) |
| State | Context API + useReducer (cart), useState (local), AsyncStorage (auth) |
| HTTP | Axios (centralized instance in `src/api/axiosInstance.ts`) |
| Icons | react-native-vector-icons |
| Animations | lottie-react-native |
| Testing | Jest 29 with React Native preset |

---

## Project Structure

```
/
├── App.tsx                  # Root component — wraps SafeAreaProvider, CartProvider, AppNavigator
├── index.js                 # React Native entry point (AppRegistry)
├── src/
│   ├── api/
│   │   ├── axiosInstance.ts # Axios base URL + timeout config
│   │   ├── integrations.ts  # All API call functions (async/await)
│   │   ├── interfaces.ts    # TypeScript interfaces for API types
│   │   ├── endpoints.js     # API endpoint string constants
│   │   └── url.js           # Base URL constant
│   ├── components/
│   │   ├── ProductCard.tsx
│   │   ├── CategoryItem.tsx
│   │   └── CartItem.js
│   ├── context/
│   │   └── CartContext.js   # Cart state — actions: ADD/REMOVE/UPDATE_QUANTITY/CLEAR
│   ├── navigation/
│   │   └── AppNavigator.js  # Stack navigator, 10 routes, initial route: Login
│   ├── screens/             # 10 screens (see Navigation below)
│   └── data/
│       └── mockData.js      # Local fallback data for categories/products/hero banner
├── android/                 # Android native project
├── ios/                     # iOS native project
└── assets/images/           # Image assets
```

---

## Navigation

Stack navigator with all headers hidden by default. Initial route is `Login`.

| Route name | Screen file |
|---|---|
| `Login` | src/screens/Login.tsx |
| `Home` | src/screens/HomeScreen.tsx |
| `Product` | src/screens/ProductScreen.tsx |
| `Cart` | src/screens/CartScreen.tsx |
| `Result` | src/screens/ResultScreen.tsx |
| `Address` | src/screens/AddressScreen.tsx |
| `OrderSuccess` | src/screens/OrderSuccessScreen.tsx |
| `Orders` | src/screens/OrderHistoryScreen.tsx |
| `OrderDetails` | src/screens/OrderDetailScreen.tsx |
| `Profile` | src/screens/ProfileScreen.tsx |

---

## State Management

**Cart (global):** `src/context/CartContext.js`
- `useCart()` hook for access anywhere
- Cart items are keyed by `{id, selectedColor, selectedStorage}` — the same product with different variants is treated as a separate line item
- Exposed: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `getCartItemsCount`, `getCartTotal`

**Auth (persistent):** AsyncStorage — stores customer profile code after login.

**Screen-local state:** `useState` + `useEffect`. Use `useFocusEffect` (from React Navigation) for logic that must re-run when a screen comes into focus.

---

## API Layer

- Base URL: `http://122.175.15.28:8110/api/ecomm/` (configured in `src/api/url.js`)
- All HTTP calls go through the centralized axios instance (`src/api/axiosInstance.ts`)
- Add new endpoints to `src/api/endpoints.js`, new call functions to `src/api/integrations.ts`, and new types to `src/api/interfaces.ts`

---

## Code Conventions

- **Components:** Functional components with hooks. Use `FC<Props>` typing in `.tsx` files.
- **Styling:** `StyleSheet.create()` scoped to each component/screen file — no global stylesheets.
- **TypeScript:** Core API layer is typed. Some components and context files remain plain JS — do not add TS to JS files unless the task explicitly requires it.
- **Formatting:** Single quotes, trailing commas, avoid arrow-function parens (`.prettierrc.js`).
- **No comments** unless the WHY is non-obvious (hidden constraint, workaround, subtle invariant).

---

## File Conventions

- Screens: `src/screens/ScreenName.tsx` (or `.tsx`)
- Reusable components: `src/components/ComponentName.tsx`
- New API types: add to `src/api/interfaces.ts`
- New endpoints: add constant to `src/api/endpoints.js`, function to `src/api/integrations.ts`
