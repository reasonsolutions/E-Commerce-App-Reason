import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Space, Colors } from '../../theme';
import { FontFamily } from '../../theme/fonts';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface AppToastProps {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  onClose?: () => void;
}

const CONFIG: Record<ToastVariant, { icon: string; iconColor: string; bg: string; textColor: string }> = {
  success: {
    icon:      'checkmark-circle',
    iconColor: Colors.ink1,
    bg:        '#FFFFFF',
    textColor: Colors.ink1,
  },
  error: {
    icon:      'alert-circle',
    iconColor: '#B91C1C',
    bg:        '#FEF2F2',
    textColor: '#B91C1C',
  },
  warning: {
    icon:      'warning',
    iconColor: '#92400E',
    bg:        '#FFFBEB',
    textColor: '#92400E',
  },
  info: {
    icon:      'information-circle',
    iconColor: '#1E3A5F',
    bg:        '#EFF6FF',
    textColor: '#1E3A5F',
  },
};

export const AppToast: React.FC<AppToastProps> = ({ variant, title, description }) => {
  const cfg = CONFIG[variant];

  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      <Icon name={cfg.icon} size={16} color={cfg.iconColor} />
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: cfg.textColor }]} numberOfLines={1}>
          {title}
        </Text>
        {description ? (
          <Text style={[styles.description, { color: cfg.textColor }]} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    alignSelf:         'center',
    gap:               Space[2],
    paddingVertical:   12,
    paddingHorizontal: 20,
    borderRadius:      100,
    shadowColor:       '#000000',
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.04,
    shadowRadius:      6,
    elevation:         2,
  },
  textBlock: {
    gap: 1,
  },
  title: {
    fontFamily:    FontFamily.sans,
    fontSize:      14,
    fontWeight:    '500',
    letterSpacing: 0.1,
    lineHeight:    18,
  },
  description: {
    fontFamily: FontFamily.sans,
    fontSize:   12,
    lineHeight: 16,
    opacity:    0.8,
  },
});
