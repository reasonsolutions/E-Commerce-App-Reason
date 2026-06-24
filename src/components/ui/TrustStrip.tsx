import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { Type } from '../../theme/typography';

const ITEMS = [
  { icon: 'shield-checkmark-outline', label: 'Genuine' },
  { icon: 'flash-outline',            label: 'Fast delivery' },
  { icon: 'refresh-outline',          label: 'Easy returns' },
  { icon: 'lock-closed-outline',      label: 'Secure' },
];

export const TrustStrip: React.FC = () => (
  <View style={styles.wrap}>
    {ITEMS.map((it, i) => (
      <React.Fragment key={it.label}>
        <View style={styles.cell}>
          <Icon name={it.icon} size={13} color={Colors.ink3} />
          <Text style={styles.label}>{it.label}</Text>
        </View>
        {i < ITEMS.length - 1 && <View style={styles.sep} />}
      </React.Fragment>
    ))}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[3],
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  cell: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  sep: {
    width:           StyleSheet.hairlineWidth,
    height:          12,
    backgroundColor: Colors.rule,
    marginHorizontal: Space[3],
  },
  label: {
    ...Type.caption,
    fontSize: 11,
    color:    Colors.ink3,
  },
});
