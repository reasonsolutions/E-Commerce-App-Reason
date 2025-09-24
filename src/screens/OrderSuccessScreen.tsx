import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

type NavigationProp = {
  navigate: {
    (screen: string): void;
    (screen: string, params: Record<string, any>): void;
  };
  goBack: () => void;
};

type OrderSuccessScreenProps = {
  navigation: NavigationProp;
  route: {
    params?: {
      orderNumber?: string;
    };
  };
};

const OrderSuccessScreen: React.FC<OrderSuccessScreenProps> = ({ navigation , route }) => {

  // Get order number from route params
  const orderNumber = route.params?.orderNumber;

  const handleContinueShopping = () => {
    navigation.navigate('Home');
  };

  const handleViewOrders = () => {
    navigation.navigate('Orders');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.checkIcon}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>
          Thank you for your purchase. Your order has been confirmed.
        </Text>

        {/* Order Number */}
        <View style={styles.orderContainer}>
          <Text style={styles.orderLabel}>Order Number</Text>
          <Text style={styles.orderNumber}>#{orderNumber}</Text>
        </View>

        {/* Additional Info */}
        <Text style={styles.infoText}>
          You will receive a confirmation email shortly with your order details.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleViewOrders}
          >
            <Text style={styles.primaryButtonText}>View My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleContinueShopping}
          >
            <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  checkIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#4CAF50',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkMark: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  orderContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  orderLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    letterSpacing: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
  },
});

export default OrderSuccessScreen;