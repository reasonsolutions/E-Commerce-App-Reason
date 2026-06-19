import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { Colors, Radius, Space } from '../../theme';
import { FontFamily } from '../../theme/fonts';
import { Type } from '../../theme/typography';

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
  const [imgFailed, setImgFailed] = useState(false);
  const [t0] = TONE_GRADS[index % TONE_GRADS.length];
  const resolved = imageUri ? resolveImageUrl(imageUri) : '';
  const showImage = !!resolved && !imgFailed;

  return (
    <TouchableOpacity style={[styles.wrap, active && styles.wrapActive]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.tile, active && styles.tileActive, { backgroundColor: t0 }]}>
        {showImage ? (
          <Image
            source={{ uri: resolved }}
            style={styles.img}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Text style={styles.initial}>{name.charAt(0)}</Text>
        )}
      </View>
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={2}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width:     76,
    flexShrink: 0,
    alignItems: 'center',
    gap:        Space[2],
  },
  wrapActive: {
    width: 86,
  },
  tile: {
    width:        76,
    height:       76,
    borderRadius: 20,
    overflow:     'hidden',
    alignItems:   'center',
    justifyContent: 'center',
    borderWidth:  StyleSheet.hairlineWidth,
    borderColor:  'rgba(0,0,0,0.04)',
  },
  tileActive: {
    width:       86,
    height:      86,
    borderWidth: 2,
    borderColor: Colors.ink1,
  },
  img: {
    width:  '100%',
    height: '100%',
  },
  initial: {
    fontFamily:  FontFamily.serifItalic,
    fontSize:    34,
    color:       'rgba(40,32,24,0.22)',
    lineHeight:  38,
  },
  label: {
    ...Type.label,
    color:      Colors.ink2,
    letterSpacing: 0.5,
    textAlign:  'center',
    lineHeight: 15,
  },
  labelActive: {
    color:      Colors.ink1,
    fontWeight: '700',
  },
});
