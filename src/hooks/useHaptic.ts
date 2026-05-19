// Haptic feedback wrapper.
//
// Wraps `react-native-haptic-feedback` with a graceful availability guard.
// If the native module is not linked (e.g. before `pod install` has been run
// with the package installed), every method is a silent no-op. No crash.
//
// ── Installation ────────────────────────────────────────────────────────────
// The package is NOT yet in package.json. To activate:
//
//   npm install react-native-haptic-feedback
//   cd ios && pod install && cd ..
//   npx react-native run-ios   (rebuild required — Metro reload is not enough)
//
// After installation the guard below resolves the module and all haptic calls
// become live. No changes to call sites needed.
//
// ── Usage ───────────────────────────────────────────────────────────────────
//   const haptic = useHaptic();
//   haptic.light();    // tab press, wishlist toggle, row select
//   haptic.success();  // add-to-cart confirmed, order placed
//   haptic.warning();  // login failure shake, destructive confirm
//   haptic.medium();   // reserved — stronger interactions
//
// ── Motion binding ───────────────────────────────────────────────────────────
// Per spec A4:
//   Tap interactions   → haptic.light()
//   Success moments    → haptic.success()
//   Failure / shake    → haptic.warning()

import { useCallback } from 'react';

// Type-only declaration so TypeScript compiles without the package installed.
// The runtime require() is guarded; if the module resolves, we use it.
type HapticFeedbackType =
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';

interface HapticModule {
  trigger: (type: HapticFeedbackType, options?: { enableVibrateFallback?: boolean }) => void;
}

function resolveHaptic(): HapticModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-haptic-feedback');
    return mod?.default ?? mod ?? null;
  } catch {
    return null;
  }
}

// Module is resolved once at module load — not per render.
const hapticModule = resolveHaptic();

const OPTIONS = { enableVibrateFallback: true } as const;

function fire(type: HapticFeedbackType): void {
  hapticModule?.trigger(type, OPTIONS);
}

export interface HapticActions {
  /** Tab press, wishlist toggle, row select, variant chip change. */
  light:   () => void;
  /** Reserved for stronger interactions. */
  medium:  () => void;
  /** Add-to-cart confirmed, order placed, checkmark draw complete. */
  success: () => void;
  /** Login failure, destructive action confirm, form validation error. */
  warning: () => void;
}

/**
 * Returns stable haptic trigger functions. Safe to call unconditionally —
 * silently no-ops when `react-native-haptic-feedback` is not installed.
 */
export function useHaptic(): HapticActions {
  const light   = useCallback(() => fire('impactLight'),          []);
  const medium  = useCallback(() => fire('impactMedium'),         []);
  const success = useCallback(() => fire('notificationSuccess'),  []);
  const warning = useCallback(() => fire('notificationWarning'),  []);
  return { light, medium, success, warning };
}
