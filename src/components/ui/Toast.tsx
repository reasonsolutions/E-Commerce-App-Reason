import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius, Shadow } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface AppToastProps {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  onClose?: () => void;
}

const CONFIG: Record<ToastVariant, { icon: string; iconColor: string; bg: string; border: string }> = {
  success: {
    icon:      'checkmark-circle',
    iconColor: Colors.success,
    bg:        Colors.successTint,
    border:    Colors.success,
  },
  error: {
    icon:      'alert-circle',
    iconColor: Colors.danger,
    bg:        Colors.dangerTint,
    border:    Colors.dangerBorder,
  },
  warning: {
    icon:      'warning',
    iconColor: Colors.warning,
    bg:        Colors.warningTint,
    border:    Colors.warning,
  },
  info: {
    icon:      'information-circle',
    iconColor: Colors.info,
    bg:        Colors.infoTint,
    border:    Colors.info,
  },
};

export const AppToast: React.FC<AppToastProps> = ({ variant, title, description, onClose }) => {
  const cfg = CONFIG[variant];

  return (
    <View style={[styles.container, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: cfg.border }]} />

      <View style={styles.iconWrap}>
        <Icon name={cfg.icon} size={18} color={cfg.iconColor} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {description ? (
          <Text style={styles.description} numberOfLines={3}>{description}</Text>
        ) : null}
      </View>

      {onClose ? (
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss"
        >
          <Icon name="close" size={14} color={Colors.ink3} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    marginHorizontal:  Space.screenH,
    marginBottom:      Space[3],
    borderRadius:      Radius.md,
    borderWidth:       1,
    overflow:          'hidden',
    paddingVertical:   Space[3],
    paddingRight:      Space[3],
    paddingLeft:       0,
    gap:               Space[3],
    minWidth:          200,
    maxWidth:          340,
    ...Shadow.sm,
  },
  accentBar: {
    width:  3,
    alignSelf: 'stretch',
    borderRadius: 0,
  },
  iconWrap: {
    width:          20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap:  2,
  },
  title: {
    fontFamily:    FontFamily.sans,
    fontSize:      13,
    fontWeight:    '600',
    color:         Colors.ink1,
    letterSpacing: 0.1,
    lineHeight:    13 * 1.35,
  },
  description: {
    ...Type.caption,
    color:      Colors.ink3,
    lineHeight: 13 * 1.5,
  },
});
