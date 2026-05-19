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
import { getSavedCartItems, quantityIncrement, quantityDecrement, postDeleteCartItem } from '../api/cart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useAsyncState } from '../hooks/useAsyncState';
import { useCart } from '../context/CartContext';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';

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

  const lineTotal   = item.Price * item.Quantity;
  const hasDiscount = item.ComparePrice > item.Price;

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
            {item.Brand_Name ? (
              <Text style={styles.cartBrand}>{item.Brand_Name}</Text>
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
            <Text style={styles.cartLineTotal}>${lineTotal.toFixed(2)}</Text>
            {hasDiscount && (
              <Text style={styles.cartUnitWas}>
                was ${item.ComparePrice.toFixed(2)} ea
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

  const { data: fetched, loading, isError, error, run } = useAsyncState<SavedCartItemInterface[]>([]);
  const [cartItems, setCartItems] = useState<SavedCartItemInterface[]>([]);

  useEffect(() => {
    if (fetched !== null) {
      setCartItems(fetched);
      const total = fetched.reduce((sum, item) => sum + item.Quantity, 0);
      setCartCount(total);
    }
  }, [fetched, setCartCount]);

  const fetchCart = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (!userData) return [];
        const user = JSON.parse(userData);
        const response = await getSavedCartItems(user.CustomerProfileCode);
        return response.result || [];
      }, cancelled),
    [run],
  );

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
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

    setCartItems(prev =>
      prev.map(ci =>
        ci.CartDetailsCode === item.CartDetailsCode ? { ...ci, Quantity: quantity } : ci,
      ),
    );
    setCartCount((prev: number) => prev + delta);

    try {
      if (delta > 0) {
        await quantityIncrement(item.CartDetailsCode, item.Inventory_Id);
      } else {
        await quantityDecrement(item.CartDetailsCode, item.Inventory_Id);
      }
    } catch {
      fetchCart();
    }
  }, [setCartCount, fetchCart]);

  const handleRemoveItem = useCallback(async (item: SavedCartItemInterface) => {
    setCartItems(prev => prev.filter(ci => ci.CartDetailsCode !== item.CartDetailsCode));
    setCartCount((prev: number) => Math.max(0, prev - item.Quantity));

    try {
      await postDeleteCartItem(item.CartDetailsCode);
    } catch {
      fetchCart();
    }
  }, [setCartCount, fetchCart]);

  const handleCheckout = useCallback(() => {
    navigation.navigate('Address', { cartItems });
  }, [navigation, cartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartCount(0);
  }, [setCartCount]);

  const renderBody = () => {
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

    if (cartItems.length === 0 && !loading) {
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
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryFree}>Free</Text>
          </View>

          <View style={styles.summaryTotalRule} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>${subtotal.toFixed(2)}</Text>
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
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearBtn}>Clear</Text>
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
    backgroundColor: Colors.ink1,
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

  // ── Fill wrappers (error / empty) ──────────────────────────────────────────
  fillWrap: {
    flex:            1,
    backgroundColor: Colors.surface,
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
