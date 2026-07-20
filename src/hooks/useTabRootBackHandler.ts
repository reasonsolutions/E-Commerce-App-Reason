import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

type TabNavigation = {
  navigate: (screen: string) => void;
};

// Hardware back on a non-Home tab root (Orders/Wishlist/Profile) would
// otherwise pop the outer stack's MainTabs entry, resurfacing whatever screen
// (Cart, Address, etc.) happened to sit underneath from an earlier flow.
// Route back to the Home tab instead — tab switching should only ever be
// driven by the tab bar, never by a stack pop. Home has its own
// useCustomBackHandler (exit app / logout-confirm) and should NOT use this.
export function useTabRootBackHandler(navigation: TabNavigation) {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.navigate('Home');
        return true;
      });
      return () => sub.remove();
    }, [navigation]),
  );
}
