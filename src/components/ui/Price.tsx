import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '../../theme/tokens';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';

type PriceSize = 'sm' | 'base' | 'lg' | 'xl' | 'large';

interface PriceProps {
  value: number;
  was?: number;
  size?: PriceSize;
  currency?: string;
}

const mainFontSize: Record<PriceSize, number> = {
  sm:    FontSize.sm,
  base:  FontSize.base,
  lg:    FontSize.lg,
  xl:    FontSize.xl,
  large: 32,
};

const strikeSizeOffset = 4;
const discountSize = FontSize.xs;

export const Price: React.FC<PriceProps> = ({
  value,
  was,
  size = 'base',
  currency = '$',
}) => {
  const fs = mainFontSize[size];
  const strikeFs = Math.max(FontSize.xs, fs - strikeSizeOffset);
  const discount = was && was > value ? Math.round((1 - value / was) * 100) : 0;

  return (
    <View style={styles.row}>
      <Text style={[styles.main, { fontSize: fs }]}>
        {currency}{value.toFixed(2)}
      </Text>

      {was && was > value ? (
        <Text style={[styles.strike, { fontSize: strikeFs }]}>
          {currency}{was.toFixed(2)}
        </Text>
      ) : null}

      {discount > 0 ? (
        <Text style={[styles.discount, { fontSize: discountSize }]}>
          {discount}% off
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'baseline',
    flexWrap:      'wrap',
    gap: 6,
  },
  main: {
    fontFamily:    FontFamily.serif,
    fontWeight:    FontWeight.regular,
    letterSpacing: -0.4,
    color:         Colors.ink1,
  },
  strike: {
    fontFamily:         FontFamily.mono,
    fontWeight:         FontWeight.regular,
    color:              Colors.ink4,
    textDecorationLine: 'line-through',
  },
  discount: {
    fontWeight: FontWeight.bold,
    color:      Colors.success,
    letterSpacing: 0.1,
  },
});
