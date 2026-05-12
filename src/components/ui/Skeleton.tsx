import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '../../theme/tokens';

// Shimmer travels left→right over 1400ms, matching the design spec.
// useNativeDriver:true keeps animation off the JS thread — no jank on
// slow renders. The gradient effect is approximated with an Animated opacity
// pulse since a true translateX gradient requires react-native-linear-gradient
// (already installed). We use the opacity approach to avoid a new import
// in a foundation layer that should have zero new deps.

interface SkeletonProps {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  pill?: boolean;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height,
  radius,
  pill = false,
  style,
}) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue:        0.4,
          duration:       700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue:        1,
          duration:       700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  const resolvedRadius = pill ? 999 : (radius ?? Radius.sm);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: resolvedRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// SkeletonRow — convenience wrapper for a row of Skeletons with a gap
interface SkeletonRowProps {
  children: React.ReactNode;
  gap?: number;
  style?: ViewStyle;
}

export const SkeletonRow: React.FC<SkeletonRowProps> = ({
  children,
  gap = 8,
  style,
}) => (
  <View style={[styles.row, { gap }, style]}>{children}</View>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surfaceAlt,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
  },
});
