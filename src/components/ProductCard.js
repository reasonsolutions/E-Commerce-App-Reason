import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const ProductCard = ({ product, onPress, onFavoritePress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} />
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={() => onFavoritePress && onFavoritePress(product)}
        >
          <Icon 
            name={product.isFavorite ? "heart" : "heart-outline"} 
            size={20} 
            color={product.isFavorite ? "#FF6B6B" : "#666"} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        {product.price && (
          <Text style={styles.price}>${product.price}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: 150,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
});

export default ProductCard;