import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius } from '../../theme/tokens';
import { Motion } from '../../theme/motion';

interface SkeletonProps {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  pill?: boolean;
  style?: ViewStyle;
}

// Shimmer colours: base → highlight → base sweep across the skeleton.
const SHIMMER_COLORS = [
  Colors.surfaceSoft,
  Colors.surface,
  'rgba(255,255,255,0.6)',
  Colors.surface,
  Colors.surfaceSoft,
];

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height,
  radius,
  pill = false,
  style,
}) => {
  const translateX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue:         1,
        duration:        1400,
        easing:          Motion.easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [translateX]);

  const resolvedRadius = pill ? 999 : (radius ?? Radius.sm);

  // Translate the gradient from -100% to +100% of the skeleton width.
  // Since useNativeDriver restricts transforms to numeric values, we interpolate
  // the -1→1 Animated value into a pixel range at render time using the
  // container's onLayout width. A fixed large range (600px) covers all skeleton
  // widths used in the app without needing dynamic measurement.
  const shimmerTranslate = translateX.interpolate({
    inputRange:  [-1, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius: resolvedRadius },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: shimmerTranslate }] },
        ]}
      >
        <LinearGradient
          colors={SHIMMER_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
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
    backgroundColor: Colors.surfaceSoft,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
  },
});
