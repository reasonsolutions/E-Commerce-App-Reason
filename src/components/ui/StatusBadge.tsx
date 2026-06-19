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
  New:          { fg: '#92650A', bg: '#FEF3C7', dot: '#D97706' },  // amber
  Confirmed:    { fg: '#1D4ED8', bg: '#DBEAFE', dot: '#3B82F6' },  // blue
  Processing:   { fg: '#1D4ED8', bg: '#DBEAFE', dot: '#3B82F6' },  // blue
  Fulfilled:    { fg: '#6D28D9', bg: '#EDE9FE', dot: '#8B5CF6' },  // violet
  Shipped:      { fg: '#6D28D9', bg: '#EDE9FE', dot: '#8B5CF6' },  // violet
  'In transit': { fg: '#6D28D9', bg: '#EDE9FE', dot: '#8B5CF6' },  // violet
  Delivered:    { fg: Colors.success, bg: Colors.successTint, dot: Colors.success },
  Cancelled:    { fg: Colors.danger,  bg: Colors.dangerTint,  dot: Colors.danger },
  Returned:     { fg: Colors.danger,  bg: Colors.dangerTint,  dot: Colors.danger },
};

const displayLabel: Record<OrderStatus, string> = {
  New:          'Order Placed',
  Confirmed:    'Confirmed',
  Processing:   'Processing',
  Fulfilled:    'Packed',
  Shipped:      'Shipped',
  'In transit': 'In Transit',
  Delivered:    'Delivered',
  Cancelled:    'Cancelled',
  Returned:     'Return Initiated',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const c = palette[status] ?? palette.Confirmed;

  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.dot }]} />
      <Text style={[styles.label, { color: c.fg }]}>{displayLabel[status] ?? status}</Text>
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
