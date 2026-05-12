import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, FontSize, FontWeight } from '../../theme/tokens';

interface RatingProps {
  value: number;
  count?: number;
  size?: number;
  compact?: boolean;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  count,
  size = 12,
  compact = false,
}) => {
  return (
    <View style={styles.row}>
      <Icon name="star" size={size} color="#F5A623" />
      <Text style={[styles.value, { fontSize: size }]}>{value.toFixed(1)}</Text>
      {count != null && !compact ? (
        <Text style={[styles.count, { fontSize: size }]}>
          ({count.toLocaleString('en-IN')})
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap: 4,
  },
  value: {
    fontWeight: FontWeight.semibold,
    color:      Colors.ink1,
  },
  count: {
    fontWeight: FontWeight.regular,
    color:      Colors.ink3,
  },
});
