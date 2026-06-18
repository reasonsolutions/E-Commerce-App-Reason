import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { FontFamily } from '../../theme/fonts';
import { Type } from '../../theme/typography';

const ITEMS = [
  {
    icon:  'shield-checkmark-outline',
    label: '100% Authentic Products',
    sub:   'All products sourced directly from trusted brands',
  },
  {
    icon:  'refresh-outline',
    label: 'Easy Returns',
    sub:   'Hassle-free returns and quick refunds',
  },
  {
    icon:  'flash-outline',
    label: 'Fast Delivery',
    sub:   'Quick and reliable shipping to your door',
  },
  {
    icon:  'lock-closed-outline',
    label: 'Secure Payments',
    sub:   'Your payment information is always protected',
  },
];

export const TrustStrip: React.FC = () => (
  <View style={styles.wrap}>
    {ITEMS.map((it, i) => (
      <React.Fragment key={it.label}>
        <View style={styles.row}>
          <Icon name={it.icon} size={28} color={Colors.ink2} style={styles.icon} />
          <View style={styles.text}>
            <Text style={styles.label}>{it.label}</Text>
            <Text style={styles.sub}>{it.sub}</Text>
          </View>
        </View>
        {i < ITEMS.length - 1 && <View style={styles.divider} />}
      </React.Fragment>
    ))}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginTop:         Space[6],
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[2],
    paddingBottom:     Space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingVertical: Space[5],
    gap:           Space[5],
  },
  icon: {
    flexShrink: 0,
    width:      28,
    textAlign:  'center',
  },
  text: {
    flex: 1,
    gap:  3,
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize:   15,
    fontWeight: '600',
    color:      Colors.ink1,
    lineHeight: 20,
  },
  sub: {
    ...Type.caption,
    color:      Colors.ink3,
    lineHeight: 18,
  },
  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginLeft:      48,
  },
});
