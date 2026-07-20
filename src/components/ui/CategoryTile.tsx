import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { Colors, Space, Shadow } from '../../theme';
import { FontFamily } from '../../theme/fonts';

interface CategoryTileProps {
  name: string;
  imageUri: string | null | undefined;
  index: number;
  active?: boolean;
  onPress: () => void;
  width?: number;
}

const CIRCLE = 68;

export const CategoryTile: React.FC<CategoryTileProps> = ({ name, imageUri, onPress }) => {
  const resolved = imageUri ? resolveImageUrl(imageUri) : '';
  const [failed, setFailed] = useState(false);

  return (
    <TouchableOpacity style={styles.wrap} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.circle}>
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
    width:           CIRCLE,
    height:          CIRCLE,
    borderRadius:    CIRCLE / 2,
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#FFFFFF',
    ...Shadow.sm,
  },
  img: {
    width:  CIRCLE,
    height: CIRCLE,
  },
  initial: {
    fontFamily: FontFamily.serifItalic,
    fontSize:   26,
    color:      Colors.heroStageStart,
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize:   11,
    fontWeight: '600',
    color:      '#FFFFFF',
    textAlign:  'center',
    lineHeight: 14,
  },
});
