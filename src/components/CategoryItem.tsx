import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { CategoryInterface } from '../api/interfaces';
import { Colors, Space, Radius, Shadow, FontSize, FontWeight } from '../theme';

interface CategoryItemProps {
  category: CategoryInterface;
  onPress: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.78}>
      <View style={styles.circle}>
        <Image source={{ uri: category.CategoryImage }} style={styles.image} resizeMode="contain" />
      </View>
      <Text style={styles.name} numberOfLines={2}>{category.CategoryName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 64,
    gap: Space[2],
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadow.md,
  },
  image: {
    width: 38,
    height: 38,
  },
  name: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink2,
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default CategoryItem;
