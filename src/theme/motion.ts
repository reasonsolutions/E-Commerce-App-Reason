// Motion vocabulary for the premium UX register.
//
// Three curves, three durations — every animation in the app binds to one of
// these. Ad-hoc durations are a code-review failure.
//
//   Tap     120ms  easeOut        press states, badge increments, icon fills
//   Settle  320ms  spring(18,80)  list entrances, screen-in, sheet rise, modal
//   Carry   560ms  easeInOut      hero parallax, OrderSuccess draw, image scrub
//
// Usage:
//   import { Motion } from '../theme/motion';
//   Animated.timing(val, { duration: Motion.duration.tap, easing: Motion.easing.out, ... })
//   Animated.spring(val,  { ...Motion.spring.settle, ... })

import { Easing } from 'react-native';

export const Motion = {
  // ── Durations (ms) ──────────────────────────────────────────────────────────
  duration: {
    tap:    120,  // press-in/out, icon state, badge bump
    settle: 320,  // list entrance, sheet rise, modal in
    carry:  560,  // hero parallax, success draw, image scrub
  },

  // ── Easing functions ────────────────────────────────────────────────────────
  easing: {
    out:     Easing.out(Easing.quad),     // Tap — snappy deceleration
    inOut:   Easing.inOut(Easing.quad),   // Carry — smooth symmetric
    linear:  Easing.linear,              // shimmer sweep
  },

  // ── Spring configs (for Animated.spring) ────────────────────────────────────
  // damping/stiffness pair: Settle feels natural, not bouncy.
  spring: {
    settle: {
      damping:    18,
      stiffness:  80,
      mass:       1,
      useNativeDriver: true,
    },
    // Tighter spring for badge counter pop — overshoots subtly then snaps.
    snap: {
      damping:    14,
      stiffness:  180,
      mass:       0.8,
      useNativeDriver: true,
    },
  },

  // ── Press scale ─────────────────────────────────────────────────────────────
  // Scale value applied on press-in. Restore to 1.0 on press-out.
  pressScale: 0.98,

  // ── Badge pop ───────────────────────────────────────────────────────────────
  // Scale sequence: 1.0 → 1.15 → 1.0 on Settle spring.
  badgePopScale: 1.15,
} as const;
