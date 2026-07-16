import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SavedCartItemInterface } from '../../api/interfaces';
import type { GuestCartItem } from '../../api/cart';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { Motion } from '../../theme/motion';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { useHaptic } from '../../hooks/useHaptic';

// ── Logged-in cart row ────────────────────────────────────────────────────────
export const CartRow = React.memo<{
  item: SavedCartItemInterface;
  onUpdateQuantity: (item: SavedCartItemInterface, qty: number) => void;
  onRemove: (item: SavedCartItemInterface) => void;
  delay: number;
}>(({ item, onUpdateQuantity, onRemove, delay }) => {
  const haptic         = useHaptic();
  const animOpacity    = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(Motion.list.initialY)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(animOpacity,    { toValue: 1, duration: Motion.duration.settle, delay, useNativeDriver: true }),
      Animated.timing(animTranslateY, { toValue: 0, duration: Motion.duration.settle, delay, useNativeDriver: true }),
    ]).start();
  }, [animOpacity, animTranslateY, delay]);
  const anim      = { opacity: animOpacity, transform: [{ translateY: animTranslateY }] };

  const comparePrice = item.PriceDetails?.ComparePrice ?? 0;
  const lineTotal    = item.Price * item.Quantity;
  const hasDiscount  = comparePrice > item.Price;

  const handleDecrement = useCallback(() => {
    haptic.light();
    if (item.Quantity > 1) onUpdateQuantity(item, item.Quantity - 1);
    else onRemove(item);
  }, [haptic, item, onUpdateQuantity, onRemove]);

  const handleIncrement = useCallback(() => {
    haptic.light();
    onUpdateQuantity(item, item.Quantity + 1);
  }, [haptic, item, onUpdateQuantity]);

  const handleRemove = useCallback(() => {
    haptic.light();
    onRemove(item);
  }, [haptic, item, onRemove]);

  return (
    <Animated.View style={[styles.cartRow, anim]}>
      <View style={styles.cartImgWrap}>
        <Image
          source={{ uri: resolveImageUrl(item.Images) }}
          style={styles.cartImg}
          resizeMode="cover"
        />
      </View>

      <View style={styles.cartContent}>
        {item.BrandName ? (
          <Text style={styles.cartBrand}>{item.BrandName.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.cartName} numberOfLines={2}>{item.Name}</Text>
        {item.Variant ? (
          <Text style={styles.cartVariant}>{item.Variant}</Text>
        ) : null}

        <View style={styles.cartPriceRow}>
          <Text style={styles.cartLineTotal}>MUR {lineTotal.toLocaleString('en-IN')}</Text>
          {hasDiscount && (
            <Text style={styles.cartUnitWas}>MUR {comparePrice.toLocaleString('en-IN')}</Text>
          )}
        </View>

        <View style={styles.cartBottom}>
          <View style={styles.qtyPill}>
            <TouchableOpacity
              onPress={handleDecrement}
              style={styles.qtyPillBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel={item.Quantity <= 1 ? 'Remove item' : 'Decrease quantity'}
              accessibilityRole="button"
            >
              <Text style={styles.qtyBtn}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.Quantity}</Text>
            <TouchableOpacity
              onPress={handleIncrement}
              style={styles.qtyPillBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Increase quantity"
              accessibilityRole="button"
            >
              <Text style={styles.qtyBtn}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Remove item"
            accessibilityRole="button"
          >
            <Icon name="trash-outline" size={13} color={Colors.ink4} />
            <Text style={styles.removeLink}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});

// ── Guest cart row ────────────────────────────────────────────────────────────
export const GuestCartRow = React.memo<{
  item: GuestCartItem;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
  delay: number;
}>(({ item, onUpdateQuantity, onRemove, delay }) => {
  const haptic         = useHaptic();
  const animOpacity    = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(Motion.list.initialY)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(animOpacity,    { toValue: 1, duration: Motion.duration.settle, delay, useNativeDriver: true }),
      Animated.timing(animTranslateY, { toValue: 0, duration: Motion.duration.settle, delay, useNativeDriver: true }),
    ]).start();
  }, [animOpacity, animTranslateY, delay]);
  const anim       = { opacity: animOpacity, transform: [{ translateY: animTranslateY }] };
  const [imgFailed, setImgFailed] = useState(false);
  const imgUri = resolveImageUrl(item.image);

  const onError = useCallback(() => setImgFailed(true), []);

  const hasDiscount = item.comparePrice > item.price;

  const handleDecrement = useCallback(() => {
    haptic.light();
    if (item.quantity > 1) onUpdateQuantity(item.quantity - 1);
    else onRemove();
  }, [haptic, item.quantity, onUpdateQuantity, onRemove]);

  const handleIncrement = useCallback(() => {
    haptic.light();
    onUpdateQuantity(item.quantity + 1);
  }, [haptic, item.quantity, onUpdateQuantity]);

  const handleRemove = useCallback(() => {
    haptic.light();
    onRemove();
  }, [haptic, onRemove]);

  return (
    <Animated.View style={[styles.cartRow, anim]}>
      <View style={styles.cartImgWrap}>
        {imgUri && !imgFailed ? (
          <Image
            source={{ uri: imgUri }}
            style={styles.cartImg}
            resizeMode="cover"
            onError={onError}
          />
        ) : (
          <View style={[styles.cartImg, styles.cartImgFallback]}>
            <Text style={styles.cartImgFallbackText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.cartContent}>
        {item.brandName ? <Text style={styles.cartBrand}>{item.brandName.toUpperCase()}</Text> : null}
        <Text style={styles.cartName} numberOfLines={2}>{item.name}</Text>
        {item.variant ? <Text style={styles.cartVariant}>{item.variant}</Text> : null}
        <View style={styles.cartPriceRow}>
          <Text style={styles.cartLineTotal}>MUR {(item.price * item.quantity).toLocaleString('en-IN')}</Text>
          {hasDiscount && <Text style={styles.cartUnitWas}>MUR {item.comparePrice.toLocaleString('en-IN')}</Text>}
        </View>
        <View style={styles.cartBottom}>
          <View style={styles.qtyPill}>
            <TouchableOpacity
              onPress={handleDecrement}
              style={styles.qtyPillBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel={item.quantity <= 1 ? 'Remove item' : 'Decrease quantity'}
              accessibilityRole="button"
            >
              <Text style={styles.qtyBtn}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={handleIncrement}
              style={styles.qtyPillBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Increase quantity"
              accessibilityRole="button"
            >
              <Text style={styles.qtyBtn}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Remove item"
            accessibilityRole="button"
          >
            <Icon name="trash-outline" size={13} color={Colors.ink4} />
            <Text style={styles.removeLink}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});

// ── Stable memo wrapper (prevents inline arrow fn breaking GuestCartRow memo) ─
export const GuestCartRowWrapper = React.memo<{
  item: GuestCartItem;
  index: number;
  onUpdateGuestQuantity: (inventoryId: number, oldQty: number, newQty: number) => void;
  onRemoveGuest: (inventoryId: number, qty: number) => void;
}>(({ item, index, onUpdateGuestQuantity, onRemoveGuest }) => {
  const onUpdateQuantity = useCallback(
    (newQty: number) => onUpdateGuestQuantity(item.inventoryId, item.quantity, newQty),
    [item.inventoryId, item.quantity, onUpdateGuestQuantity],
  );
  const onRemove = useCallback(
    () => onRemoveGuest(item.inventoryId, item.quantity),
    [item.inventoryId, item.quantity, onRemoveGuest],
  );
  return (
    <GuestCartRow
      item={item}
      onUpdateQuantity={onUpdateQuantity}
      onRemove={onRemove}
      delay={Motion.stagger.delay(index)}
    />
  );
});

// ── Shared styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  cartRow: {
    flexDirection:   'row',
    gap:             Space[4],
    paddingVertical: Space[5],
  },
  cartImgWrap: {
    width:            80,
    height:           100,
    borderRadius:     Radius.sm,
    overflow:         'hidden',
    backgroundColor:  Colors.surface,
    flexShrink:       0,
  },
  cartImg: {
    width:  '100%',
    height: '100%',
  },
  cartImgFallback: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  cartImgFallbackText: {
    fontFamily: FontFamily.serifItalic,
    fontSize:   28,
    color:      'rgba(40,32,24,0.22)',
  },
  cartContent: {
    flex: 1,
    gap:  4,
  },
  cartBrand: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 1.4,
    fontSize:      9,
  },
  cartName: {
    fontFamily:    FontFamily.sans,
    fontSize:      15,
    fontWeight:    '500',
    color:         Colors.ink1,
    letterSpacing: -0.2,
    lineHeight:    20,
  },
  cartVariant: {
    ...Type.caption,
    color:    Colors.ink4,
    fontSize: 12,
  },
  cartPriceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           Space[2],
    marginTop:     2,
  },
  cartLineTotal: {
    fontFamily:    FontFamily.sans,
    fontSize:      15,
    fontWeight:    '700',
    color:         Colors.ink1,
    letterSpacing: -0.1,
  },
  cartUnitWas: {
    fontFamily:         FontFamily.sans,
    fontSize:           11,
    fontWeight:         '400',
    color:              Colors.ink4,
    textDecorationLine: 'line-through',
  },
  cartBottom: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginTop:      Space[2],
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  removeLink: {
    ...Type.caption,
    color:    Colors.ink4,
    fontSize: 12,
  },
  qtyPill: {
    flexDirection: 'row',
    alignItems:    'center',
    borderRadius:  Radius.pill,
    borderWidth:   StyleSheet.hairlineWidth,
    borderColor:   Colors.rule,
    overflow:      'hidden',
  },
  qtyPillBtn: {
    width:           32,
    height:          32,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.surfaceDeep,
  },
  qtyBtn: {
    fontSize:   16,
    fontWeight: '500',
    color:      Colors.ink2,
    lineHeight: 20,
  },
  qtyValue: {
    fontSize:        13,
    fontWeight:      '500',
    color:           Colors.ink1,
    minWidth:        28,
    height:          32,
    lineHeight:      32,
    backgroundColor: Colors.surfaceDeep,
    textAlign:       'center',
    letterSpacing: 0.4,
  },
});
