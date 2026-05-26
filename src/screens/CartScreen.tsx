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
import { EmptyState } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius, Shadow } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { getSavedCartItems, postDeleteCartItem, updateCartItemQuantity } from '../api/cart';
import { useProfileCode } from '../hooks/useProfileCode';
import { useAsyncState } from '../hooks/useAsyncState';
import { useCart } from '../context/CartContext';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { useAppToast } from '../hooks/useAppToast';

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type CartScreenProps = {
  navigation: NavigationProp;
};

// ── Cart row ──────────────────────────────────────────────────────────────────
const CartRow: React.FC<{
  item: SavedCartItemInterface;
  onUpdateQuantity: (item: SavedCartItemInterface, qty: number) => void;
  onRemove: (item: SavedCartItemInterface) => void;
  delay: number;
}> = ({ item, onUpdateQuantity, onRemove, delay }) => {
  const anim       = useEntrance(delay, false, 10);
  const haptic     = useHaptic();
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
                was Rs {comparePrice.toFixed(0)} ea
              </Text>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { setCartCount } = useCart();
  const checkoutTactile = useTactile();
  const toast = useAppToast();

  const { data: fetched, loading, isError, error, run } = useAsyncState<SavedCartItemInterface[]>([]);
  const [optimistic, setOptimistic] = useState<SavedCartItemInterface[] | null>(null);
  const [clearing, setClearing] = useState(false);
  const hasFetched = useRef(false);
  const profileCode = useProfileCode();

  const cartItems = optimistic ?? fetched ?? [];

  const fetchCart = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        if (!profileCode) return [];
        const response = await getSavedCartItems(profileCode);
        return response.result || [];
      }, cancelled),
    [run, profileCode],
  );

  // Sync cart badge whenever server data arrives
  useEffect(() => {
    if (fetched !== null) {
      hasFetched.current = true;
      setOptimistic(null);
      const total = fetched.reduce((sum, item) => sum + item.Quantity, 0);
      setCartCount(total);
    }
  }, [fetched, setCartCount]);

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      hasFetched.current = false;
      setOptimistic(null);
      fetchCart(cancelled);
      return () => { cancelled.current = true; };
    }, [fetchCart]),
  );

  const headerAnim  = useEntrance(40, false, 12);
  const summaryDelay = Math.min(140 + cartItems.length * 50, 480);
  const summaryAnim  = useEntrance(summaryDelay, false, 10);

  const subtotal  = cartItems.reduce((sum, item) => sum + item.Price * item.Quantity, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.Quantity, 0);

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

  const handleCheckout = useCallback(() => {
    navigation.navigate('Address', { cartItems });
  }, [navigation, cartItems]);

  const clearCart = useCallback(async () => {
    setClearing(true);
    try {
      for (const item of cartItems) {
        await postDeleteCartItem(item.CartDetailsCode);
      }
      setOptimistic([]);
      setCartCount(0);
    } catch {
      toast.error({ title: 'Error', description: 'Failed to clear cart. Please try again.' });
      fetchCart();
    } finally {
      setClearing(false);
    }
  }, [cartItems, setCartCount, fetchCart]);

  const renderBody = () => {
    if (!hasFetched.current && !isError) {
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
            title="Couldn't load your bag"
            message={error ?? 'An unexpected error occurred.'}
            onRetry={() => fetchCart()}
            retryLoading={loading}
            icon={<Icon name="bag-outline" size={32} color={Colors.ink3} />}
          />
        </View>
      );
    }

    if (cartItems.length === 0 && !loading && hasFetched.current) {
      return (
        <View style={styles.fillWrap}>
          <EmptyState
            icon={<Icon name="bag-outline" size={32} color={Colors.ink4} />}
            title="Nothing saved yet."
            body="Add something you love and it'll appear here."
            action={
              <TouchableOpacity
                onPress={() => navigation.navigate('Home')}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyLink}>Continue Shopping</Text>
              </TouchableOpacity>
            }
          />
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Space[6] },
        ]}
      >
        {/* ── Items — hairline-separated, no card ───────────────────── */}
        <View style={styles.itemsSection}>
          {cartItems.map((item, index) => (
            <React.Fragment key={`${item.CartDetailsCode}-${index}`}>
              {index > 0 && <View style={styles.itemDivider} />}
              <CartRow
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
                delay={Math.min(80 + index * 55, 360)}
              />
            </React.Fragment>
          ))}
        </View>

        {/* ── Summary panel — surfaceDeep, flush ────────────────────── */}
        <Animated.View style={[styles.summaryPanel, summaryAnim]}>
          <View style={styles.summaryRule} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal
              {'  '}
              <Text style={styles.summaryLabelMeta}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            </Text>
            <Text style={styles.summaryValue}>Rs {subtotal.toFixed(0)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryFree}>Free</Text>
          </View>

          <View style={styles.summaryTotalRule} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>Rs {subtotal.toFixed(0)}</Text>
          </View>

          {/* Checkout CTA */}
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

          <Text style={styles.summaryNote}>
            Address & payment on the next step
          </Text>
        </Animated.View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />

      {/* ── Dark editorial header ─────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + Space[3] }, headerAnim]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>YOUR BAG</Text>
            <Text style={styles.headerTitle}>
              {cartItems.length === 0
                ? 'Empty'
                : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
            </Text>
          </View>

          {cartItems.length > 0 ? (
            <TouchableOpacity
              onPress={clearCart}
              disabled={clearing}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearBtn}>{clearing ? '...' : 'Clear'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
      </Animated.View>

      {renderBody()}
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
    backgroundColor:   Colors.ink1,
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  backBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  headerCenter: {
    flex:              1,
    paddingHorizontal: Space[3],
    gap:               2,
  },
  headerEyebrow: {
    ...Type.label,
    color:         'rgba(255,255,255,0.35)',
    letterSpacing: 1.8,
  },
  headerTitle: {
    ...Type.title,
    color:     '#FFFFFF',
    fontSize:  26,
    lineHeight: 26 * 1.1,
  },
  headerSpacer: {
    width: 36,
  },
  clearBtn: {
    ...Type.caption,
    color:         'rgba(255,255,255,0.38)',
    letterSpacing: 0.2,
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

  // Empty state text link (subordinate to EmptyState component)
  emptyLink: {
    ...Type.caption,
    color:              Colors.ink2,
    textDecorationLine: 'underline',
    letterSpacing:      0.2,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingTop: Space[4],
    gap:        Space[5],
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

  // ── Summary panel — surfaceDeep, flush ────────────────────────────────────
  summaryPanel: {
    backgroundColor:   Colors.surfaceDeep,
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[4],
    paddingBottom:     Space[4],
    gap:               Space[3],
    ...Shadow.sm,
  },
  summaryRule: {
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
  summaryLabelMeta: {
    ...Type.caption,
    color:    Colors.ink4,
    fontSize: 12,
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
    ...Type.label,
    color:         Colors.ink2,
    letterSpacing: 1.4,
  },
  summaryTotalValue: {
    ...Type.priceLarge,
    color: Colors.ink1,
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
  summaryNote: {
    ...Type.caption,
    color:     Colors.ink4,
    textAlign: 'center',
    fontSize:  12,
  },
});

export default CartScreen;
