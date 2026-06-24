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
  width: number;
}

export const CategoryTile: React.FC<CategoryTileProps> = ({ name, imageUri, index, onPress, width }) => {
  const [t0] = TONE_GRADS[index % TONE_GRADS.length];
  const resolved = imageUri ? resolveImageUrl(imageUri) : '';

  return (
    <TouchableOpacity style={[styles.wrap, { width }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.tile, { width, height: width }]}>
        <FadeImage
          uri={resolved}
          width={width}
          height={width}
          resizeMode="cover"
          fallbackText={name}
          style={{ backgroundColor: t0 }}
        />
      </View>
      <Text style={styles.label} numberOfLines={2}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap:        Space[2],
  },
  tile: {
    borderRadius:    20,
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     'rgba(0,0,0,0.04)',
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize:   12.5,
    fontWeight: '600',
    color:      Colors.ink1,
    textAlign:  'center',
    lineHeight: 16,
  },
});
