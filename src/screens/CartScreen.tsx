import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Animated,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useAsyncState } from '../hooks/useAsyncState';
import { useCart } from '../context/CartContext';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { useAppToast } from '../hooks/useAppToast';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { LoginPromptSheet } from '../components/ui/LoginPromptSheet';

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type CartScreenProps = {
  navigation: NavigationProp;
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
      {/* 4:5 product image — surfaceDeep bg so transparent images don't dissolve */}
      <View style={styles.cartImgWrap}>
        <Animated.Image
          source={{ uri: item.Images?.split(';')[0] || '' }}
          style={[styles.cartImg, { opacity: imgOpacity }]}
          resizeMode="cover"
          onLoad={onLoad}
        />
      </View>

      {/* Content column */}
      <View style={styles.cartContent}>
        {/* Top: meta + dismiss */}
        <View style={styles.cartTop}>
          <View style={styles.cartMeta}>
            {item.BrandName ? (
              <Text style={styles.cartBrand}>{item.BrandName}</Text>
            ) : null}
            <Text style={styles.cartName} numberOfLines={2}>{item.Name}</Text>
            {item.Variant ? (
              <Text style={styles.cartVariant}>{item.Variant}</Text>
            ) : null}
          </View>
          {/* Quiet dismiss — no circle background, just a glyph */}
          <TouchableOpacity
            onPress={handleRemove}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Remove item"
            accessibilityRole="button"
          >
            <Text style={styles.removeGlyph}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom: inline stepper + line price */}
        <View style={styles.cartBottom}>
          {/* Minimal inline qty control — no pill border, just −  N  + */}
          <View style={styles.qtyControl}>
            <TouchableOpacity
              onPress={handleDecrement}
              disabled={item.Quantity <= 1}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Decrease quantity"
              accessibilityRole="button"
            >
              <Text style={[
                styles.qtyBtn,
                item.Quantity <= 1 && styles.qtyBtnDisabled,
              ]}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.Quantity}</Text>
            <TouchableOpacity
              onPress={handleIncrement}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Increase quantity"
              accessibilityRole="button"
            >
              <Text style={styles.qtyBtn}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Price block — line total primary, unit "was" subordinate */}
          <View style={styles.cartPriceBlock}>
            <Text style={styles.cartLineTotal}>Rs {lineTotal.toFixed(0)}</Text>
            {hasDiscount && (
              <Text style={styles.cartUnitWas}>
                Rs {comparePrice.toFixed(0)}
              </Text>
            )}
          </View>
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
  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: Motion.duration.settle, easing: Motion.easing.out, useNativeDriver: true }).start();
  }, [imgOpacity]);

  const hasDiscount = item.comparePrice > item.price;

  return (
    <Animated.View style={[styles.cartRow, anim]}>
      <View style={styles.cartImgWrap}>
        <Animated.Image
          source={{ uri: item.image }}
          style={[styles.cartImg, { opacity: imgOpacity }]}
          resizeMode="cover"
          onLoad={onLoad}
        />
      </View>
      <View style={styles.cartContent}>
        <View style={styles.cartTop}>
          <View style={styles.cartMeta}>
            {item.brandName ? <Text style={styles.cartBrand}>{item.brandName}</Text> : null}
            <Text style={styles.cartName} numberOfLines={2}>{item.name}</Text>
            {item.variant ? <Text style={styles.cartVariant}>{item.variant}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => { haptic.light(); onRemove(); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.removeGlyph}>×</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cartBottom}>
          <View style={styles.qtyControl}>
            <TouchableOpacity onPress={() => { haptic.light(); if (item.quantity > 1) onUpdateQuantity(item.quantity - 1); }} disabled={item.quantity <= 1} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => { haptic.light(); onUpdateQuantity(item.quantity + 1); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.qtyBtn}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cartPriceBlock}>
            <Text style={styles.cartLineTotal}>Rs {(item.price * item.quantity).toFixed(0)}</Text>
            {hasDiscount && <Text style={styles.cartUnitWas}>Rs {item.comparePrice.toFixed(0)}</Text>}
          </View>
        </View>
      </View>
    </Animated.View>
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
  const [hasFetched, setHasFetched] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const cartItems = optimistic ?? fetched ?? [];

  const fetchCart = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const loggedIn = await isLoggedIn();
        if (!loggedIn) {
          setIsGuest(true);
          const items = await getGuestCart();
          setGuestItems(items);
          setHasFetched(true);
          setCartCount(items.reduce((s, i) => s + i.quantity, 0));
          return [];
        }
        setIsGuest(false);
        // Read fresh from storage — avoids race condition and stale data after account switch
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
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

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      setHasFetched(false);
      setOptimistic(null);
      fetchCart(cancelled);
      return () => { cancelled.current = true; };
    }, [fetchCart]),
  );

  const headerOpacity    = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(12)).current;
  const summaryOpacity    = useRef(new Animated.Value(0)).current;
  const summaryTranslateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity,    { toValue: 1, duration: Motion.duration.settle, delay: 20, useNativeDriver: true }),
      Animated.timing(headerTranslateY, { toValue: 0, duration: Motion.duration.settle, delay: 20, useNativeDriver: true }),
    ]).start();
  }, [headerOpacity, headerTranslateY]);
  useEffect(() => {
    if (!hasFetched) return;
    Animated.parallel([
      Animated.timing(summaryOpacity,    { toValue: 1, duration: Motion.duration.settle, delay: 40, useNativeDriver: true }),
      Animated.timing(summaryTranslateY, { toValue: 0, duration: Motion.duration.settle, delay: 40, useNativeDriver: true }),
    ]).start();
  }, [hasFetched, summaryOpacity, summaryTranslateY]);
  const headerAnim  = { opacity: headerOpacity,  transform: [{ translateY: headerTranslateY }] };
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
        for (const item of cartItems) {
          await postDeleteCartItem(item.CartDetailsCode);
        }
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
        <View style={[styles.fillWrap, { paddingHorizontal: Space.screenH, paddingTop: Space[4] }]}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.skeletonRow}>
              <View style={styles.skeletonImg} />
              <View style={styles.skeletonContent}>
                <View style={[styles.skeletonLine, { width: '40%' }]} />
                <View style={[styles.skeletonLine, { width: '70%', marginTop: Space[2] }]} />
                <View style={[styles.skeletonLine, { width: '55%', marginTop: Space[1] }]} />
                <View style={[styles.skeletonLine, { width: '30%', marginTop: Space[4] }]} />
              </View>
            </View>
          ))}
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

    if (isGuest && guestItems.length === 0 && hasFetched) {
      return (
        <View style={styles.fillWrap}>
          <View style={styles.emptyContent}>
            <View style={styles.emptyIllustration}>
              <Icon name="bag-outline" size={52} color={Colors.ink3} />
            </View>
            <Text style={styles.emptyTitle}>Your bag is empty.</Text>
            <Text style={styles.emptyBody}>Add something you love to get started.</Text>
          </View>
          <View style={styles.emptyFooter}>
            <TouchableOpacity
              style={styles.emptyCTA}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.emptyCTAText}>Browse the collection</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (cartItems.length === 0 && !loading && hasFetched && !isGuest) {
      return (
        <View style={styles.fillWrap}>
          <View style={styles.emptyContent}>
            <View style={styles.emptyIllustration}>
              <Icon name="bag-outline" size={52} color={Colors.ink3} />
            </View>
            <Text style={styles.emptyTitle}>Your bag is empty.</Text>
            <Text style={styles.emptyBody}>Add something you love to get started.</Text>
          </View>
          <View style={styles.emptyFooter}>
            <TouchableOpacity
              style={styles.emptyCTA}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.emptyCTAText}>Browse the collection</Text>
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
        >
          <View style={styles.itemsSection}>
            {isGuest
              ? guestItems.map((item, index) => (
                  <React.Fragment key={`guest-${item.inventoryId}`}>
                    {index > 0 && <View style={styles.itemDivider} />}
                    <GuestCartRow
                      item={item}
                      onUpdateQuantity={(newQty: number) => handleUpdateGuestQuantity(item.inventoryId, item.quantity, newQty)}
                      onRemove={() => handleRemoveGuestItem(item.inventoryId, item.quantity)}
                      delay={Math.min(80 + index * 55, 360)}
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
                      delay={Math.min(80 + index * 55, 360)}
                    />
                  </React.Fragment>
                ))
            }
          </View>
        </ScrollView>

        {/* ── Summary panel — flush, same surface ──────────────────────── */}
        <Animated.View style={[styles.summaryPanel, summaryAnim, { paddingBottom: insets.bottom + Space[4] }]}>
          <View style={styles.summaryTopRule} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rs {subtotal.toFixed(0)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryFree}>Free</Text>
          </View>

          {totalSavings > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.savingsLabel}>You save</Text>
              <Text style={styles.savingsValue}>− Rs {totalSavings.toFixed(0)}</Text>
            </View>
          )}

          <View style={styles.summaryTotalRule} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>Rs {subtotal.toFixed(0)}</Text>
          </View>

          <Animated.View style={checkoutTactile.animatedStyle}>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
              {...checkoutTactile.handlers}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel="Proceed to checkout"
            >
              <Text style={styles.checkoutBtnText}>Checkout</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Light inline header ───────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + Space[3] }, headerAnim]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back" size={22} color={Colors.ink1} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Bag</Text>
            {hasFetched && itemCount > 0 ? (
              <Text style={styles.headerCount}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
            ) : null}
          </View>

          {(isGuest ? guestItems.length : cartItems.length) > 0 ? (
            <TouchableOpacity
              onPress={clearCart}
              disabled={clearing}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearBtn}>{clearing ? '…' : 'Clear'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
      </Animated.View>
      <View style={styles.headerDivider} />

      {renderBody()}

      {showLoginPrompt && (
        <LoginPromptSheet
          onClose={dismissLoginPrompt}
          onSignIn={() => { dismissLoginPrompt(); navigation.navigate('Login'); }}
          onRegister={() => { dismissLoginPrompt(); navigation.navigate('Register'); }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor:   Colors.surface,
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
    gap:               2,
  },
  headerTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.3,
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
    color: Colors.ink3,
  },

  // ── Fill wrappers (error / empty / skeleton) ──────────────────────────────
  fillWrap: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  skeletonRow: {
    flexDirection:   'row',
    gap:             Space[3],
    paddingVertical: Space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  skeletonImg: {
    width:           80,
    height:          100,
    borderRadius:    Radius.md,
    backgroundColor: Colors.surfaceDeep,
  },
  skeletonContent: {
    flex: 1,
    paddingTop: Space[1],
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
  emptyIllustration: {
    width:           120,
    height:          120,
    borderRadius:    60,
    backgroundColor: Colors.surfaceSoft,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Space[2],
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
  },
  emptyCTA: {
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    paddingVertical: Space[4],
    alignItems:      'center',
  },
  emptyCTAText: {
    ...Type.bodyStrong,
    color: '#FFFFFF',
  },

  // ── Body layout — items scroll, summary sticky ────────────────────────────
  bodyWrap: {
    flex: 1,
  },
  scroll: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingTop:    Space[4],
    paddingBottom: Space[4],
  },

  // ── Items section — hairline dividers, no card ────────────────────────────
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
    gap:             Space[3],
    paddingVertical: Space[4],
  },
  // 4:5 portrait image — editorial, more surface for the product
  cartImgWrap: {
    width:            80,
    height:           100,
    borderRadius:     Radius.md,
    overflow:         'hidden',
    backgroundColor:  Colors.surfaceDeep,
  },
  cartImg: {
    width:  '100%',
    height: '100%',
  },
  cartContent: {
    flex:            1,
    justifyContent:  'space-between',
  },
  cartTop: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Space[2],
  },
  cartMeta: {
    flex: 1,
    gap:  3,
  },
  cartBrand: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 1.0,
  },
  cartName: {
    fontFamily:    FontFamily.serif,
    fontSize:      14,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.2,
    lineHeight:    14 * 1.35,
  },
  cartVariant: {
    ...Type.caption,
    color:     Colors.ink4,
    fontSize:  12,
    lineHeight: 12 * 1.3,
  },
  // Quiet ×  dismiss — no background circle
  removeGlyph: {
    fontSize:   18,
    lineHeight: 20,
    color:      Colors.ink4,
    fontWeight: '300',
  },

  // Minimal inline qty control — dash / number / plus, no pill border
  qtyControl: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[3],
  },
  qtyBtn: {
    fontFamily:  FontFamily.mono,
    fontSize:    16,
    color:       Colors.ink2,
    lineHeight:  20,
  },
  qtyBtnDisabled: {
    color: Colors.ink5,
  },
  qtyValue: {
    fontFamily:    FontFamily.mono,
    fontSize:      14,
    color:         Colors.ink1,
    minWidth:      18,
    textAlign:     'center',
    letterSpacing: 0.4,
  },

  cartBottom: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  cartPriceBlock: {
    alignItems: 'flex-end',
    gap:        2,
  },
  cartLineTotal: {
    fontFamily:    FontFamily.serif,
    fontSize:      16,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  cartUnitWas: {
    ...Type.caption,
    fontSize:           11,
    color:              Colors.ink4,
    textDecorationLine: 'line-through',
  },

  // ── Summary panel — same surface, no background shift ────────────────────
  summaryPanel: {
    backgroundColor:   Colors.surface,
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[4],
    paddingBottom:     Space[4],
    gap:               Space[3],
  },
  summaryTopRule: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginBottom:    Space[1],
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
  savingsLabel: {
    ...Type.caption,
    color: Colors.ink2,
  },
  savingsValue: {
    ...Type.caption,
    color: Colors.ink2,
  },
  summaryValue: {
    ...Type.caption,
    color: Colors.ink2,
  },
  summaryFree: {
    ...Type.caption,
    color: Colors.ink3,
  },
  summaryTotalRule: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical:  Space[1],
  },
  summaryTotalRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'baseline',
    marginBottom:   Space[1],
  },
  summaryTotalLabel: {
    fontFamily:    FontFamily.serif,
    fontSize:      17,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.2,
  },
  summaryTotalValue: {
    fontFamily:    FontFamily.serif,
    fontSize:      24,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.5,
  },

  // Primary checkout CTA — ink1 pill, full-width
  checkoutBtn: {
    width:           '100%',
    height:          52,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.ink1,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       Space[2],
  },
  checkoutBtnText: {
    ...Type.bodyStrong,
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default CartScreen;
