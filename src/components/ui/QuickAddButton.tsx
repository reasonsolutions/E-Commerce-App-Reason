import React, { useRef, useCallback, useState } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme';
import { Motion } from '../../theme/motion';
import { STORAGE_KEYS } from '../../config/storageKeys';
import { postSaveCartItems, addToGuestCart } from '../../api/cart';
import { useCart } from '../../context/CartContext';
import { useAppToast } from '../../hooks/useAppToast';
import { useHaptic } from '../../hooks/useHaptic';
import type { ProductInterface } from '../../api/interfaces';
import { isProductSoldOut } from '../../utils/stock';

interface QuickAddButtonProps {
  product: ProductInterface;
}

export const QuickAddButton: React.FC<QuickAddButtonProps> = ({ product }) => {
  const { setCartCount } = useCart();
  const toast = useAppToast();
  const haptic = useHaptic();
  const scale = useRef(new Animated.Value(1)).current;
  const [adding, setAdding] = useState(false);

  const inventoryId = product.Inventory_Id;
  // Match the variant the card's price/discount actually came from — not
  // always Variants[0] — so stock/backorder limits agree with the variant
  // being added. Falls back to Variants[0] if no match (shouldn't happen,
  // but keeps prior behavior for any caller that hasn't set Inventory_Id).
  const activeVariant =
    product.Variants?.find(v => Number(v.InventoryID) === inventoryId) ?? product.Variants?.[0];
  const isOOS = isProductSoldOut(product.Variants);
  const variantMaxPerOrder = activeVariant?.MaxPerOrder ?? null;
  const variantStock       = activeVariant?.Stock ?? null;
  const variantBackOrder   = activeVariant?.BackOrder;

  const bounce = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: Motion.badgePopScale, ...Motion.spring.snap }),
      Animated.spring(scale, { toValue: 1.0,                  ...Motion.spring.settle }),
    ]).start();
  }, [scale]);

  const handleAdd = useCallback(async () => {
    if (!inventoryId || adding) return;
    if (isOOS) {
      haptic.warning();
      toast.warning({ title: 'Out of stock', description: 'This item is currently unavailable.' });
      return;
    }
    haptic.light();
    bounce();
    setAdding(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      const profileCode = raw ? JSON.parse(raw).CustomerProfileCode : null;

      if (profileCode) {
        const res = await postSaveCartItems({
          CustomerProfileCode: profileCode,
          InventoryId:         inventoryId,
          Quantity:             1,
          IsPurchased:          false,
        });
        if (res?.statusCode !== 1) {
          toast.error({ title: "Couldn't add to bag", description: res?.userMessage ?? 'Something went wrong.' });
          return;
        }
      } else {
        await addToGuestCart({
          inventoryId,
          quantity:       1,
          price:          product.Price,
          comparePrice:   product.ComparePrice,
          name:           product.Name,
          brandName:      product.BrandName,
          variant:        product.Variant ?? '',
          image:          product.Images,
          maxPerOrder:    variantMaxPerOrder,
          stock:          variantStock,
          backOrder:      variantBackOrder,
        });
      }
      setCartCount((prev: number) => prev + 1);
      haptic.success();
      toast.success({ title: 'Added to bag' });
    } catch {
      haptic.warning();
      toast.error({ title: "Couldn't add to bag", description: 'Check your connection and try again.' });
    } finally {
      setAdding(false);
    }
  }, [inventoryId, adding, isOOS, haptic, bounce, toast, setCartCount, product, variantMaxPerOrder, variantStock, variantBackOrder]);

  if (!inventoryId) return null;

  return (
    <TouchableOpacity
      style={[styles.btn, isOOS && styles.btnDisabled]}
      onPress={handleAdd}
      disabled={adding || isOOS}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Add to bag"
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon name="add" size={18} color="#FFFFFF" />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    position:        'absolute',
    bottom:          8,
    right:           8,
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: Colors.ink1,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.10,
    shadowRadius:    8,
    elevation:       3,
  },
  btnDisabled: {
    backgroundColor: Colors.ink4,
  },
});
