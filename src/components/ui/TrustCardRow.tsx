import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { FontFamily } from '../../theme/fonts';
import type { ProductPolicyInfo, ProductShippingInfo } from '../../api/interfaces';

interface TrustCardRowProps {
  policy: ProductPolicyInfo;
  shipping: ProductShippingInfo;
}

export const TrustCardRow: React.FC<TrustCardRowProps> = ({ policy, shipping }) => {
  const cards: { icon: string; label: string }[] = [];

  if (shipping.FreeShipping) {
    cards.push({ icon: 'bicycle-outline', label: 'Free Delivery' });
  }

  if (shipping.EstimatedDeliveryDays) {
    cards.push({ icon: 'time-outline', label: `Delivers in ${shipping.EstimatedDeliveryDays} days` });
  }

  if (policy.IsReturnable) {
    cards.push({
      icon:  'refresh-outline',
      label: policy.ReturnWindow ? `${policy.ReturnWindow}-Day Returns` : 'Easy Returns',
    });
  }

  if (policy.HasWarranty) {
    const warrantyLabel = policy.WarrantyPeriod
      ? `${policy.WarrantyPeriod}${policy.WarrantyType ? ' ' + policy.WarrantyType : ''} Warranty`
      : 'Warranty Included';
    cards.push({ icon: 'shield-checkmark-outline', label: warrantyLabel });
  }

  if (!cards.length) return null;

  return (
    <View style={styles.row}>
      {cards.map((c, i) => (
        <View key={i} style={styles.card}>
          <Icon name={c.icon} size={16} color={Colors.ink2} />
          <Text style={styles.label}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    gap:               Space[3],
    paddingHorizontal: Space[4],
    paddingVertical:   Space[4],
    backgroundColor:   Colors.surface,
  },
  card: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[2],
    borderWidth:       1,
    borderColor:       Colors.rule,
    borderRadius:      Radius.pill,
    paddingHorizontal: Space[3],
    paddingVertical:   Space[2] + 2,
    flex:              1,
  },
  label: {
    fontFamily:  FontFamily.sans,
    fontSize:    11,
    fontWeight:  '500',
    color:       Colors.ink2,
    flexShrink:  1,
  },
});
