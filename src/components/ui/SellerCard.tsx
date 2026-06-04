import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Space } from '../../theme';
import { FontFamily } from '../../theme/fonts';

interface SellerCardProps {
  sellerName?: string | null;
  manufacturer?: string | null;
  countryOfOrigin?: string | null;
}

export const SellerCard: React.FC<SellerCardProps> = ({
  sellerName,
  manufacturer,
  countryOfOrigin,
}) => {
  if (!sellerName) return null;

  const meta = [manufacturer, countryOfOrigin].filter(Boolean).join(' · ');

  return (
    <View style={styles.container}>
      <View style={styles.divider} />
      <Text style={styles.text}>
        <Text style={styles.label}>Sold by : </Text>
        <Text style={styles.seller}>{sellerName.toUpperCase()}</Text>
      </Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Space[4],
    paddingBottom:     Space[6],
    backgroundColor:   Colors.surface,
  },
  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginBottom:    Space[4],
  },
  text: {
    flexDirection: 'row',
  },
  label: {
    fontFamily:  FontFamily.sans,
    fontSize:    12,
    fontWeight:  '400',
    color:       Colors.ink3,
  },
  seller: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    fontWeight:    '400',
    color:         Colors.ink2,
    letterSpacing: 0.8,
  },
  meta: {
    fontFamily:  FontFamily.sans,
    fontSize:    11,
    color:       Colors.ink4,
    marginTop:   Space[1],
  },
});
