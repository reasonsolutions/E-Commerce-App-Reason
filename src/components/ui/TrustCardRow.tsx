import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { FontFamily } from '../../theme/fonts';
import type { ProductPolicyInfo, ProductShippingInfo } from '../../api/interfaces';
import { warrantyTypeLabel } from '../../utils/warrantyType';

interface TrustCardRowProps {
  policy: ProductPolicyInfo;
  shipping?: ProductShippingInfo | null;
  onPressReturns?: () => void;
}

export const TrustCardRow: React.FC<TrustCardRowProps> = ({ policy, shipping, onPressReturns }) => {
  const cards: { icon: string; label: string; onPress?: () => void; muted?: boolean }[] = [];

  if (policy.IsReturnable) {
    cards.push({
      icon:  'refresh-outline',
      label: policy.ReturnWindow ? `${policy.ReturnWindow}-Day Returns` : 'Easy Returns',
      onPress: onPressReturns,
    });
  } else {
    cards.push({
      icon:  'close-circle-outline',
      label: 'Not Returnable',
      muted: true,
    });
  }

  if (policy.HasWarranty) {
    const warrantyType = warrantyTypeLabel(policy.WarrantyType);
    const warrantyLabel = policy.WarrantyPeriod
      ? `${policy.WarrantyPeriod}-Day${warrantyType ? ' ' + warrantyType : ''} Warranty`
      : 'Warranty Included';
    cards.push({ icon: 'shield-checkmark-outline', label: warrantyLabel });
  }

  if (shipping?.CanShipInternational) {
    cards.push({ icon: 'earth-outline', label: 'Ships Internationally' });
  }

  if (!cards.length) return null;

  return (
    <View style={styles.row}>
      {cards.map((c, i) =>
        c.onPress ? (
          <TouchableOpacity
            key={i}
            style={styles.card}
            activeOpacity={0.7}
            onPress={c.onPress}
          >
            <Icon name={c.icon} size={16} color={Colors.ink2} />
            <Text style={styles.label}>{c.label}</Text>
          </TouchableOpacity>
        ) : (
          <View key={i} style={[styles.card, c.muted && styles.cardMuted]}>
            <Icon name={c.icon} size={16} color={c.muted ? Colors.ink4 : Colors.ink2} />
            <Text style={[styles.label, c.muted && styles.labelMuted]}>{c.label}</Text>
          </View>
        ),
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    flexWrap:          'wrap',
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
  },
  cardMuted: {
    borderStyle:     'dashed',
    backgroundColor: Colors.surfaceSoft,
  },
  label: {
    fontFamily:  FontFamily.sans,
    fontSize:    11,
    fontWeight:  '500',
    color:       Colors.ink2,
    flexShrink:  1,
  },
  labelMuted: {
    color: Colors.ink4,
  },
});
