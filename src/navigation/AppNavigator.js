import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { navigationRef } from '../utils/navigationService';
import HomeScreen from '../screens/HomeScreen';
import ProductScreen from '../screens/ProductScreen';
import CartScreen from '../screens/CartScreen';
import ResultScreen from '../screens/ResultScreen';
import AddressScreen from '../screens/AddressScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import Login from '../screens/Login';
import RegisterScreen from '../screens/RegisterScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WishlistScreen from '../screens/WishlistScreen';
import AddressManagementScreen from '../screens/AddressManagementScreen';
import SearchScreen from '../screens/SearchScreen';
import { getInitialRoute } from '../utils/auth';
import { Colors } from '../theme';
import EcomPaymentScreen from '../screens/PaymentScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import BrandsScreen from '../screens/BrandsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import LegalScreen from '../screens/LegalScreen';
import { TabBar } from '../components/ui';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <TabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home"     component={HomeScreen} />
    <Tab.Screen name="Orders"   component={OrderHistoryScreen} />
    <Tab.Screen name="Wishlist" component={WishlistScreen} />
    <Tab.Screen name="Profile"  component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    getInitialRoute().then(setInitialRoute);
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.ink1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.surface },
          animation: 'simple_push',
          gestureEnabled: true,
        }}>
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ animation: 'none', contentStyle: { backgroundColor: Colors.ink1 } }}
        />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'none' }} />
        <Stack.Screen name="Product" component={ProductScreen} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Address" component={AddressScreen} />
        <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailScreen} />
        <Stack.Screen name="AddressManagement" component={AddressManagementScreen} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="EcomPayment" component={EcomPaymentScreen} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="Brands" component={BrandsScreen} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;