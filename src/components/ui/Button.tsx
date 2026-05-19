import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Space, Radius, FontSize } from '../../theme/tokens';
import { Type } from '../../theme/typography';
import { useTactile } from '../../hooks/useTactile';
import { useHaptic } from '../../hooks/useHaptic';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  onPress?: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { bg: string; fg: string; borderColor: string; borderWidth: number }> = {
  primary: {
    bg:          Colors.accent,
    fg:          Colors.accentInk,
    borderColor: 'transparent',
    borderWidth: 0,
  },
  secondary: {
    bg:          Colors.surface,
    fg:          Colors.ink1,
    borderColor: Colors.lineStrong,
    borderWidth: 1,
  },
  ghost: {
    bg:          'transparent',
    fg:          Colors.ink1,
    borderColor: 'transparent',
    borderWidth: 0,
  },
  destructive: {
    bg:          Colors.danger,
    fg:          '#FFFFFF',
    borderColor: 'transparent',
    borderWidth: 0,
  },
};

const sizeStyles: Record<Size, { paddingVertical: number; paddingHorizontal: number; fontSize: number; borderRadius: number }> = {
  sm: { paddingVertical: Space[2], paddingHorizontal: Space[3],  fontSize: FontSize.sm,   borderRadius: Radius.md },
  md: { paddingVertical: Space[3], paddingHorizontal: Space[4],  fontSize: FontSize.base, borderRadius: Radius.md },
  lg: { paddingVertical: Space[4], paddingHorizontal: Space[5],  fontSize: FontSize.base, borderRadius: Radius.md },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onPress,
  fullWidth = false,
  disabled = false,
  loading = false,
  leading,
  trailing,
  style,
}) => {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const inactive = disabled || loading;
  const { animatedStyle, handlers } = useTactile();
  const haptic = useHaptic();

  return (
    <Animated.View
      style={[
        animatedStyle,
        fullWidth ? styles.fullWidth : undefined,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={inactive}
        activeOpacity={1}
        {...handlers}
        onPressIn={(e) => { haptic.light(); handlers.onPressIn(e); }}
        style={[
          styles.base,
          {
            backgroundColor:   v.bg,
            borderColor:       v.borderColor,
            borderWidth:       v.borderWidth,
            paddingVertical:   s.paddingVertical,
            paddingHorizontal: s.paddingHorizontal,
            borderRadius:      s.borderRadius,
            width:             fullWidth ? '100%' : undefined,
            opacity:           inactive ? 0.45 : 1,
          },
          style,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={v.fg}
            style={styles.spinner}
          />
        ) : (
          leading ? <View style={styles.icon}>{leading}</View> : null
        )}

        <Text style={[styles.label, { color: v.fg, fontSize: s.fontSize } as TextStyle]}>
          {children}
        </Text>

        {!loading && trailing ? (
          <View style={styles.icon}>{trailing}</View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap: Space[2],
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    // Type.bodyStrong base: weight 500, lineHeight 24. fontSize and color are
    // overridden per-render by the size/variant inline style.
    ...Type.bodyStrong,
    letterSpacing: -0.1,
  },
  icon: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: Space[1],
  },
});
