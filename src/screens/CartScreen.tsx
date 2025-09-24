import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CartItem from '../components/CartItem';
import { SavedCartItemInterface } from '../api/interfaces';
import { getSavedCartItems } from '../api/integrations';
import AsyncStorage from '@react-native-async-storage/async-storage';
type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type CartScreenProps = {
  navigation: NavigationProp;
};

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const [cartItems, setCartItems] = useState<SavedCartItemInterface[]>([]);
  

  useEffect(() => {
    const fetchSavedCartItems = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          console.log("User Data: ", user);
          getSavedCartItems(user.CustomerProfileCode)
          .then(response => {
            setCartItems(response.result || []);
          })
          .catch(err => console.error("Error fetching cart items: ", err));
        }
        
      } catch (error) {
        console.error('Error fetching saved cart items:', error);
      }
    };

    fetchSavedCartItems();
  }, []);

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.Price * item.Quantity, 0);
  };

  const subtotal: number = getCartTotal();
  // const total: number = subtotal + shippingTax;
  const total: number = subtotal;

  const handleUpdateQuantity = (item: SavedCartItemInterface, quantity: number) => {
    setCartItems(prev =>
      prev.map(ci =>
        ci.CartDetailsCode === item.CartDetailsCode
          ? { ...ci, Quantity: quantity }
          : ci
      )
    );
  };

  const handleRemoveItem = (item: SavedCartItemInterface) => {
    setCartItems(prev =>
      prev.filter(ci => ci.CartDetailsCode !== item.CartDetailsCode)
    );
  };

  const handleEditItem = (item: SavedCartItemInterface) => {
    navigation.navigate('Product', { product: item });
  };

  const handleCheckout = () => {
    // Handle checkout logic
    console.log('Proceeding to checkout...');
    console.log(cartItems)
    navigation.navigate('Address', { cartItems: cartItems });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const renderCartItem = ({ item }: ListRenderItemInfo<SavedCartItemInterface>) => (
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

      {cartItems.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          {/* Cart Items */}
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item: SavedCartItemInterface, index: number) =>
              `${item.CartDetailsCode}-${index}`
            }
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
              {/* <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sub Total</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View> */}

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

// ...styles remain unchanged

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteAllButton: {
    padding: 4,
  },
  cartList: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  cartListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bottomSection: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
  },
  promoCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  promoCodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCodeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  orderSummary: {
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  checkoutButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyCartTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  shopNowButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  shopNowButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default CartScreen;
