import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { CategoryInterface } from '../api/interfaces';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';

interface CategoryItemProps {
  category: CategoryInterface;
  onPress: () => void;
}

// Typographic pill: small square thumbnail + category name.
// No circle bubble, no shadow — reads as an editorial nav label, not a cartoon icon.
const CategoryItem: React.FC<CategoryItemProps> = ({ category, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.72}>
      <View style={styles.imgWrap}>
        <Image
          source={{ uri: category.CategoryImage }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.name} numberOfLines={1}>{category.CategoryName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
    paddingVertical:   Space[1] + 2,
    paddingHorizontal: Space[3],
    backgroundColor:   Colors.surfaceSoft,
    borderRadius:      Radius.pill,
  },
  imgWrap: {
    width:           28,
    height:          28,
    borderRadius:    Radius.sm,
    overflow:        'hidden',
    backgroundColor: Colors.surfaceDeep,
  },
  image: {
    width:  '100%',
    height: '100%',
  },
  name: {
    ...Type.label,
    color:         Colors.ink2,
    letterSpacing: 0.8,
  },
});

export default CategoryItem;
