import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet , StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const CartItem = ({ item, onUpdateQuantity, onRemove, onEdit }) => {
  const handleQuantityChange = (change) => {
    const newQuantity = item.Quantity + change;
    if (newQuantity > 0) {
      onUpdateQuantity(item, newQuantity);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.Images.split(";")[0] }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.productInfo}>
            <Text style={styles.name}>{item.Name}</Text>
            <Text style={styles.brand}>{item.Brand_Name}</Text>
            {item.Variant && (
              <Text style={styles.variant}>Variant: {item.Variant}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => onRemove(item)}
          >
            <Icon name="trash-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${item.Price}</Text>
            {item.ComparePrice && item.ComparePrice > item.Price && (
              <Text style={styles.comparePrice}>${item.ComparePrice}</Text>
            )}
            
          </View>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(-1)}
            >
              <Icon name="remove" size={16} color="#666" />
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.Quantity}</Text>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(1)}
            >
              <Icon name="add" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  brand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  variant: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  deleteButton: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginRight: 12,
  },
  comparePrice: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  editText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
});

export default CartItem;