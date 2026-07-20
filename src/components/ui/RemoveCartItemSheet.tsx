import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { useTactile } from '../../hooks/useTactile';
import { resolveImageUrl } from '../../utils/resolveImageUrl';

interface RemoveCartItemSheetProps {
  itemName: string;
  itemImage: string;
  showMoveToWishlist: boolean;
  moveLoading?: boolean;
  onRemove: () => void;
  onMoveToWishlist: () => void;
  onClose: () => void;
}

// Confirms intent before removing a cart item — surfaced when quantity is
// already 1 (further decrement means removal) or the Remove link is tapped.
// Two-action layout (Remove / Move to Wishlist) doesn't fit ConfirmSheet's
// single confirm+cancel API, so this is a dedicated sheet mirroring its
// Modal + slide-up structure and tokens instead.
export const RemoveCartItemSheet: React.FC<RemoveCartItemSheetProps> = ({
  itemName,
  itemImage,
  showMoveToWishlist,
  moveLoading = false,
  onRemove,
  onMoveToWishlist,
  onClose,
}) => {
  const insets    = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const removeTactile = useTactile();
  const moveTactile   = useTactile();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue:         0,
      duration:        320,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + Space[6], transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />
        <View style={styles.inner}>
          <Text style={styles.title}>Remove this item?</Text>

          <View style={styles.itemRow}>
            <Image source={{ uri: resolveImageUrl(itemImage) }} style={styles.itemImg} resizeMode="cover" />
            <Text style={styles.itemName} numberOfLines={2}>{itemName}</Text>
          </View>

          <View style={styles.actions}>
            {showMoveToWishlist && (
              <Animated.View style={moveTactile.animatedStyle}>
                <TouchableOpacity
                  {...moveTactile.handlers}
                  activeOpacity={1}
                  onPress={onMoveToWishlist}
                  disabled={moveLoading}
                  style={[styles.btn, styles.btnPrimary]}
                >
                  <Text style={styles.btnTextPrimary}>
                    {moveLoading ? 'Moving…' : 'Move to Wishlist'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            <Animated.View style={removeTactile.animatedStyle}>
              <TouchableOpacity
                {...removeTactile.handlers}
                activeOpacity={1}
                onPress={onRemove}
                style={[styles.btn, styles.btnOutline]}
              >
                <Text style={styles.btnTextOutline}>Remove</Text>
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelWrap}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position:             'absolute',
    bottom:               0,
    left:                 0,
    right:                0,
    backgroundColor:      Colors.surface,
    borderTopLeftRadius:  Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: Colors.rule,
    alignSelf:       'center',
    marginTop:       Space[2],
    marginBottom:    Space[1],
  },
  inner: {
    paddingHorizontal: Space[6],
    paddingTop:        Space[3],
    gap:               Space[4],
  },
  title: {
    fontFamily:    FontFamily.serif,
    fontSize:      20,
    fontWeight:    '600',
    color:         Colors.ink1,
    letterSpacing: -0.2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[3],
    padding:       Space[3],
    backgroundColor: Colors.surfaceSoft,
    borderRadius:  Radius.md,
  },
  itemImg: {
    width:        48,
    height:       60,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
  },
  itemName: {
    ...Type.body,
    flex:      1,
    color:     Colors.ink1,
    fontSize:  14,
  },
  actions: {
    gap: Space[3],
  },
  btn: {
    alignSelf:       'stretch',
    paddingVertical: Space[4],
    borderRadius:    Radius.pill,
    alignItems:      'center',
  },
  btnPrimary: {
    backgroundColor: Colors.ink1,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth:     1,
    borderColor:     Colors.ink1,
  },
  btnTextPrimary: {
    ...Type.bodyStrong,
    color: '#FFFFFF',
  },
  btnTextOutline: {
    ...Type.bodyStrong,
    color: Colors.ink1,
  },
  cancelWrap: {
    alignSelf: 'center',
    marginTop: Space[1],
  },
  cancelText: {
    ...Type.caption,
    color: Colors.ink3,
  },
});
