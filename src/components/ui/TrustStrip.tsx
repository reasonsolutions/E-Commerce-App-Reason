import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { Type } from '../../theme/typography';

const ITEMS = [
  { icon: 'shield-checkmark-outline', label: '100% Authentic' },
  { icon: 'refresh-outline',          label: 'Easy Returns'   },
  { icon: 'flash-outline',            label: 'Fast Delivery'  },
  { icon: 'lock-closed-outline',      label: 'Secure Payments'},
];

export const TrustStrip: React.FC = () => (
  <View style={styles.wrap}>
    <View style={styles.grid}>
      {ITEMS.map((it) => (
        <View key={it.label} style={styles.cell}>
          <Icon name={it.icon} size={22} color={Colors.ink3} style={styles.icon} />
          <Text style={styles.label}>{it.label}</Text>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginTop:         Space[6],
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[4],
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
  },
  grid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    rowGap:         Space[4],
  },
  cell: {
    width:       '50%',
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2] + 2,
  },
  icon: {
    flexShrink: 0,
  },
  label: {
    ...Type.caption,
    color: Colors.ink3,
  },
});
