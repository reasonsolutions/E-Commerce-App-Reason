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
  | 'Returned'
  // UI-only display state — synthesized client-side when an order's items
  // have different statuses (see mixedStatusSummary in OrderHistoryScreen.tsx).
  // Never comes from the API; not a real OrderStatusCode value.
  | 'Mixed';

interface StatusBadgeProps {
  status: OrderStatus;
}

type StatusPalette = { fg: string; bg: string; dot: string };

// Premium register: ember for placed/in-progress, ink for completed, muted danger for cancelled.
// Retired: saturated semantic tints (warningTint/infoTint) — too noisy.
const palette: Record<OrderStatus, StatusPalette> = {
  New:          { fg: Colors.emberDeep, bg: Colors.brandNavyTint, dot: Colors.emberDeep },  // ember tint
  Confirmed:    { fg: '#1D4ED8', bg: '#DBEAFE', dot: '#3B82F6' },  // blue
  Processing:   { fg: '#1D4ED8', bg: '#DBEAFE', dot: '#3B82F6' },  // blue
  Fulfilled:    { fg: '#6D28D9', bg: '#EDE9FE', dot: '#8B5CF6' },  // violet
  Shipped:      { fg: '#6D28D9', bg: '#EDE9FE', dot: '#8B5CF6' },  // violet
  'In transit': { fg: '#6D28D9', bg: '#EDE9FE', dot: '#8B5CF6' },  // violet
  Delivered:    { fg: Colors.success, bg: Colors.successTint, dot: Colors.success },
  Cancelled:    { fg: Colors.danger,  bg: Colors.dangerTint,  dot: Colors.danger },
  Returned:     { fg: Colors.danger,  bg: Colors.dangerTint,  dot: Colors.danger },
  // Neutral — doesn't imply progress, success, or failure; paired with a
  // subtitle spelling out the actual per-item breakdown.
  Mixed:        { fg: Colors.ink3, bg: Colors.surfaceDeep, dot: Colors.ink3 },
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
  Mixed:        'Mixed Status',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const c = palette[status] ?? palette.Confirmed;

  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.dot }]} />
      <Text
        style={[styles.label, { color: c.fg }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {displayLabel[status] ?? status}
      </Text>
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
    flexShrink:   0,
  },
  label: {
    flexShrink:    1,
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.medium,
    letterSpacing: 0.3,
    lineHeight:    FontSize.xs * 1.4,
  },
});
