import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

type EntranceStyle = {
  opacity: Animated.Value;
  transform: ({ translateY: Animated.Value } | { scale: Animated.Value })[];
};

/**
 * Entrance animation: fade-in + slide-up, optionally with a scale materialisation.
 * Durations: opacity 480ms, translateY 420ms (scale 600ms when withScale=true).
 *
 * NOTE: HomeScreen keeps its own local copy — it uses different durations (500/440)
 * and initialY=14 which are intentional for its hero section feel.
 *
 * @param delay      - Start delay in ms (default 0)
 * @param withScale  - Add a subtle scale pop-in (default false)
 * @param initialY   - Starting translateY offset in points (default 10)
 */
export function useEntrance(delay = 0, withScale = false, initialY = 10): EntranceStyle {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(initialY)).current;
  const scale      = useRef(new Animated.Value(withScale ? 0.97 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: withScale ? 700 : 480, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
      ...(withScale
        ? [Animated.timing(scale, { toValue: 1, duration: 600, delay, useNativeDriver: true })]
        : []),
    ]).start();
  }, [opacity, translateY, scale, delay, withScale]);

  return {
    opacity,
    transform: withScale ? [{ translateY }, { scale }] : [{ translateY }],
  };
}
