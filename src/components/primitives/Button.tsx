import React from 'react';
import {
  TouchableOpacity,
  Text as RNText,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
  type TextProps,
} from 'react-native';
type ButtonProps = TouchableOpacityProps & { isDisabled?: boolean };

const Button = React.forwardRef<View, ButtonProps>(
  ({ isDisabled, disabled, activeOpacity, ...props }, ref) => (
    <TouchableOpacity
      ref={ref as any}
      disabled={isDisabled ?? disabled}
      activeOpacity={activeOpacity ?? 1}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

const ButtonText = React.forwardRef<RNText, TextProps>((props, ref) => (
  <RNText ref={ref} {...props} />
));
ButtonText.displayName = 'ButtonText';

const ButtonSpinner = ({ color = '#000000' }: { color?: string }) => (
  <ActivityIndicator color={color} />
);
ButtonSpinner.displayName = 'ButtonSpinner';

export { Button, ButtonText, ButtonSpinner };
