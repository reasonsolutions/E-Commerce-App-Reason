import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { Colors, Space, Radius, FontSize, FontWeight, Shadow } from '../theme';
import { Type } from '../theme/typography';

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

const OrderSuccessScreen: React.FC<OrderSuccessScreenProps> = ({ navigation, route }) => {

  const orderNumber = route.params?.orderNumber;

  const handleContinueShopping = () => {
    navigation.navigate('Home');
  };

  const handleViewOrders = () => {
    navigation.navigate('Orders');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={styles.content}>
        {/* Success icon */}
        <View style={styles.iconContainer}>
          <View style={styles.checkIcon}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </View>

        {/* Success message */}
        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>
          Thank you for your purchase. Your order has been confirmed.
        </Text>

        {/* Order number card */}
        <View style={styles.orderContainer}>
          <Text style={styles.orderLabel}>Order Number</Text>
          <Text style={styles.orderNumber}>#{orderNumber}</Text>
        </View>

        {/* Additional info */}
        <Text style={styles.infoText}>
          You will receive a confirmation email shortly with your order details.
        </Text>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <Button variant="primary" size="lg" fullWidth onPress={handleViewOrders}>
            View My Orders
          </Button>
          <Button variant="secondary" size="lg" fullWidth onPress={handleContinueShopping}>
            Continue Shopping
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space[6],
    paddingVertical: Space[8],
  },
  iconContainer: {
    marginBottom: Space[8],
  },
  checkIcon: {
    width: 80,
    height: 80,
    backgroundColor: Colors.success,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  checkMark: {
    fontSize: FontSize['3xl'],
    color: Colors.accentInk,
    fontWeight: FontWeight.bold,
  },
  title: {
    ...Type.title,
    textAlign: 'center',
    marginBottom: Space[3],
  },
  subtitle: {
    ...Type.body,
    color: Colors.ink3,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.6,
    marginBottom: Space[8],
  },
  orderContainer: {
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: Space[5],
    paddingHorizontal: Space[6],
    borderRadius: Radius.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: Space[6],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.line,
  },
  orderLabel: {
    ...Type.label,
    marginBottom: Space[2],
  },
  orderNumber: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.ink1,
    letterSpacing: 1.5,
  },
  infoText: {
    ...Type.caption,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.5,
    marginBottom: Space[10],
    paddingHorizontal: Space[4],
  },
  buttonContainer: {
    width: '100%',
    gap: Space[3],
  },
});

export default OrderSuccessScreen;
