import React from 'react';
import { View, StyleSheet } from 'react-native';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { FadeImage } from './FadeImage';

interface BrandTileProps {
  name: string;
  imageUri: string | null | undefined;
  index: number;
}

export const BrandTile: React.FC<BrandTileProps> = ({ name, imageUri }) => {
  const resolved = imageUri ? resolveImageUrl(imageUri) : '';

  return (
    <View style={styles.card}>
      <FadeImage
        uri={resolved}
        width={40}
        height={40}
        resizeMode="contain"
        fallbackText={name}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width:           56,
    height:          56,
    borderRadius:    16,
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#FFFFFF',
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     'rgba(0,0,0,0.06)',
  },
});
