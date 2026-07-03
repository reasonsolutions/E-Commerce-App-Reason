import React, { useState, useRef, useCallback } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme';
import { Motion } from '../../theme/motion';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { addToWishlist, removeFromWishlist, getWishlist } from '../../api/wishlist';
import { wishlistCache } from '../../utils/wishlistCache';
import { toastEmitter } from '../../utils/toastEmitter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../config/storageKeys';
import { LoginPromptSheet } from './LoginPromptSheet';
import type { WishlistItemInterface } from '../../api/interfaces';

interface WishlistHeartProps {
  inventoryId:         number;
  initialWishlistCode?: number | null;
}

export const WishlistHeart: React.FC<WishlistHeartProps> = ({
  inventoryId,
  initialWishlistCode = null,
}) => {
  // wishlistCode: null = not wishlisted, number = wishlisted (is the WishlistCode needed for remove)
  const [wishlistCode, setWishlistCode] = useState<number | null>(initialWishlistCode);
  const { guard, showLoginPrompt, dismissLoginPrompt } = useAuthGuard();
  const scale = useRef(new Animated.Value(1)).current;

  const bounce = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: Motion.badgePopScale, ...Motion.spring.snap }),
      Animated.spring(scale, { toValue: 1.0,                  ...Motion.spring.settle }),
    ]).start();
  }, [scale]);

  const toggle = useCallback(() => {
    guard(async () => {
      bounce();
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      const profileCode = raw ? JSON.parse(raw).CustomerProfileCode : null;
      if (!profileCode) return;

      if (wishlistCode !== null) {
        // Remove — optimistic
        const prev = wishlistCode;
        setWishlistCode(null);
        try {
          const res = await removeFromWishlist(profileCode, prev);
          if (res?.statusCode === 1) {
            wishlistCache.invalidate();
          } else {
            setWishlistCode(prev);
            toastEmitter.emit('error', "Couldn't remove from wishlist", res?.userMessage);
          }
        } catch {
          setWishlistCode(prev);
          toastEmitter.emit('error', "Couldn't remove from wishlist");
        }
      } else {
        // Add — optimistic, then fetch WishlistCode for future remove
        setWishlistCode(-1); // -1 = pending (shows filled heart while API resolves)
        try {
          const res = await addToWishlist(profileCode, inventoryId);
          if (res?.statusCode === 1) {
            wishlistCache.invalidate();
            const wRes = await getWishlist(profileCode);
            if (wRes?.statusCode === 1) {
              const match = (wRes.result as WishlistItemInterface[]).find(
                w => w.InventoryID === inventoryId,
              );
              setWishlistCode(match?.WishlistCode ?? -1);
            }
          } else {
            setWishlistCode(null);
            toastEmitter.emit('error', "Couldn't save to wishlist", res?.userMessage);
          }
        } catch {
          setWishlistCode(null);
          toastEmitter.emit('error', "Couldn't save to wishlist");
        }
      }
    });
  }, [guard, bounce, wishlistCode, inventoryId]);

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
            name={wishlistCode !== null ? 'heart' : 'heart-outline'}
            size={16}
            color={wishlistCode !== null ? Colors.accent : Colors.ink1}
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
