import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { Colors, Radius } from '../../theme';
import { FontFamily } from '../../theme/fonts';

const TONE_GRADS: [string, string][] = [
  ['#E9E1D3', '#D9CBB7'], ['#DEE2DC', '#C8CEC5'], ['#EADBCF', '#D7C0AF'],
  ['#DEDFDA', '#C7C9C2'], ['#ECE5D7', '#DBD0BB'], ['#DCD7CF', '#C4BCAE'],
  ['#E9DCD5', '#D4C0B5'], ['#26211B', '#171310'], ['#D9D8C6', '#C2C0A6'],
  ['#D6DADD', '#BFC5C9'],
];

interface BrandTileProps {
  name: string;
  imageUri: string | null | undefined;
  index: number;
}

export const BrandTile: React.FC<BrandTileProps> = ({ name, imageUri, index }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [t0, t1] = TONE_GRADS[index % TONE_GRADS.length];
  const isDark = index % TONE_GRADS.length === 7;
  const resolved = imageUri ? resolveImageUrl(imageUri) : '';
  const showImage = !!resolved && !imgFailed;

  return (
    <View style={[styles.circle, { backgroundColor: t0 }]}>
      {showImage ? (
        <Image
          source={{ uri: resolved }}
          style={styles.img}
          resizeMode="cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <Text style={[styles.mono, { color: isDark ? 'rgba(255,255,255,0.88)' : Colors.ink1 }]}>
          {name.length > 2 ? name.slice(0, 2).toUpperCase() : name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    width:           70,
    height:          70,
    borderRadius:    35,
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     'rgba(0,0,0,0.05)',
  },
  img: {
    width:  '100%',
    height: '100%',
  },
  mono: {
    fontFamily: FontFamily.serif,
    fontSize:   24,
    fontWeight: '600',
    lineHeight: 28,
  },
});
