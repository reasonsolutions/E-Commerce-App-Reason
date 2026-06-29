import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Animated,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { SavedCartItemInterface } from '../api/interfaces';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { getSavedCartItems, postDeleteCartItem, updateCartItemQuantity, getGuestCart, updateGuestCartItem, removeFromGuestCart, clearGuestCart } from '../api/cart';
import type { GuestCartItem } from '../api/cart';
import { isLoggedIn } from '../utils/auth';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useAsyncState } from '../hooks/useAsyncState';
import { useCart } from '../context/CartContext';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { useAppToast } from '../hooks/useAppToast';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { LoginPromptSheet } from '../components/ui/LoginPromptSheet';
import { ConfirmSheet } from '../components/ui';

type CartScreenProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

// ── Cart row ──────────────────────────────────────────────────────────────────
const CartRow = React.memo<{
  item: SavedCartItemInterface;
  onUpdateQuantity: (item: SavedCartItemInterface, qty: number) => void;
  onRemove: (item: SavedCartItemInterface) => void;
  delay: number;
}>(({ item, onUpdateQuantity, onRemove, delay }) => {
  const haptic     = useHaptic();
  const animOpacity    = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(animOpacity,    { toValue: 1, duration: Motion.duration.settle, delay, useNativeDriver: true }),
      Animated.timing(animTranslateY, { toValue: 0, duration: Motion.duration.settle, delay, useNativeDriver: true }),
    ]).start();
  }, [animOpacity, animTranslateY, delay]);
  const anim = { opacity: animOpacity, transform: [{ translateY: animTranslateY }] };
  const imgOpacity = useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, {
      toValue:  1,
      duration: Motion.duration.settle,
      easing:   Motion.easing.out,
      useNativeDriver: true,
    }).start();
  }, [imgOpacity]);

  const comparePrice = item.PriceDetails?.ComparePrice ?? 0;
  const lineTotal    = item.Price * item.Quantity;
  const hasDiscount  = comparePrice > item.Price;

  const handleDecrement = useCallback(() => {
    haptic.light();
    if (item.Quantity > 1) onUpdateQuantity(item, item.Quantity - 1);
  }, [haptic, item, onUpdateQuantity]);

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
        <Animated.Image
          source={{ uri: resolveImageUrl(item.Images) }}
          style={[styles.cartImg, { opacity: imgOpacity }]}
          resizeMode="cover"
          onLoad={onLoad}
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
              disabled={item.Quantity <= 1}
              style={[styles.qtyPillBtn, item.Quantity <= 1 && styles.qtyPillBtnDisabled]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel="Decrease quantity"
              accessibilityRole="button"
            >
              <Text style={[styles.qtyBtn, item.Quantity <= 1 && styles.qtyBtnDisabled]}>−</Text>
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
const GuestCartRow = React.memo<{
  item: GuestCartItem;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
  delay: number;
}>(({ item, onUpdateQuantity, onRemove, delay }) => {
  const haptic = useHaptic();
  const animOpacity    = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(animOpacity,    { toValue: 1, duration: Motion.duration.settle, delay, useNativeDriver: true }),
      Animated.timing(animTranslateY, { toValue: 0, duration: Motion.duration.settle, delay, useNativeDriver: true }),
    ]).start();
  }, [animOpacity, animTranslateY, delay]);
  const anim = { opacity: animOpacity, transform: [{ translateY: animTranslateY }] };
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const [imgFailed, setImgFailed] = useState(false);
  const imgUri = resolveImageUrl(item.image);
  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: Motion.duration.settle, easing: Motion.easing.out, useNativeDriver: true }).start();
  }, [imgOpacity]);
  const onError = useCallback(() => setImgFailed(true), []);

  const hasDiscount = item.comparePrice > item.price;

  return (
    <Animated.View style={[styles.cartRow, anim]}>
      <View style={styles.cartImgWrap}>
        {imgUri && !imgFailed ? (
          <Animated.Image
            source={{ uri: imgUri }}
            style={[styles.cartImg, { opacity: imgOpacity }]}
            resizeMode="cover"
            onLoad={onLoad}
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
              onPress={() => { haptic.light(); if (item.quantity > 1) onUpdateQuantity(item.quantity - 1); }}
              disabled={item.quantity <= 1}
              style={[styles.qtyPillBtn, item.quantity <= 1 && styles.qtyPillBtnDisabled]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => { haptic.light(); onUpdateQuantity(item.quantity + 1); }}
              style={styles.qtyPillBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.qtyBtn}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => { haptic.light(); onRemove(); }}
            style={styles.removeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="trash-outline" size={13} color={Colors.ink4} />
            <Text style={styles.removeLink}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});

// Stable wrapper so GuestCartRow memo is not broken by inline arrow functions
const GuestCartRowWrapper = React.memo<{
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
      delay={Math.min(index * 55, 280)}
    />
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────
const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { setCartCount } = useCart();
  const checkoutTactile = useTactile();
  const toast = useAppToast();
  const { guard, showLoginPrompt, dismissLoginPrompt } = useAuthGuard();

  const { data: fetched, loading, isError, error, run } = useAsyncState<SavedCartItemInterface[]>([]);
  const [optimistic, setOptimistic] = useState<SavedCartItemInterface[] | null>(null);
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cartItems = optimistic ?? fetched ?? [];

  const fetchCart = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        // Read in parallel — independent I/O, no need to wait on one before the other
        const [loggedIn, raw] = await Promise.all([
          isLoggedIn(),
          AsyncStorage.getItem(STORAGE_KEYS.userData),
        ]);
        if (!loggedIn) {
          setIsGuest(true);
          const items = await getGuestCart();
          setGuestItems(items);
          setHasFetched(true);
          setCartCount(items.reduce((s, i) => s + i.quantity, 0));
          return [];
        }
        setIsGuest(false);
        const code = raw ? JSON.parse(raw).CustomerProfileCode : null;
        if (!code) return [];
        const response = await getSavedCartItems(code);
        return response.result || [];
      }, cancelled),
    [run, setCartCount],
  );

  // Sync cart badge whenever server data arrives
  useEffect(() => {
    if (fetched !== null && !isGuest) {
      setHasFetched(true);
      setOptimistic(null);
      const total = fetched.reduce((sum, item) => sum + item.Quantity, 0);
      setCartCount(total);
    }
  }, [fetched, setCartCount, isGuest]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, [fetchCart]);

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      setHasFetched(false);
      setOptimistic(null);
      fetchCart(cancelled);
      return () => { cancelled.current = true; };
    }, [fetchCart]),
  );

  const summaryOpacity    = useRef(new Animated.Value(0)).current;
  const summaryTranslateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    if (!hasFetched) return;
    Animated.parallel([
      Animated.timing(summaryOpacity,    { toValue: 1, duration: Motion.duration.settle, delay: 40, useNativeDriver: true }),
      Animated.timing(summaryTranslateY, { toValue: 0, duration: Motion.duration.settle, delay: 40, useNativeDriver: true }),
    ]).start();
  }, [hasFetched, summaryOpacity, summaryTranslateY]);
  const summaryAnim = { opacity: summaryOpacity, transform: [{ translateY: summaryTranslateY }] };

  const subtotal = isGuest
    ? guestItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    : cartItems.reduce((sum, item) => sum + item.Price * item.Quantity, 0);
  const itemCount = isGuest
    ? guestItems.reduce((sum, i) => sum + i.quantity, 0)
    : cartItems.reduce((sum, item) => sum + item.Quantity, 0);
  const originalTotal = isGuest
    ? guestItems.reduce((sum, i) => sum + (i.comparePrice > i.price ? i.comparePrice : i.price) * i.quantity, 0)
    : cartItems.reduce((sum, item) => {
        const compare = item.PriceDetails?.ComparePrice ?? 0;
        return sum + (compare > item.Price ? compare : item.Price) * item.Quantity;
      }, 0);
  const totalSavings = originalTotal - subtotal;

  const handleUpdateQuantity = useCallback(async (item: SavedCartItemInterface, quantity: number) => {
    const delta = quantity - item.Quantity;
    if (delta === 0) return;
    setOptimistic(prev =>
      (prev ?? fetched ?? []).map(ci =>
        ci.CartDetailsCode === item.CartDetailsCode ? { ...ci, Quantity: quantity } : ci,
      ),
    );
    setCartCount((prev: number) => prev + delta);
    try {
      await updateCartItemQuantity(item.CartDetailsCode, item.InventoryId, quantity);
    } catch {
      fetchCart();
    }
  }, [setCartCount, fetchCart, fetched]);

  const handleUpdateGuestQuantity = useCallback(async (inventoryId: number, oldQty: number, newQty: number) => {
    const delta = newQty - oldQty;
    if (delta === 0) return;
    const updated = await updateGuestCartItem(inventoryId, newQty);
    setGuestItems(updated);
    setCartCount((prev: number) => prev + delta);
  }, [setCartCount]);

  const handleRemoveItem = useCallback(async (item: SavedCartItemInterface) => {
    setOptimistic(prev =>
      (prev ?? fetched ?? []).filter(ci => ci.CartDetailsCode !== item.CartDetailsCode),
    );
    setCartCount((prev: number) => Math.max(0, prev - item.Quantity));
    try {
      await postDeleteCartItem(item.CartDetailsCode);
    } catch {
      fetchCart();
    }
  }, [setCartCount, fetchCart, fetched]);

  const handleRemoveGuestItem = useCallback(async (inventoryId: number, qty: number) => {
    const updated = await removeFromGuestCart(inventoryId);
    setGuestItems(updated);
    setCartCount((prev: number) => Math.max(0, prev - qty));
  }, [setCartCount]);

  const handleCheckout = useCallback(() => {
    guard(() => navigation.navigate('Address', { cartItems }));
  }, [guard, navigation, cartItems]);

  const clearCart = useCallback(async () => {
    setClearing(true);
    try {
      if (isGuest) {
        await clearGuestCart();
        setGuestItems([]);
        setCartCount(0);
      } else {
        await Promise.all(cartItems.map(item => postDeleteCartItem(item.CartDetailsCode)));
        setOptimistic([]);
        setCartCount(0);
      }
    } catch {
      toast.error({ title: 'Error', description: 'Failed to clear cart. Please try again.' });
      if (!isGuest) fetchCart();
    } finally {
      setClearing(false);
    }
  }, [isGuest, cartItems, guestItems, setCartCount, fetchCart]);

  const renderBody = () => {
    if (!hasFetched && !isError) {
      return (
        <View style={styles.fillWrap}>
          <View style={styles.itemsSection}>
            {[0, 1, 2].map(i => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.itemDivider} />}
                <View style={styles.skeletonRow}>
                  <View style={styles.skeletonImg} />
                  <View style={styles.skeletonContent}>
                    <View style={[styles.skeletonLine, { width: '35%' }]} />
                    <View style={[styles.skeletonLine, { width: '72%' }]} />
                    <View style={[styles.skeletonLine, { width: '50%' }]} />
                    <View style={[styles.skeletonLine, { width: '28%', marginTop: Space[2] }]} />
                    <View style={[styles.skeletonLine, { width: '55%', marginTop: Space[3] }]} />
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.fillWrap}>
          <ErrorState
            title="Couldn't load your bag."
            message={error ?? 'Tap retry to try again.'}
            onRetry={() => fetchCart()}
            retryLoading={loading}
            icon={<Icon name="bag-outline" size={32} color={Colors.ink3} />}
          />
        </View>
      );
    }

    if ((isGuest && guestItems.length === 0 && hasFetched) ||
        (cartItems.length === 0 && !loading && hasFetched && !isGuest)) {
      return (
        <View style={styles.fillWrap}>
          <View style={styles.emptyContent}>
            <Icon name="bag-outline" size={36} color={Colors.ink4} />
            <View style={styles.emptyText}>
              <Text style={styles.emptyTitle}>Your bag is empty.</Text>
              <Text style={styles.emptyBody}>Add items you love and they'll appear here.</Text>
            </View>
          </View>
          <View style={styles.emptyFooter}>
            <TouchableOpacity
              style={styles.emptyCTA}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Home')}
              accessibilityRole="button"
              accessibilityLabel="Start shopping"
            >
              <Text style={styles.emptyCTAText}>Start Shopping</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emptySecondary}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Wishlist')}
              accessibilityRole="button"
              accessibilityLabel="View wishlist"
            >
              <Text style={styles.emptySecondaryText}>View Wishlist</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.bodyWrap}>
        {/* ── Items scroll ─────────────────────────────────────────────── */}
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {/* ── Bag items ──────────────────────────────────────────────── */}
          <View style={styles.itemsSection}>
            {isGuest
              ? guestItems.map((item, index) => (
                  <React.Fragment key={`guest-${item.inventoryId}`}>
                    {index > 0 && <View style={styles.itemDivider} />}
                    <GuestCartRowWrapper
                      item={item}
                      index={index}
                      onUpdateGuestQuantity={handleUpdateGuestQuantity}
                      onRemoveGuest={handleRemoveGuestItem}
                    />
                  </React.Fragment>
                ))
              : cartItems.map((item, index) => (
                  <React.Fragment key={`${item.CartDetailsCode}-${index}`}>
                    {index > 0 && <View style={styles.itemDivider} />}
                    <CartRow
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemoveItem}
                      delay={Math.min(index * 55, 280)}
                    />
                  </React.Fragment>
                ))
            }
          </View>

          {/* ── Savings banner — only when savings are real ────────────── */}
          {totalSavings > 0 && (
            <View style={styles.savingsBanner}>
              <Icon name="gift-outline" size={16} color="#226B3C" />
              <Text style={styles.savingsBannerText}>
                You're saving MUR {totalSavings.toFixed(0)} on this order
              </Text>
            </View>
          )}

          {/* ── Order summary card ─────────────────────────────────────── */}
          <Animated.View style={[styles.summaryCard, summaryAnim]}>
            <Text style={styles.summaryCardLabel}>ORDER SUMMARY</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>MUR {subtotal.toFixed(0)}</Text>
            </View>
            {totalSavings > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.savingsLabel}>Savings</Text>
                <Text style={styles.savingsValue}>− MUR {totalSavings.toFixed(0)}</Text>
              </View>
            )}
            <View style={styles.summaryRule} />
            <View style={styles.summaryPayableBlock}>
              <Text style={styles.summaryPayableLabel}>PAYABLE NOW</Text>
              <Text style={styles.summaryPayableAmount}>MUR {subtotal.toLocaleString('en-IN')}</Text>
            </View>
          </Animated.View>

          {/* ── Trust strip ────────────────────────────────────────────── */}
          <View style={styles.trustRow}>
            {[
              'Secure Checkout',
              'Easy Returns',
              'Safe Payments',
            ].map(label => (
              <View key={label} style={styles.trustItem}>
                <Icon name="checkmark-circle-outline" size={15} color={Colors.ink3} />
                <Text style={styles.trustText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* ── Continue shopping ──────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.continueShoppingBtn, { marginHorizontal: Space.screenH, marginTop: Space[3] }]}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.continueShoppingText}>← Continue Shopping</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Sticky checkout footer ─────────────────────────────────── */}
        <View style={[styles.summaryPanel, { paddingBottom: insets.bottom + Space[4] }]}>
          <Animated.View style={checkoutTactile.animatedStyle}>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
              {...checkoutTactile.handlers}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel="Proceed to checkout"
            >
              <Icon name="lock-closed-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.checkoutBtnText}>Secure Checkout</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Light inline header ───────────────────────────────────────── */}
      <View
        style={[styles.header, { paddingTop: insets.top + Space[3] }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-back" size={22} color={Colors.ink1} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              My Bag{hasFetched && itemCount > 0 ? ` (${itemCount})` : ''}
            </Text>
          </View>

          {(isGuest ? guestItems.length : cartItems.length) > 0 ? (
            <TouchableOpacity
              onPress={() => setShowClearConfirm(true)}
              disabled={clearing}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearBtn}>{clearing ? '…' : 'Clear'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
      </View>
      <View style={styles.headerDivider} />

      {renderBody()}

      {showLoginPrompt && (
        <LoginPromptSheet
          onClose={dismissLoginPrompt}
          onSignIn={() => { dismissLoginPrompt(); navigation.navigate('Login'); }}
          onRegister={() => { dismissLoginPrompt(); navigation.navigate('Register'); }}
        />
      )}

      {showClearConfirm && (
        <ConfirmSheet
          onClose={() => setShowClearConfirm(false)}
          onConfirm={() => { setShowClearConfirm(false); clearCart(); }}
          title="Clear bag"
          body="Remove all items from your bag?"
          confirmLabel="Clear"
          destructive
        />
      )}
    </View>
  );
};

const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: WHITE,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor:   WHITE,
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  headerCenter: {
    flex:              1,
    paddingHorizontal: Space[3],
  },
  headerTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.2,
  },
  headerCount: {
    ...Type.label,
    color: Colors.ink4,
  },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  headerSpacer: {
    width: 32,
  },
  clearBtn: {
    ...Type.caption,
    color: Colors.ink4,
  },

  // ── Fill wrappers ─────────────────────────────────────────────────────────
  fillWrap: {
    flex:            1,
    backgroundColor: WHITE,
  },
  skeletonRow: {
    flexDirection:  'row',
    gap:            Space[4],
    paddingVertical: Space[5],
  },
  skeletonImg: {
    width:           80,
    height:          100,
    borderRadius:    Radius.sm,
    backgroundColor: Colors.surfaceDeep,
    flexShrink:      0,
  },
  skeletonContent: {
    flex: 1,
    gap:  Space[2],
  },
  skeletonLine: {
    height:          10,
    borderRadius:    Radius.xs,
    backgroundColor: Colors.surfaceDeep,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContent: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Space[6],
    gap:               Space[4],
  },
  emptyText: {
    gap:        Space[2],
    alignItems: 'center',
  },
  emptyTitle: {
    ...Type.title,
    textAlign: 'center',
    color:     Colors.ink1,
  },
  emptyBody: {
    ...Type.caption,
    textAlign: 'center',
    color:     Colors.ink3,
    maxWidth:  260,
  },
  emptyFooter: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[8],
    paddingTop:        Space[4],
    gap:               Space[3],
  },
  emptyCTA: {
    height:          52,
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    alignItems:      'center',
    justifyContent:  'center',
  },
  emptyCTAText: {
    ...Type.bodyStrong,
    color:         WHITE,
    letterSpacing: 0.3,
  },
  emptySecondary: {
    alignItems:      'center',
    paddingVertical: Space[2],
  },
  emptySecondaryText: {
    ...Type.caption,
    color: Colors.ink3,
  },

  // ── Body layout ───────────────────────────────────────────────────────────
  bodyWrap: {
    flex: 1,
  },
  scroll: {
    flex:            1,
    backgroundColor: WHITE,
  },
  scrollContent: {
    paddingBottom: Space[8],
  },

  // ── Items list — divider-separated, no cards ──────────────────────────────
  itemsSection: {
    paddingHorizontal: Space.screenH,
  },
  itemDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── Cart row ──────────────────────────────────────────────────────────────
  cartRow: {
    flexDirection:   'row',
    gap:             Space[4],
    paddingVertical: Space[5],
  },
  cartImgWrap: {
    width:           80,
    height:          100,
    borderRadius:    Radius.sm,
    overflow:        'hidden',
    backgroundColor: Colors.surfaceDeep,
    flexShrink:      0,
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
    fontFamily:    FontFamily.serif,
    fontSize:      15,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.2,
    lineHeight:    22,
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
    fontFamily:    FontFamily.serif,
    fontSize:      15,
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  cartUnitWas: {
    ...Type.caption,
    fontSize:           11,
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
    color:   Colors.ink4,
    fontSize: 12,
  },

  // ── Qty pill ──────────────────────────────────────────────────────────────
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
  qtyPillBtnDisabled: {
    backgroundColor: Colors.surfaceSoft,
  },
  qtyBtn: {
    fontFamily: FontFamily.mono,
    fontSize:   16,
    color:      Colors.ink2,
    lineHeight: 20,
  },
  qtyBtnDisabled: {
    color: Colors.ink5,
  },
  qtyValue: {
    fontFamily:    FontFamily.mono,
    fontSize:      13,
    color:         Colors.ink1,
    minWidth:      28,
    textAlign:     'center',
    letterSpacing: 0.4,
  },

  // ── Savings banner ────────────────────────────────────────────────────────
  savingsBanner: {
    marginHorizontal:  Space.screenH,
    marginTop:         Space[3],
    paddingVertical:   Space[3],
    paddingHorizontal: Space[4],
    backgroundColor:   'rgba(34,107,60,0.07)',
    borderLeftWidth:   2,
    borderLeftColor:   '#226B3C',
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[2],
  },
  savingsBannerText: {
    fontFamily: FontFamily.sans,
    fontSize:   13,
    fontWeight: '500',
    color:      '#226B3C',
    flex:       1,
  },

  // ── Order summary — flat, no card ─────────────────────────────────────────
  summaryCard: {
    marginHorizontal: Space.screenH,
    marginTop:        Space[2],
    gap:              Space[3],
    paddingTop:       Space[4],
  },
  summaryCardLabel: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 2,
  },
  summaryRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'baseline',
  },
  summaryLabel: {
    ...Type.caption,
    color: Colors.ink3,
  },
  summaryValue: {
    ...Type.caption,
    color: Colors.ink2,
  },
  savingsLabel: {
    ...Type.caption,
    color: '#226B3C',
  },
  savingsValue: {
    ...Type.caption,
    color: '#226B3C',
  },
  summaryRule: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  summaryTotalRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'baseline',
  },
  summaryTotalLabel: {
    fontFamily:    FontFamily.serif,
    fontSize:      17,
    color:         Colors.ink1,
    letterSpacing: -0.2,
  },
  summaryTotalValue: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    color:         Colors.ink1,
    letterSpacing: -0.5,
  },
  summaryPayableBlock: {
    gap: 2,
  },
  summaryPayableLabel: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 1.6,
    fontSize:      9,
  },
  summaryPayableAmount: {
    fontFamily:    FontFamily.serif,
    fontSize:      28,
    color:         Colors.ink1,
    letterSpacing: -0.8,
    lineHeight:    32,
  },

  // ── Trust strip — plain icon row, no card ─────────────────────────────────
  trustRow: {
    flexDirection:     'row',
    justifyContent:    'center',
    gap:               Space[6],
    marginHorizontal:  Space.screenH,
    marginTop:         Space[4],
    paddingVertical:   Space[3],
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  trustText: {
    ...Type.caption,
    color:    Colors.ink3,
    fontSize: 11,
  },

  // ── Sticky checkout footer ────────────────────────────────────────────────
  summaryPanel: {
    backgroundColor:   WHITE,
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[4],
    paddingBottom:     Space[4],
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
  },
  summaryTopRule: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  checkoutBtn: {
    width:           '100%',
    height:          52,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.ink1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
  },
  checkoutBtnText: {
    ...Type.bodyStrong,
    color:         WHITE,
    letterSpacing: 0.3,
  },
  continueShoppingBtn: {
    alignItems:      'center',
    paddingVertical: Space[2],
  },
  continueShoppingText: {
    ...Type.caption,
    color: Colors.ink4,
  },
});

export default CartScreen;
