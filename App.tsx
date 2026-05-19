/**
 * E-commerce React Native App
 *
 * @format
 */

import './global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toaster } from 'sonner-native';

import { GluestackUIProvider } from './src/lib/gluestack/provider';
import { CartProvider, useCart } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import { getSavedCartItems } from './src/api/cart';
import { STORAGE_KEYS } from './src/config/storageKeys';

function CartHydrator(): null {
  const { setCartCount } = useCart();

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.userData).then((raw) => {
      if (!raw || cancelled) return;
      let user: { CustomerProfileCode: number };
      try {
        user = JSON.parse(raw);
      } catch {
        return;
      }
      getSavedCartItems(user.CustomerProfileCode)
        .then((res: { result?: Array<{ Quantity: number }> }) => {
          if (cancelled) return;
          const items: Array<{ Quantity: number }> = res.result || [];
          const total = items.reduce((sum, item) => sum + item.Quantity, 0);
          setCartCount(total);
        })
        .catch(() => {});
    });
    return () => { cancelled = true; };
  }, [setCartCount]);

  return null;
}

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GluestackUIProvider>
          <CartProvider>
            <BottomSheetModalProvider>
              <CartHydrator />
              <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
              <AppNavigator />
              <Toaster position="top-center" />
            </BottomSheetModalProvider>
          </CartProvider>
        </GluestackUIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
