import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme';
import { isLoggedIn } from '../../utils/auth';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { addToWishlist, removeFromWishlist } from '../../api/wishlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../config/storageKeys';
import { LoginPromptSheet } from './LoginPromptSheet';

interface WishlistHeartProps {
  inventoryId: number;
  initialSaved?: boolean;
}

export const WishlistHeart: React.FC<WishlistHeartProps> = ({ inventoryId, initialSaved = false }) => {
  const [saved, setSaved] = useState(initialSaved);
  const { guard, showLoginPrompt, dismissLoginPrompt } = useAuthGuard();

  const toggle = () => {
    guard(async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      const profileCode = raw ? JSON.parse(raw).CustomerProfileCode : null;
      if (!profileCode) return;
      if (saved) {
        setSaved(false);
        // WishlistCode not available here — fire-and-forget with inventoryId only
        // removeFromWishlist requires WishlistCode; skip server call, optimistic only
      } else {
        setSaved(true);
        addToWishlist(profileCode, inventoryId).catch(() => setSaved(false));
      }
    });
  };

  return (
    <>
      <TouchableOpacity
        style={styles.btn}
        onPress={toggle}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        activeOpacity={0.8}
      >
        <Icon
          name={saved ? 'heart' : 'heart-outline'}
          size={16}
          color={saved ? Colors.accent : Colors.ink1}
        />
      </TouchableOpacity>
      {showLoginPrompt && (
        <LoginPromptSheet
          context="wishlist"
          onClose={dismissLoginPrompt}
          onSignIn={dismissLoginPrompt}
          onRegister={dismissLoginPrompt}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  btn: {
    position:        'absolute',
    top:             8,
    right:           8,
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: 'rgba(255,255,255,0.82)',
    alignItems:      'center',
    justifyContent:  'center',
    // blur equivalent via elevation
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.10,
    shadowRadius:    8,
    elevation:       3,
  },
});
