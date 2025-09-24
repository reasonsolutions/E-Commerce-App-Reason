import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet , Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CategoryInterface } from '../api/interfaces';

interface CategoryItemProps {
  category: CategoryInterface;
  onPress: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, onPress }) => {
  console.log(category.CategoryImage)
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Image source={{ uri: category.CategoryImage }} style={{ width: 48, height: 48 }} />
      </View>
      <Text style={styles.name}>{category.CategoryName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    minHeight: 80,
  },
  iconContainer: {
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
});

export default CategoryItem;