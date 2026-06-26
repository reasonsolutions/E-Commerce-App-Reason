import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { Colors, Space } from '../../theme';
import { FontFamily } from '../../theme/fonts';

const TONE_FILLS: string[] = [
  '#EDE8E0', '#E4E8E2', '#EDE3D9', '#E2E4DF',
  '#EDE7DB', '#E0DBD3', '#EDE0D9', '#DBD9C8', '#D8DCE0',
];

interface CategoryTileProps {
  name: string;
  imageUri: string | null | undefined;
  index: number;
  active?: boolean;
  onPress: () => void;
  width?: number;
}

const CIRCLE = 68;

export const CategoryTile: React.FC<CategoryTileProps> = ({ name, imageUri, index, onPress }) => {
  const fill = TONE_FILLS[index % TONE_FILLS.length];
  const resolved = imageUri ? resolveImageUrl(imageUri) : '';
  const [failed, setFailed] = useState(false);

  return (
    <TouchableOpacity style={styles.wrap} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.circle, { backgroundColor: fill }]}>
        {resolved && !failed ? (
          <Image
            source={{ uri: resolved }}
            style={styles.img}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <Text style={styles.initial}>{name.charAt(0).toUpperCase()}</Text>
        )}
      </View>
      <Text style={styles.label} numberOfLines={2}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width:      76,
    alignItems: 'center',
    gap:        Space[2],
  },
  circle: {
    width:          CIRCLE,
    height:         CIRCLE,
    borderRadius:   CIRCLE / 2,
    overflow:       'hidden',
    alignItems:     'center',
    justifyContent: 'center',
  },
  img: {
    width:  CIRCLE,
    height: CIRCLE,
  },
  initial: {
    fontFamily: FontFamily.serifItalic,
    fontSize:   26,
    color:      'rgba(40,32,24,0.28)',
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize:   11,
    fontWeight: '500',
    color:      Colors.ink2,
    textAlign:  'center',
    lineHeight: 14,
  },
});
