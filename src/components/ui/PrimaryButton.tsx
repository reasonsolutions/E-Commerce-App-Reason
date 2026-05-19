import React from 'react';
import { Animated, ActivityIndicator } from 'react-native';
import { Button, ButtonText } from '../primitives';
import { useTactile } from '../../hooks/useTactile';
import { type TouchableOpacityProps } from 'react-native';

interface PrimaryButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  label: string;
  loading?: boolean;
  isDisabled?: boolean;
  height?: number;
}

// Full-width ink pill CTA — the canonical primary action button for the app.
// Wraps useTactile so callers don't wire it manually. Handles loading state.
// Use for every "Add to Bag", "Place Order", "Confirm" action.
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  loading = false,
  isDisabled = false,
  height = 52,
  onPress,
  accessibilityLabel,
  ...rest
}) => {
  const tactile = useTactile();

  return (
    <Animated.View style={tactile.animatedStyle}>
      <Button
        className="w-full rounded-full bg-ink1 items-center justify-center"
        style={{ height, borderWidth: 0 }}
        onPress={onPress}
        {...tactile.handlers}
        isDisabled={loading || isDisabled}
        accessibilityLabel={accessibilityLabel ?? label}
        {...rest}
      >
        {loading
          ? <ActivityIndicator color="#FFFFFF" />
          : <ButtonText
              className="text-white font-semibold text-base"
              style={{ letterSpacing: 0.3 }}
            >
              {label}
            </ButtonText>
        }
      </Button>
    </Animated.View>
  );
};
