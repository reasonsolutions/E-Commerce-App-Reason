import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, FontSize, FontWeight } from '../../theme/tokens';

type Size = 'sm' | 'md';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: Size;
}

const BTN_SIZE: Record<Size, number> = { sm: 28, md: 36 };
const ICON_SIZE: Record<Size, number> = { sm: 13, md: 16 };
const NUM_SIZE: Record<Size, number>  = { sm: FontSize.sm, md: FontSize.base };

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
}) => {
  const btnSize = BTN_SIZE[size];
  const iconSize = ICON_SIZE[size];
  const numSize = NUM_SIZE[size];

  const decrement = () => { if (value > min) onChange(value - 1); };
  const increment = () => { if (value < max) onChange(value + 1); };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={decrement}
        disabled={value <= min}
        style={[styles.btn, { width: btnSize, height: btnSize }]}
        accessibilityLabel="Decrease quantity"
        accessibilityRole="button"
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Icon
          name="remove"
          size={iconSize}
          color={value <= min ? Colors.ink5 : Colors.ink1}
        />
      </TouchableOpacity>

      <Text style={[styles.value, { fontSize: numSize, minWidth: size === 'sm' ? 22 : 28 }]}>
        {value}
      </Text>

      <TouchableOpacity
        onPress={increment}
        disabled={value >= max}
        style={[styles.btn, { width: btnSize, height: btnSize }]}
        accessibilityLabel="Increase quantity"
        accessibilityRole="button"
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Icon
          name="add"
          size={iconSize}
          color={value >= max ? Colors.ink5 : Colors.ink1}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   Radius.pill,
    borderWidth:    1,
    borderColor:    Colors.lineStrong,
    backgroundColor: Colors.surface,
    alignSelf:      'flex-start',
    overflow:       'hidden',
  },
  btn: {
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  value: {
    fontWeight:  FontWeight.semibold,
    color:       Colors.ink1,
    textAlign:   'center',
  },
});
