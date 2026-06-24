import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { Colors } from '../../theme';
import { FontFamily } from '../../theme/fonts';
import { FadeImage } from './FadeImage';

interface BrandTileProps {
  name: string;
  imageUri: string | null | undefined;
  index: number;
}

export const BrandTile: React.FC<BrandTileProps> = ({ name, imageUri }) => {
  const resolved = imageUri ? resolveImageUrl(imageUri) : '';

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <FadeImage
          uri={resolved}
          width={36}
          height={36}
          resizeMode="contain"
          fallbackText={name}
        />
      </View>
      <Text style={styles.label} numberOfLines={1}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width:      60,
    alignItems: 'center',
    gap:        6,
  },
  card: {
    width:           52,
    height:          52,
    borderRadius:    14,
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#FFFFFF',
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     'rgba(0,0,0,0.06)',
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize:   10.5,
    fontWeight: '600',
    color:      Colors.ink2,
    textAlign:  'center',
  },
});
