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
import { ToastOverlay } from './src/components/ui';

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
      if (cancelled || !raw) return;
      let profileCode: number;
      try { profileCode = JSON.parse(raw).CustomerProfileCode; } catch { return; }
      if (!profileCode) return;
      getSavedCartItems(profileCode)
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
            </BottomSheetModalProvider>
            <ToastOverlay />
          </CartProvider>
        </GluestackUIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
