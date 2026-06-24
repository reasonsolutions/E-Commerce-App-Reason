import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
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

  return (
    <View style={styles.container}>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Icon name="storefront-outline" size={14} color={Colors.ink4} />
        <Text style={styles.sellerName} numberOfLines={1}>
          Sold by {sellerName}
          {manufacturer ? ` · ${manufacturer}` : countryOfOrigin ? ` · ${countryOfOrigin}` : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Space[4],
    paddingBottom:     Space[5],
    backgroundColor:   Colors.surface,
  },
  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginBottom:    Space[3],
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
  },
  sellerName: {
    flex:        1,
    fontFamily:  FontFamily.sans,
    fontSize:    12,
    color:       Colors.ink4,
  },
});
