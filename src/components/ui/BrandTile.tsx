import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { Colors } from '../../theme';
import { Type } from '../../theme/typography';
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
          width={40}
          height={40}
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
    width:      72,
    alignItems: 'center',
    gap:        4,
  },
  card: {
    width:           64,
    height:          64,
    borderRadius:    16,
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#FFFFFF',
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     'rgba(0,0,0,0.06)',
  },
  label: {
    ...Type.label,
    fontSize:      9.5,
    color:         Colors.ink2,
    textAlign:     'center',
    letterSpacing: 0.5,
  },
});
