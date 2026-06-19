import React, { useState, useRef, useCallback } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme';
import { Motion } from '../../theme/motion';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { addToWishlist } from '../../api/wishlist';
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
  const scale = useRef(new Animated.Value(1)).current;

  const bounce = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.4, duration: Motion.duration.tap,    useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0, duration: Motion.duration.tap,    useNativeDriver: true }),
    ]).start();
  }, [scale]);

  const toggle = useCallback(() => {
    guard(async () => {
      bounce();
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      const profileCode = raw ? JSON.parse(raw).CustomerProfileCode : null;
      if (!profileCode) return;
      if (saved) {
        setSaved(false);
        // removeFromWishlist requires WishlistCode — optimistic only
      } else {
        setSaved(true);
        addToWishlist(profileCode, inventoryId).catch(() => setSaved(false));
      }
    });
  }, [guard, bounce, saved, inventoryId]);

  return (
    <>
      <TouchableOpacity
        style={styles.btn}
        onPress={toggle}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Icon
            name={saved ? 'heart' : 'heart-outline'}
            size={16}
            color={saved ? Colors.accent : Colors.ink1}
          />
        </Animated.View>
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
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.10,
    shadowRadius:    8,
    elevation:       3,
  },
});
