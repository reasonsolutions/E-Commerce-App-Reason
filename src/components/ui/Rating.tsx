import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, FontWeight } from '../../theme/tokens';

interface RatingProps {
  value: number;
  count?: number;
  size?: number;
  compact?: boolean;
}

// Rounds to the nearest half star so a partially-filled icon (star-half) is
// only ever used for an actual .5, matching how Amazon buckets its display
// rating rather than showing an arbitrary sliver fill.
function starIconAt(position: number, value: number): 'star' | 'star-half' | 'star-outline' {
  const rounded = Math.round(value * 2) / 2;
  if (rounded >= position) return 'star';
  if (rounded >= position - 0.5) return 'star-half';
  return 'star-outline';
}

export const Rating: React.FC<RatingProps> = ({
  value,
  count,
  size = 13,
  compact = false,
}) => {
  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((position) => (
          <Icon
            key={position}
            name={starIconAt(position, value)}
            size={size}
            color={Colors.star}
          />
        ))}
      </View>
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
    gap: 5,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
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
