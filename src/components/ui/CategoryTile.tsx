import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { Colors, Space } from '../../theme';
import { FontFamily } from '../../theme/fonts';
import { FadeImage } from './FadeImage';

const TONE_GRADS: [string, string][] = [
  ['#E9E1D3', '#D9CBB7'], ['#DEE2DC', '#C8CEC5'], ['#EADBCF', '#D7C0AF'],
  ['#DEDFDA', '#C7C9C2'], ['#ECE5D7', '#DBD0BB'], ['#DCD7CF', '#C4BCAE'],
  ['#E9DCD5', '#D4C0B5'], ['#D9D8C6', '#C2C0A6'], ['#D6DADD', '#BFC5C9'],
];

interface CategoryTileProps {
  name: string;
  imageUri: string | null | undefined;
  index: number;
  active?: boolean;
  onPress: () => void;
}

export const CategoryTile: React.FC<CategoryTileProps> = ({ name, imageUri, index, active = false, onPress }) => {
  const [t0] = TONE_GRADS[index % TONE_GRADS.length];
  const resolved = imageUri ? resolveImageUrl(imageUri) : '';
  const size = active ? 70 : 62;

  return (
    <TouchableOpacity style={[styles.wrap, active && styles.wrapActive]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.tile, active && styles.tileActive]}>
        <FadeImage
          uri={resolved}
          width={size}
          height={size}
          resizeMode="cover"
          fallbackText={name}
          style={{ backgroundColor: t0 }}
        />
      </View>
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={2}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width:     62,
    flexShrink: 0,
    alignItems: 'center',
    gap:        Space[1] + 2,
  },
  wrapActive: {
    width: 70,
  },
  tile: {
    width:        62,
    height:       62,
    borderRadius: 18,
    overflow:     'hidden',
    alignItems:   'center',
    justifyContent: 'center',
    borderWidth:  StyleSheet.hairlineWidth,
    borderColor:  'rgba(0,0,0,0.04)',
  },
  tileActive: {
    width:       70,
    height:      70,
    borderWidth: 2,
    borderColor: Colors.ink1,
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize:   10.5,
    fontWeight: '500',
    color:      Colors.ink2,
    textAlign:  'center',
    lineHeight: 13,
  },
  labelActive: {
    color:      Colors.ink1,
    fontWeight: '700',
  },
});
