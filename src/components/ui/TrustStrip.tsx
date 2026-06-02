import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { Type } from '../../theme/typography';

const ITEMS = [
  { icon: 'refresh-outline',     label: '7-day returns' },
  { icon: 'lock-closed-outline', label: 'Secure checkout' },
  { icon: 'ribbon-outline',      label: '100% authentic' },
  { icon: 'cash-outline',        label: 'Cash on delivery' },
];

export const TrustStrip: React.FC = () => (
  <View style={styles.wrap}>
    {ITEMS.map((it) => (
      <View key={it.label} style={styles.item}>
        <Icon name={it.icon} size={23} color={Colors.ink2} />
        <Text style={styles.label}>{it.label}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection:    'row',
    marginTop:        Space[10],
    paddingVertical:  Space[6],
    paddingHorizontal: Space[3],
    backgroundColor:  Colors.surfaceSoft,
    borderTopWidth:   StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor:      Colors.rule,
  },
  item: {
    flex:            1,
    alignItems:      'center',
    gap:             Space[2] + 2,
  },
  label: {
    ...Type.label,
    color:      Colors.ink2,
    textAlign:  'center',
    lineHeight: 14,
  },
});
