/**
 * E-commerce React Native App
 * 
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';

import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AppNavigator />
      </CartProvider>
    </SafeAreaProvider>
  );
}

export default App;
