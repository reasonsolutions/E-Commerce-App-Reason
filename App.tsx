/**
 * E-commerce React Native App
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CartProvider, useCart } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import { getSavedCartItems } from './src/api/services';
import { STORAGE_KEYS } from './src/config/storageKeys';

// Lives inside CartProvider so it can call useCart().
// Runs once on mount: reads the persisted session and pre-fills the badge.
// CartScreen will overwrite with the authoritative value on first visit.
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
        .then((res) => {
          if (cancelled) return;
          const items: Array<{ Quantity: number }> = res.result || [];
          const total = items.reduce((sum, item) => sum + item.Quantity, 0);
          setCartCount(total);
        })
        .catch(() => { /* badge stays 0 — CartScreen corrects on first visit */ });
    });
    return () => { cancelled = true; };
  }, [setCartCount]);

  return null;
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <CartHydrator />
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AppNavigator />
      </CartProvider>
    </SafeAreaProvider>
  );
}

export default App;
