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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { SavedCartItemInterface } from '../api/interfaces';
import { EmptyState, Button, QuantityStepper } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius, Shadow, FontSize, FontWeight } from '../theme';
import { getSavedCartItems } from '../api/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useAsyncState } from '../hooks/useAsyncState';

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type CartScreenProps = {
  navigation: NavigationProp;
};

function useEntrance(delay = 0) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 480, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);
  return { opacity, transform: [{ translateY }] };
}

// ── Single cart row ───────────────────────────────────────────────────────────
const CartRow: React.FC<{
  item: SavedCartItemInterface;
  onUpdateQuantity: (item: SavedCartItemInterface, qty: number) => void;
  onRemove: (item: SavedCartItemInterface) => void;
  delay: number;
}> = ({ item, onUpdateQuantity, onRemove, delay }) => {
  const anim       = useEntrance(delay);
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const onLoad     = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [imgOpacity]);

  const lineTotal = item.Price * item.Quantity;
  const hasDiscount = item.ComparePrice > item.Price;

  return (
    <Animated.View style={[styles.cartRow, anim]}>
      {/* Product image */}
      <View style={styles.cartImgWrap}>
        <Animated.Image
          source={{ uri: item.Images?.split(';')[0] || '' }}
          style={[styles.cartImg, { opacity: imgOpacity }]}
          resizeMode="cover"
          onLoad={onLoad}
        />
      </View>

      {/* Content */}
      <View style={styles.cartContent}>
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
          {/* Remove */}
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => onRemove(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={15} color={Colors.ink4} />
          </TouchableOpacity>
        </View>

        <View style={styles.cartBottom}>
          <QuantityStepper
            value={item.Quantity}
            onChange={(next: number) => onUpdateQuantity(item, next)}
            min={1}
            size="sm"
          />
          <View style={styles.cartPriceBlock}>
            <Text style={styles.cartLineTotal}>${lineTotal.toFixed(2)}</Text>
            {hasDiscount && (
              <Text style={styles.cartUnitWas}>
                ${item.Price.toFixed(2)} ea
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

  // Fetch lifecycle — provides loading/error/data from the API call
  const { data: fetched, loading, isError, error, run } = useAsyncState<SavedCartItemInterface[]>([]);

  // Local mutable list seeded from fetched — optimistic quantity/remove mutations
  // write here without triggering a refetch on every interaction.
  const [cartItems, setCartItems] = useState<SavedCartItemInterface[]>([]);

  useEffect(() => {
    if (fetched !== null) setCartItems(fetched);
  }, [fetched]);

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

  const headerAnim = useEntrance(40);

  const subtotal  = cartItems.reduce((sum, item) => sum + item.Price * item.Quantity, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.Quantity, 0);

  // Summary entrance fires after items — delay scales with list length
  const summaryDelay = Math.min(140 + cartItems.length * 50, 480);
  const summaryAnim  = useEntrance(summaryDelay);

  const handleUpdateQuantity = (item: SavedCartItemInterface, quantity: number) => {
    setCartItems(prev =>
      prev.map(ci =>
        ci.CartDetailsCode === item.CartDetailsCode ? { ...ci, Quantity: quantity } : ci,
      ),
    );
  };

  const handleRemoveItem = (item: SavedCartItemInterface) => {
    setCartItems(prev => prev.filter(ci => ci.CartDetailsCode !== item.CartDetailsCode));
  };

  const handleCheckout = () => {
    navigation.navigate('Address', { cartItems });
  };

  const clearCart = () => setCartItems([]);

  const renderBody = () => {
    if (isError) {
      return (
        <View style={styles.errorWrap}>
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
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={<Icon name="bag-outline" size={36} color={Colors.ink4} />}
            title="Your bag is empty"
            body="Looks like you haven't added anything yet"
            action={
              <Button variant="primary" size="md" onPress={() => navigation.navigate('Home')}>
                Continue Shopping
              </Button>
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
          { paddingBottom: insets.bottom + Space[4] },
        ]}
      >
        {/* ── Cart rows ─────────────────────────────────────────────── */}
        <View style={styles.itemsSection}>
          {cartItems.map((item, index) => (
            <React.Fragment key={`${item.CartDetailsCode}-${index}`}>
              <CartRow
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
                delay={Math.min(120 + index * 55, 400)}
              />
              {index < cartItems.length - 1 && <View style={styles.itemDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Purchase summary — dark editorial block ────────────────── */}
        <Animated.View style={[styles.summaryCard, summaryAnim]}>
          {/* Subtotal row */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal
              <Text style={styles.summaryLabelMeta}>  ·  {itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
            </Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>

          {/* Delivery */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryFree}>Free</Text>
          </View>

          {/* Total — display-scale */}
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>${subtotal.toFixed(2)}</Text>
          </View>

          {/* Hairline above CTA */}
          <View style={styles.summaryRule} />

          {/* Checkout CTA */}
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleCheckout}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutBtnText}>Checkout</Text>
            <Icon name="arrow-forward" size={16} color="#0A0A0A" />
          </TouchableOpacity>

          <Text style={styles.summaryNote}>
            Address & payment details on the next step
          </Text>
        </Animated.View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" translucent />

      {/* ── Dark editorial header ─────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + Space[2] }, headerAnim]}
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

          {/* Clear-all — only shown when cart has items */}
          {cartItems.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={clearCart}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
          {cartItems.length === 0 && <View style={styles.headerRight} />}
        </View>
      </Animated.View>

      {/* Tonal bridge — dark → surfaceAlt */}
      <LinearGradient
        colors={['#0A0A0A', Colors.surfaceAlt]}
        style={styles.tonalBridge}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />

      {renderBody()}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#0A0A0A',
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[4],
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: Space[3],
    gap: 1,
  },
  headerEyebrow: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 1.8,
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  headerRight: {
    width: 36,
  },
  clearBtn: {
    paddingHorizontal: Space[2],
    paddingVertical: Space[1],
  },
  clearBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: 'rgba(255,255,255,0.35)',
  },

  // Tonal bridge
  tonalBridge: {
    height: 48,
    marginTop: -1,
    zIndex: 1,
  },

  // ── Empty state ──────────────────────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    marginTop: -1,
  },

  // ── Error state ──────────────────────────────────────────────────────────
  errorWrap: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    marginTop: -1,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    marginTop: -1,
  },
  scrollContent: {
    paddingTop: Space[3],
    paddingHorizontal: Space.screenH,
    gap: Space[5],
  },

  // ── Items section ────────────────────────────────────────────────────────
  itemsSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Space[2],
    paddingHorizontal: Space[4],
    ...Shadow.md,
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.line,
    marginVertical: Space[2],
  },

  // ── Cart row ─────────────────────────────────────────────────────────────
  cartRow: {
    flexDirection: 'row',
    gap: Space[3],
    paddingVertical: Space[3],
  },
  cartImgWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
  },
  cartImg: {
    width: '100%',
    height: '100%',
  },
  cartContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cartTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space[2],
  },
  cartMeta: {
    flex: 1,
    gap: 2,
  },
  cartBrand: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.ink4,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  cartName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.ink1,
    letterSpacing: -0.1,
    lineHeight: FontSize.sm * 1.35,
  },
  cartVariant: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink4,
    letterSpacing: 0.2,
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Space[2],
  },
  cartPriceBlock: {
    alignItems: 'flex-end',
    gap: 1,
  },
  cartLineTotal: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.ink1,
    letterSpacing: -0.3,
  },
  cartUnitWas: {
    fontSize: FontSize.xs,
    color: Colors.ink4,
  },

  // ── Summary card — dark editorial block ──────────────────────────────────
  summaryCard: {
    backgroundColor: '#0E0E0E',
    borderRadius: Radius.lg,
    padding: Space[5],
    gap: Space[3],
    ...Shadow.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: 'rgba(255,255,255,0.45)',
  },
  summaryLabelMeta: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.28)',
  },
  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.7)',
  },
  summaryFree: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.1,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Space[4],
  },
  summaryTotalLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.6)',
  },
  summaryTotalValue: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  summaryRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: Space[1],
  },
  checkoutBtn: {
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Space[2],
  },
  checkoutBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#0A0A0A',
    letterSpacing: 0.1,
  },
  summaryNote: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.30)',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});

export default CartScreen;
