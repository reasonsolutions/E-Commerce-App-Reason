import React from 'react';
import { Pressable } from '../primitives';
import Icon from 'react-native-vector-icons/Ionicons';

interface HeroNavButtonProps {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  // Override icon color — defaults to white for hero overlay context
  iconColor?: string;
  // Animated child to wrap inside (e.g. Animated.View for badge pop)
  children?: React.ReactNode;
}

// Glass-circle icon button for floating hero navigation overlays.
// Used on hero images where the background is a product photo.
// Canonical usage: back button, wishlist, cart in ProductScreen hero,
// and any future fullscreen image hero (gallery, editorial).
export const HeroNavButton: React.FC<HeroNavButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  iconColor = '#FFFFFF',
  children,
}) => (
  <Pressable
    className="w-9 h-9 rounded-full items-center justify-center"
    style={{ backgroundColor: 'rgba(0,0,0,0.22)' }}
    onPress={onPress}
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
  >
    {children ?? <Icon name={icon} size={20} color={iconColor} />}
  </Pressable>
);
