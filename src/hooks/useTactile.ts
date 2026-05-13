// Press-scale animator — the tactile layer for interactive elements.
//
// Provides a scale Animated.Value that compresses to Motion.pressScale (0.97)
// on press-in and springs back to 1.0 on press-out, using the Tap (120ms easeOut)
// and Settle (320ms spring) curves from Motion.
//
// ── Usage ───────────────────────────────────────────────────────────────────
//
//   const { animatedStyle, handlers } = useTactile();
//
//   <Animated.View style={[styles.card, animatedStyle]}>
//     <TouchableOpacity {...handlers} onPress={onPress} activeOpacity={1}>
//       {children}
//     </TouchableOpacity>
//   </Animated.View>
//
// The Animated.View wraps the TouchableOpacity so the scale transform applies
// to the whole element. Set activeOpacity={1} on the inner TouchableOpacity to
// suppress the default opacity flash — the scale provides the feedback instead.
//
// ── Why separate from TouchableOpacity ──────────────────────────────────────
// React Native's TouchableOpacity cannot animate its own scale — it only
// supports opacity. The Animated.View wrapper pattern is the idiomatic RN
// approach and preserves useNativeDriver: true (no JS-thread involvement).
//
// ── Integration order ───────────────────────────────────────────────────────
// This hook is Phase 1 infrastructure. Adoption into Button, ProductCard,
// WishlistCard, OrderRow, etc. is Phase 2 work per the spec. Do not wire it
// into existing components in this task.

import { useRef, useCallback } from 'react';
import { Animated, GestureResponderEvent } from 'react-native';
import { Motion } from '../theme/motion';

export interface TactileHandlers {
  onPressIn:  (e: GestureResponderEvent) => void;
  onPressOut: (e: GestureResponderEvent) => void;
}

export interface TactileResult {
  /** Spread onto the Animated.View that wraps the pressable element. */
  animatedStyle: { transform: { scale: Animated.Value }[] };
  /** Spread onto the inner TouchableOpacity (or Pressable). */
  handlers: TactileHandlers;
  /** The raw Animated.Value — use if you need to compose with other transforms. */
  scale: Animated.Value;
}

/**
 * Returns press-scale animation infrastructure.
 * Compress on press-in (Tap, 120ms easeOut), spring back on press-out (Settle).
 *
 * @param pressScale  - Target scale on press-in. Defaults to Motion.pressScale (0.97).
 */
export function useTactile(pressScale: number = Motion.pressScale): TactileResult {
  const scale = useRef(new Animated.Value(1)).current;

  const compress = useCallback(() => {
    Animated.timing(scale, {
      toValue:         pressScale,
      duration:        Motion.duration.tap,
      easing:          Motion.easing.out,
      useNativeDriver: true,
    }).start();
  }, [scale, pressScale]);

  const release = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      ...Motion.spring.settle,
    }).start();
  }, [scale]);

  const onPressIn  = useCallback((_e: GestureResponderEvent) => compress(), [compress]);
  const onPressOut = useCallback((_e: GestureResponderEvent) => release(),  [release]);

  return {
    animatedStyle: { transform: [{ scale }] },
    handlers:      { onPressIn, onPressOut },
    scale,
  };
}
