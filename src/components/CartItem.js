import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const CartItem = ({ item, onUpdateQuantity, onRemove, onEdit }) => {
  const handleQuantityChange = (change) => {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      onUpdateQuantity(item, newQuantity);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.image }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.productInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.brand}>{item.brand}</Text>
            {item.selectedColor && (
              <Text style={styles.variant}>Color: {item.selectedColor}</Text>
            )}
            {item.selectedStorage && (
              <Text style={styles.variant}>Storage: {item.selectedStorage}</Text>
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
            <Text style={styles.price}>${item.price}</Text>
            {onEdit && (
              <TouchableOpacity onPress={() => onEdit(item)}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(-1)}
            >
              <Icon name="remove" size={16} color="#666" />
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
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