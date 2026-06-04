import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, FontSize, FontWeight } from '../../theme/tokens';

export type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'Processing'
  | 'Fulfilled'
  | 'Shipped'
  | 'In transit'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

interface StatusBadgeProps {
  status: OrderStatus;
}

type StatusPalette = { fg: string; bg: string; dot: string };

// Premium register: ember for in-progress, ink for completed, muted danger for cancelled.
// Retired: saturated semantic tints (warningTint/infoTint) — too noisy.
const palette: Record<OrderStatus, StatusPalette> = {
  New:          { fg: Colors.ink3,     bg: Colors.surfaceDeep,  dot: Colors.ink4 },
  Confirmed:    { fg: Colors.accent,   bg: Colors.accentTint,   dot: Colors.accent },
  Processing:   { fg: Colors.accent,   bg: Colors.accentTint,   dot: Colors.accent },
  Fulfilled:    { fg: Colors.accent,   bg: Colors.accentTint,   dot: Colors.accent },
  Shipped:      { fg: Colors.accent,   bg: Colors.accentTint,   dot: Colors.accent },
  'In transit': { fg: Colors.accent,   bg: Colors.accentTint,   dot: Colors.accent },
  Delivered:    { fg: Colors.ink2,     bg: Colors.surfaceDeep,  dot: Colors.ink3 },
  Cancelled:    { fg: Colors.danger,   bg: Colors.dangerTint,   dot: Colors.danger },
  Returned:     { fg: Colors.danger,   bg: Colors.dangerTint,   dot: Colors.danger },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const c = palette[status] ?? palette.Confirmed;

  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.dot }]} />
      <Text style={[styles.label, { color: c.fg }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    alignSelf:         'flex-start',
    paddingVertical:   2,
    paddingHorizontal: 8,
    borderRadius:      Radius.pill,
    gap:               5,
  },
  dot: {
    width:        4,
    height:       4,
    borderRadius: 2,
  },
  label: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.medium,
    letterSpacing: 0.3,
    lineHeight:    FontSize.xs * 1.4,
  },
});
