import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, FontSize, FontWeight } from '../../theme/tokens';

export type OrderStatus =
  | 'Confirmed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'In transit';

interface StatusBadgeProps {
  status: OrderStatus;
}

type StatusPalette = { fg: string; bg: string; dot: string };

const palette: Record<OrderStatus, StatusPalette> = {
  Confirmed:   { fg: Colors.warning, bg: Colors.warningTint, dot: Colors.warning },
  Shipped:     { fg: Colors.info,    bg: Colors.infoTint,    dot: Colors.info },
  'In transit':{ fg: Colors.info,    bg: Colors.infoTint,    dot: Colors.info },
  Delivered:   { fg: Colors.success, bg: Colors.successTint, dot: Colors.success },
  Cancelled:   { fg: Colors.danger,  bg: Colors.dangerTint,  dot: Colors.danger },
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
    flexDirection:  'row',
    alignItems:     'center',
    alignSelf:      'flex-start',
    paddingVertical:  4,
    paddingHorizontal: 10,
    borderRadius:   Radius.pill,
    gap: 6,
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  label: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.semibold,
    letterSpacing: 0.1,
  },
});
