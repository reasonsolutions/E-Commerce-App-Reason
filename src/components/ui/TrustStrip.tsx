import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { FontFamily } from '../../theme/fonts';

const ITEMS = [
  { icon: 'shield-checkmark-outline', label: 'Genuine products' },
  { icon: 'flash-outline',            label: 'Island-wide delivery' },
  { icon: 'refresh-outline',          label: '7-day returns' },
  { icon: 'lock-closed-outline',      label: 'Secure payments' },
];

export const TrustStrip: React.FC = () => (
  <View style={styles.wrap}>
    {ITEMS.map((it) => (
      <View key={it.label} style={styles.cell}>
        <Icon name={it.icon} size={15} color={Colors.ink3} />
        <Text style={styles.label}>{it.label}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[3] + 2,
    gap:               Space[2],
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  cell: {
    width:         '48%',
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
    paddingVertical: 3,
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize:   11.5,
    fontWeight: '400',
    color:      Colors.ink3,
    flexShrink: 1,
  },
});
