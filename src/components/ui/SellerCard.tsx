import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { FontFamily } from '../../theme/fonts';
import { Type } from '../../theme/typography';

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

  return (
    <View style={styles.container}>
      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>SELLER</Text>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Icon name="storefront-outline" size={18} color={Colors.ink3} />
        </View>
        <View style={styles.body}>
          <Text style={styles.sellerName}>{sellerName}</Text>
          {manufacturer ? (
            <Text style={styles.meta}>
              {manufacturer}{countryOfOrigin ? ` · ${countryOfOrigin}` : ''}
            </Text>
          ) : countryOfOrigin ? (
            <Text style={styles.meta}>{countryOfOrigin}</Text>
          ) : null}
        </View>
      </View>
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
  sectionLabel: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 1.1,
    marginBottom:  Space[3],
  },
  card: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[3],
    backgroundColor:   Colors.surfaceSoft,
    borderRadius:      10,
    paddingHorizontal: Space[4],
    paddingVertical:   Space[3] + 2,
    borderWidth:       StyleSheet.hairlineWidth,
    borderColor:       Colors.rule,
  },
  iconWrap: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: Colors.surface,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     Colors.rule,
  },
  body: {
    flex: 1,
    gap:  2,
  },
  sellerName: {
    fontFamily:  FontFamily.sans,
    fontSize:    14,
    fontWeight:  '500',
    color:       Colors.ink1,
    letterSpacing: 0,
  },
  meta: {
    fontFamily:  FontFamily.sans,
    fontSize:    11,
    color:       Colors.ink4,
    lineHeight:  11 * 1.4,
  },
});
