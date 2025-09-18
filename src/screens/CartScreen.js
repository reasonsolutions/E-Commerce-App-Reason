import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';

const CartScreen = ({ navigation }) => {
  const { items, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();

  const subtotal = getCartTotal();
  const shippingTax = 15.00;
  const total = subtotal + shippingTax;

  const handleUpdateQuantity = (item, quantity) => {
    updateQuantity(item, quantity);
  };

  const handleRemoveItem = (item) => {
    removeFromCart(item);
  };

  const handleEditItem = (item) => {
    // Navigate to product screen for editing
    navigation.navigate('Product', { product: item });
  };

  const handleCheckout = () => {
    // Handle checkout logic
    console.log('Proceeding to checkout...');
  };

  const renderCartItem = ({ item }) => (
    <CartItem
      item={item}
      onUpdateQuantity={handleUpdateQuantity}
      onRemove={handleRemoveItem}
      onEdit={handleEditItem}
    />
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyCartContainer}>
      <Icon name="bag-outline" size={80} color="#CCC" />
      <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
      <Text style={styles.emptyCartSubtitle}>Add some products to get started</Text>
      <TouchableOpacity 
        style={styles.shopNowButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.shopNowButtonText}>Shop Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteAllButton}
          onPress={clearCart}
        >
          <Icon name="trash-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          {/* Cart Items */}
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={(item, index) => `${item.id}-${item.selectedColor}-${item.selectedStorage}-${index}`}
            style={styles.cartList}
            contentContainerStyle={styles.cartListContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            {/* Promo Code */}
            <TouchableOpacity style={styles.promoCodeContainer}>
              <View style={styles.promoCodeLeft}>
                <Icon name="pricetag-outline" size={20} color="#666" />
                <Text style={styles.promoCodeText}>Enter Promo Code</Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {/* Order Summary */}
            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sub Total</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping & Tax</Text>
                <Text style={styles.summaryValue}>${shippingTax.toFixed(2)}</Text>
              </View>
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Checkout Button */}
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  deleteAllButton: {
    padding: 8,
  },
  cartList: {
    flex: 1,
  },
  cartListContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopNowButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  shopNowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  promoCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
  },
  promoCodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCodeText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  orderSummary: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CartScreen;