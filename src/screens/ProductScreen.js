import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCart } from '../context/CartContext';
import { products } from '../data/mockData';

const { width } = Dimensions.get('window');

const ProductScreen = ({ navigation, route }) => {
  const { addToCart } = useCart();
  const productId = route?.params?.product?.id || 1;
  const product = products.find(p => p.id === productId) || products[0];
  
  const [selectedColor, setSelectedColor] = useState(product.selectedColor);
  const [selectedStorage, setSelectedStorage] = useState(product.selectedStorage);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleAddToCart = () => {
    const productToAdd = {
      ...product,
      selectedColor,
      selectedStorage,
      quantity,
    };
    addToCart(productToAdd);
    navigation.goBack();
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigation.navigate('Cart');
  };

  const renderVariantImage = ({ item, index }) => (
    <TouchableOpacity 
      style={[
        styles.variantImage,
        selectedImageIndex === index && styles.selectedVariantImage
      ]}
      onPress={() => setSelectedImageIndex(index)}
    >
      <Image source={{ uri: item }} style={styles.variantImageContent} />
    </TouchableOpacity>
  );

  const renderColorOption = (color, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.colorOption,
        { backgroundColor: color.color },
        selectedColor === color.name && styles.selectedColorOption,
      ]}
      onPress={() => setSelectedColor(color.name)}
    />
  );

  const renderStorageOption = (storage, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.storageOption,
        selectedStorage === storage && styles.selectedStorageOption,
      ]}
      onPress={() => setSelectedStorage(storage)}
    >
      <Text style={[
        styles.storageText,
        selectedStorage === storage && styles.selectedStorageText,
      ]}>
        {storage}
      </Text>
    </TouchableOpacity>
  );

  const renderFeature = (feature, index) => (
    <View key={index} style={styles.featureItem}>
      <Icon name={feature.icon} size={20} color="#007AFF" />
      <Text style={styles.featureText}>{feature.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="heart-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="share-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Icon name="bag-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.imageSection}>
          <Image 
            source={{ uri: product.images[selectedImageIndex] }} 
            style={styles.mainImage} 
          />
          
          <FlatList
            data={product.images}
            renderItem={renderVariantImage}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.variantImagesList}
            contentContainerStyle={styles.variantImagesContainer}
          />
        </View>

        {/* Product Information */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.brandRatingContainer}>
            <Text style={styles.brandText}>By {product.brand}</Text>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{product.rating}</Text>
              <Text style={styles.reviewText}>({product.reviewCount}k)</Text>
            </View>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${product.price}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>${product.originalPrice}</Text>
            )}
          </View>
          
          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Icon name="remove" size={20} color="#666" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Icon name="add" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Color Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.optionTitle}>Color</Text>
          <View style={styles.colorOptions}>
            {product.colors.map(renderColorOption)}
          </View>
          <Text style={styles.selectedOptionText}>{selectedColor}</Text>
        </View>

        {/* Storage Options */}
        {product.storage && (
          <View style={styles.optionsSection}>
            <Text style={styles.optionTitle}>Storage</Text>
            <View style={styles.storageOptions}>
              {product.storage.map(renderStorageOption)}
            </View>
          </View>
        )}

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>A Snapshot View</Text>
          {product.features.map(renderFeature)}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow}>
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerButton: {
    padding: 8,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  imageSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  mainImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 16,
  },
  variantImagesList: {
    marginBottom: 16,
  },
  variantImagesContainer: {
    paddingRight: 16,
  },
  variantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedVariantImage: {
    borderColor: '#007AFF',
  },
  variantImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  productInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  brandRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandText: {
    fontSize: 16,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginRight: 12,
  },
  originalPrice: {
    fontSize: 20,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
  },
  optionsSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  colorOptions: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#007AFF',
  },
  selectedOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  storageOptions: {
    flexDirection: 'row',
  },
  storageOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedStorageOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  storageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedStorageText: {
    color: '#FFFFFF',
  },
  featuresSection: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 16,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProductScreen;