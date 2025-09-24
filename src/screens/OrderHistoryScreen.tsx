import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Image,
  ListRenderItemInfo,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { postOrderHistory } from '../api/integrations';
import AsyncStorage from '@react-native-async-storage/async-storage';
type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type OrderHistoryScreenProps = {
  navigation: NavigationProp;
};

type OrderItem = {
  Inventory_Id: number;
  Item_Id: number;
  Variant: string;
  Name: string;
  Images: string;
  Quantity: number;
  Amount: number;
  OrderStatus: number;
  Brand_Id: number;
  Brand_Name: string;
  OrderNumber?: string;
  OrderedDate?: string;
};

const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation }) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        console.log("User Data: ", user);
        postOrderHistory(user.CustomerProfileCode).then(response => {
        console.log("Order history response: ", response);
        setOrders(response.result.OrdHistoryDetails || []);
      }).catch(err => console.error("Error fetching order history: ", err));
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrderHistory();
    setRefreshing(false);
  };

  const getOrderStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Confirmed';
      case 2: return 'Shipped';
      case 3: return 'Delivered';
      case 4: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getOrderStatusColor = (status: number) => {
    switch (status) {
      case 1: return '#FF9500'; // Orange
      case 2: return '#007AFF'; // Blue
      case 3: return '#4CAF50'; // Green
      case 4: return '#FF3B30'; // Red
      default: return '#8E8E93';
    }
  };

  const getFirstImage = (images: string) => {
    return images.split(';')[0] || 'https://via.placeholder.com/150';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleOrderPress = (order: OrderItem) => {
    // Navigate to order details screen
    navigation.navigate('OrderDetails', { orderItem: order });
  };

  const renderOrderItem = ({ item }: ListRenderItemInfo<OrderItem>) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => handleOrderPress(item)}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>#{item.OrderNumber}</Text>
          <Text style={styles.OrderedDate}>
            {item.OrderedDate ? formatDate(item.OrderedDate) : 'No date'}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getOrderStatusColor(item.OrderStatus) }
        ]}>
          <Text style={styles.statusText}>
            {getOrderStatusText(item.OrderStatus)}
          </Text>
        </View>
      </View>

      <View style={styles.orderContent}>
        <Image 
          source={{ uri: getFirstImage(item.Images) }}
          style={styles.productImage}
          resizeMode="cover"
        />
        
        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.Name}
          </Text>
          <Text style={styles.brandName}>{item.Brand_Name}</Text>
          <Text style={styles.variant}>Size: {item.Variant}</Text>
          <Text style={styles.quantity}>Qty: {item.Quantity}</Text>
        </View>

        <View style={styles.orderAmount}>
          <Text style={styles.amountText}>${item.Amount.toFixed(2)}</Text>
          <Icon name="chevron-forward" size={20} color="#8E8E93" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="receipt-outline" size={80} color="#CCC" />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your order history will appear here
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Orders List */}
      {orders.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item, index) => `${item.Inventory_Id}-${index}`}
          style={styles.ordersList}
          contentContainerStyle={styles.ordersListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        />
      )}
      {/* Bottom Navigation */}
            <View style={styles.bottomNavigation}>
              <TouchableOpacity style={styles.navItem}>
                <Icon name="home" size={24}  color="#666"  onPress={() => navigation.navigate('Home')} />
                <Text style={styles.navText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Orders')}>
                <Icon name="receipt-outline" size={24} color="#007AFF" />
                <Text style={[styles.navText, styles.navTextActive]}>Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem}>
                <Icon name="heart-outline" size={24} color="#666" />
                <Text style={styles.navText}>Wishlist</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigation.navigate('Cart')}
              >
                <Icon name="bag-outline" size={24} color="#666" />
                <Text style={styles.navText}>Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
                <Icon name="person-outline" size={24} color="#666" />
                <Text style={styles.navText}>Profile</Text>
              </TouchableOpacity>
            </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 32, // To balance the back button
  },
  ordersList: {
    flex: 1,
  },
  ordersListContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  OrderedDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  orderContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  variant: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  quantity: {
    fontSize: 12,
    color: '#8E8E93',
  },
  orderAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  shopButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#007AFF',
  },
});

export default OrderHistoryScreen;