import React from 'react';
import { TouchableOpacity, type TouchableOpacityProps } from 'react-native';
import { Text } from '../primitives';

interface TextLinkButtonProps extends TouchableOpacityProps {
  label: string;
}

// Secondary underlined text-link action. The visual counterpart to PrimaryButton.
// Use for "Buy Now", "View All", "Forgot password?" — any secondary CTA
// that must not compete with the primary action weight.
export const TextLinkButton: React.FC<TextLinkButtonProps> = ({
  label,
  accessibilityLabel,
  ...rest
}) => (
  <TouchableOpacity
    className="items-center py-1"
    activeOpacity={0.6}
    accessibilityLabel={accessibilityLabel ?? label}
    accessibilityRole="button"
    {...rest}
  >
    <Text className="text-sm text-ink3 underline" style={{ letterSpacing: 0.2 }}>
      {label}
    </Text>
  </TouchableOpacity>
);
