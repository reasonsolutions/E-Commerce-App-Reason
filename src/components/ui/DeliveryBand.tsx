import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { FontFamily } from '../../theme/fonts';

interface DeliveryBandProps {
  freeShipping: boolean;
  estimatedDeliveryDays?: string | null;
  isOOS: boolean;
  isBackorder: boolean;
}

export const DeliveryBand: React.FC<DeliveryBandProps> = ({
  freeShipping,
  estimatedDeliveryDays,
  isOOS,
  isBackorder,
}) => {
  if (isOOS && !isBackorder) return null;

  const mainText = isBackorder
    ? 'Backorder available'
    : freeShipping
      ? 'Free delivery'
      : 'Delivery available';

  const subText = isBackorder
    ? 'Ships when back in stock'
    : estimatedDeliveryDays
      ? `Get it in ${estimatedDeliveryDays} days`
      : null;

  return (
    <View style={styles.band}>
      <Icon name="bicycle-outline" size={16} color={Colors.ink2} />
      <Text style={styles.mainText}>
        {mainText}
        {subText ? <Text style={styles.subText}> – {subText}</Text> : null}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  band: {
    backgroundColor:   Colors.surfaceSoft,
    paddingHorizontal: Space[4],
    paddingVertical:   10,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
  },
  mainText: {
    fontFamily: FontFamily.sans,
    fontSize:   13,
    fontWeight: '500',
    color:      Colors.ink1,
    flex:       1,
  },
  subText: {
    fontFamily: FontFamily.sans,
    fontSize:   13,
    fontWeight: '400',
    color:      Colors.ink3,
  },
});
