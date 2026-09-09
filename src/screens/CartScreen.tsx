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
import { SavedCartItemInterface, SavedCartSummaryInterface } from '../api/interfaces';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { getSavedCartItems, postDeleteCartItem, updateCartItemQuantity, getGuestCart, updateGuestCartItem, removeFromGuestCart, clearGuestCart } from '../api/cart';
import type { GuestCartItem } from '../api/cart';
import { addToWishlist } from '../api/wishlist';
import { isLoggedIn } from '../utils/auth';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { mapCartTaxBreakdown } from '../utils/pricing';
import { hasBackorderCapacity } from '../utils/stock';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useAsyncState } from '../hooks/useAsyncState';
import { useCart } from '../context/CartContext';
import { useTactile } from '../hooks/useTactile';
import { useAppToast } from '../hooks/useAppToast';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useWishlist } from '../context/WishlistContext';
import { LoginPromptSheet } from '../components/ui/LoginPromptSheet';
import { ConfirmSheet, RemoveCartItemSheet } from '../components/ui';
import { CartRow, GuestCartRow, GuestCartRowWrapper } from '../components/ui/CartRow';

type CartScreenProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

// ── Main screen ───────────────────────────────────────────────────────────────
const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { setCartCount } = useCart();
  const checkoutTactile = useTactile();
  const toast = useAppToast();
  const { guard, showLoginPrompt, dismissLoginPrompt } = useAuthGuard();
  const { setWishlistCode } = useWishlist();

  const { data: fetched, loading, isError, error, run } = useAsyncState<SavedCartItemInterface[]>([]);
  const [summary, setSummary] = useState<SavedCartSummaryInterface | null>(null);
  const [optimistic, setOptimistic] = useState<SavedCartItemInterface[] | null>(null);
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<
    | { kind: 'saved'; item: SavedCartItemInterface }
    | { kind: 'guest'; inventoryId: number; qty: number; name: string; image: string }
    | null
  >(null);
  const [moveLoading, setMoveLoading] = useState(false);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

  const cartItems = optimistic ?? fetched ?? [];

  const fetchCart = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        // Read in parallel — independent I/O, no need to wait on one before the other
        const [loggedIn, raw] = await Promise.all([
          isLoggedIn(),
          AsyncStorage.getItem(STORAGE_KEYS.userData),
        ]);
        const code = raw ? JSON.parse(raw).CustomerProfileCode : null;
        // Keychain tokens outlive reinstall/dev-reload, so isLoggedIn() can
        // report true with no userData ever having been written this
        // install — that's not a real session, just an orphaned token.
        // Treat it the same as logged-out rather than dead-ending on an
        // empty cart for someone who's never had an account here.
        if (!loggedIn || !code) {
          setIsGuest(true);
          setSummary(null);
          const items = await getGuestCart();
          setGuestItems(items);
          setHasFetched(true);
          setCartCount(items.reduce((s, i) => s + i.quantity, 0));
          return [];
        }
        setIsGuest(false);
        const response = await getSavedCartItems(code);
        setSummary(response.result ?? null);
        return response.result?.Items || [];
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

  // Out-of-stock lines stay visible in the list (not silently dropped) but
  // are excluded from totals/checkout — Count is live stock as of the last
  // fetch, so an item added while available can go to 0 by the time the cart
  // is reopened. A backorderable item at Count 0 is still purchasable.
  const purchasableCartItems = cartItems.filter(item => item.Count > 0 || hasBackorderCapacity(item.BackOrder));
  const unavailableCount = cartItems.length - purchasableCartItems.length;

  // Tax breakdown, subtotal, and the final payable amount are all
  // backend-authoritative (summary.TaxBreakdown/SubTotal/AmountToBePaid) so
  // they can never drift from what the server will actually charge. Do not
  // use summary.ItemsTotal for subtotal — it's actually Σ(ComparePrice × Qty),
  // the pre-discount MRP total, despite the name.
  const subtotal = isGuest
    ? guestItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    : summary?.SubTotal ?? 0;
  const taxGroups = isGuest || !summary ? [] : mapCartTaxBreakdown(summary.TaxBreakdown);
  const shippingCharge = isGuest ? 0 : summary?.TotalShippingCharge ?? 0;
  const payableTotal = isGuest
    ? subtotal
    : summary?.AmountToBePaid ?? 0;
  const itemCount = isGuest
    ? guestItems.reduce((sum, i) => sum + i.quantity, 0)
    : purchasableCartItems.reduce((sum, item) => sum + item.Quantity, 0);
  // Backend-computed directly (summary.TotalSaved) for logged-in carts — no
  // client-side MRP-vs-subtotal derivation needed. Guest carts have no
  // backend summary, so they keep the client-derived MRP-based savings.
  const totalSavings = isGuest
    ? guestItems.reduce((sum, i) => sum + Math.max(0, i.comparePrice - i.price) * i.quantity, 0)
    : summary?.TotalSaved ?? 0;
  // Total tax as sum of TaxBreakdown — this whole section only ever renders
  // for logged-in carts (see `summary &&` gate below), so no isGuest branch.
  const totalTax = summary?.TaxBreakdown.reduce((sum, tax) => sum + tax.TaxAmount, 0) ?? 0;

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
      const res = await updateCartItemQuantity(item.CartDetailsCode, item.InventoryId, quantity);
      if (res?.statusCode !== 1) {
        toast.error({ title: 'Error', description: res?.userMessage ?? "Couldn't update quantity." });
      }
    } catch {
      // fall through — fetchCart() below re-syncs regardless of outcome
    }
    // Re-sync with the server-authoritative cart (totals/tax may shift, not
    // just this line item's quantity) instead of trusting the optimistic
    // patch indefinitely.
    fetchCart();
  }, [setCartCount, fetchCart, fetched, toast]);

  const handleUpdateGuestQuantity = useCallback(async (inventoryId: number, oldQty: number, newQty: number) => {
    const delta = newQty - oldQty;
    if (delta === 0) return;
    const updated = await updateGuestCartItem(inventoryId, newQty);
    setGuestItems(updated);
    setCartCount((prev: number) => prev + delta);
  }, [setCartCount]);

  const removeSavedItem = useCallback(async (item: SavedCartItemInterface) => {
    setOptimistic(prev =>
      (prev ?? fetched ?? []).filter(ci => ci.CartDetailsCode !== item.CartDetailsCode),
    );
    setCartCount((prev: number) => Math.max(0, prev - item.Quantity));
    try {
      const res = await postDeleteCartItem(item.CartDetailsCode);
      if (res?.statusCode !== 1) {
        toast.error({ title: 'Error', description: res?.userMessage ?? "Couldn't remove item." });
      }
    } catch {
      // fall through — fetchCart() below re-syncs regardless of outcome
    }
    // Re-sync with the server-authoritative cart, same reasoning as
    // handleUpdateQuantity above.
    fetchCart();
  }, [setCartCount, fetchCart, fetched, toast]);

  const removeGuestItem = useCallback(async (inventoryId: number, qty: number) => {
    const updated = await removeFromGuestCart(inventoryId);
    setGuestItems(updated);
    setCartCount((prev: number) => Math.max(0, prev - qty));
  }, [setCartCount]);

  // Both entry points (Remove link, and − at qty 1) route through the
  // confirmation sheet rather than removing immediately.
  const handleRemoveItem = useCallback((item: SavedCartItemInterface) => {
    setRemoveTarget({ kind: 'saved', item });
  }, []);

  const handleRemoveGuestItem = useCallback((inventoryId: number, qty: number) => {
    const guestItem = guestItems.find(g => g.inventoryId === inventoryId);
    setRemoveTarget({
      kind:  'guest',
      inventoryId,
      qty,
      name:  guestItem?.name ?? '',
      image: guestItem?.image ?? '',
    });
  }, [guestItems]);

  const dismissRemoveSheet = useCallback(() => setRemoveTarget(null), []);

  const confirmRemove = useCallback(() => {
    if (!removeTarget) return;
    if (removeTarget.kind === 'saved') removeSavedItem(removeTarget.item);
    else removeGuestItem(removeTarget.inventoryId, removeTarget.qty);
    setRemoveTarget(null);
  }, [removeTarget, removeSavedItem, removeGuestItem]);

  const confirmMoveToWishlist = useCallback(async () => {
    if (!removeTarget || removeTarget.kind !== 'saved') return;
    const { item } = removeTarget;
    setMoveLoading(true);
    try {
      const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      const profileCode: number | null = userRaw ? (JSON.parse(userRaw).CustomerProfileCode ?? null) : null;
      if (!profileCode) { setMoveLoading(false); return; }

      const res = await addToWishlist(profileCode, item.InventoryId);
      if (res?.statusCode === 1) {
        setWishlistCode(item.InventoryId, -1);
        await removeSavedItem(item);
        toast.success({ title: 'Moved to Wishlist', description: item.Name });
      } else {
        toast.error({ title: 'Error', description: res?.userMessage ?? "Couldn't move item to wishlist." });
      }
    } catch {
      toast.error({ title: 'Error', description: "Couldn't move item to wishlist." });
    } finally {
      setMoveLoading(false);
      setRemoveTarget(null);
    }
  }, [removeTarget, removeSavedItem, setWishlistCode, toast]);

  const handleCheckout = useCallback(() => {
    guard(() => navigation.navigate('Checkout'));
  }, [guard, navigation]);

  // Guest carts aren't re-validated against live stock (their stock field is
  // only a snapshot from add-time), so only the logged-in cart's OOS lines
  // can gate checkout here.
  const isCheckoutDisabled = !isGuest && purchasableCartItems.length === 0 && cartItems.length > 0;

  const clearCart = useCallback(async () => {
    setClearing(true);
    try {
      if (isGuest) {
        await clearGuestCart();
        setGuestItems([]);
        setCartCount(0);
      } else {
        const results = await Promise.allSettled(
          cartItems.map(item => postDeleteCartItem(item.CartDetailsCode)),
        );
        const failed = results.filter(
          result => result.status === 'rejected' || result.value?.statusCode !== 1,
        ).length;
        if (failed > 0) {
          // Some deletes succeeded so re-fetch the true server state rather
          // than guessing which items remain.
          fetchCart();
          toast.error({ title: 'Error', description: `${failed} item${failed > 1 ? 's' : ''} couldn't be removed. Please try again.` });
        } else {
          setOptimistic([]);
          setCartCount(0);
        }
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
            title="Couldn't load your cart."
            message={error ?? 'Tap retry to try again.'}
            onRetry={() => fetchCart()}
            retryLoading={loading}
            icon={<Icon name="cart-outline" size={32} color={Colors.ink3} />}
          />
        </View>
      );
    }

    if ((isGuest && guestItems.length === 0 && hasFetched) ||
        (cartItems.length === 0 && !loading && hasFetched && !isGuest)) {
      return (
        <View style={styles.fillWrap}>
          <View style={styles.emptyContent}>
            <Icon name="cart-outline" size={36} color={Colors.ink4} />
            <View style={styles.emptyText}>
              <Text style={styles.emptyTitle}>Your cart is empty.</Text>
              <Text style={styles.emptyBody}>Add items you love and they'll appear here.</Text>
            </View>
          </View>
          <View style={styles.emptyFooter}>
            <TouchableOpacity
              style={styles.emptyCTA}
              activeOpacity={0.88}
              onPress={() => (navigation.navigate as (screen: string, params?: Record<string, unknown>) => void)('MainTabs', { screen: 'Home' })}
              accessibilityRole="button"
              accessibilityLabel="Start shopping"
            >
              <Text style={styles.emptyCTAText}>Start Shopping</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emptySecondary}
              activeOpacity={0.7}
              onPress={() => (navigation.navigate as (screen: string, params?: Record<string, unknown>) => void)('MainTabs', { screen: 'Wishlist' })}
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
          {/* ── Cart items ──────────────────────────────────────────────── */}
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
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('Product', { product: String(item.ItemId) })}
                    >
                      <CartRow
                        item={item}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                        delay={Motion.stagger.delay(index)}
                      />
                    </TouchableOpacity>
                  </React.Fragment>
                ))
            }
          </View>

          {/* ── Savings banner — only when savings are real ────────────── */}
          {totalSavings > 0 && (
            <View style={styles.savingsBanner}>
              <Icon name="gift-outline" size={16} color="#226B3C" />
              <Text style={styles.savingsBannerText}>
                You're saving Rs {totalSavings.toLocaleString('en-IN')} on this order
              </Text>
            </View>
          )}

          {/* ── Price Details section (guest) ───────────────────────────── */}
          {/* Guests have no backend summary/TaxBreakdown, so tax can't be
              computed client-side — point them to log in instead of showing
              a misleading Rs 0 or omitting the row entirely. */}
          {hasFetched && itemCount > 0 && isGuest && (
            <View style={styles.priceDetailsSection}>
              <Text style={styles.priceDetailsLabel}>PRICE DETAILS</Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>MRP</Text>
                <Text style={[styles.priceRowValue, totalSavings > 0 && styles.mrpValueStruck]}>
                  Rs {(subtotal + totalSavings).toLocaleString('en-IN')}
                </Text>
              </View>

              {totalSavings > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.savingsLabel}>You save</Text>
                  <Text style={styles.savingsValue}>
                    Rs {totalSavings.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}

              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>Delivery</Text>
                <Text style={[styles.priceRowValue, styles.freeShipping]}>Free</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>Tax</Text>
                <Text style={styles.priceRowNote}>Log in to see tax details</Text>
              </View>

              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalAmountLabel}>Total Amount</Text>
                <Text style={styles.priceRowValue}>
                  Rs {payableTotal.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          )}

          {/* ── Price Details section ────────────────────────────────────── */}
          {hasFetched && itemCount > 0 && summary && (
            <View style={styles.priceDetailsSection}>
              <Text style={styles.priceDetailsLabel}>PRICE DETAILS</Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>MRP</Text>
                <Text style={[styles.priceRowValue, totalSavings > 0 && styles.mrpValueStruck]}>
                  Rs {summary.ItemsTotal.toLocaleString('en-IN')}
                </Text>
              </View>

              {totalSavings > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.savingsLabel}>You save</Text>
                  <Text style={styles.savingsValue}>
                    Rs {totalSavings.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}

              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>Delivery</Text>
                <Text style={[styles.priceRowValue, summary.TotalShippingCharge === 0 && styles.freeShipping]}>
                  {summary.TotalShippingCharge === 0 ? 'Free' : `Rs ${summary.TotalShippingCharge.toLocaleString('en-IN')}`}
                </Text>
              </View>

              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalAmountLabel}>Total Amount</Text>
                <View style={styles.totalAmountValueWrap}>
                  <Text style={styles.priceRowValue}>
                    Rs {payableTotal.toLocaleString('en-IN')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTaxBreakdown(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.inclTaxesText}>incl. taxes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ── Unavailable warning ────────────────────────────────────── */}
          {!isGuest && unavailableCount > 0 && (
            <View style={styles.unavailableWarning}>
              <Icon name="alert-circle-outline" size={16} color={Colors.ink4} />
              <Text style={styles.unavailableWarningText}>
                {unavailableCount} item{unavailableCount > 1 ? 's' : ''} unavailable
              </Text>
            </View>
          )}

          {/* ── Continue shopping ──────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.continueShoppingBtn, { marginHorizontal: Space.screenH, marginTop: Space[3] }]}
            onPress={() => (navigation.navigate as (screen: string, params?: Record<string, unknown>) => void)('MainTabs', { screen: 'Home' })}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.continueShoppingText}>← Continue Shopping</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Sticky checkout footer ─────────────────────────────────── */}
        <View style={[styles.summaryPanel, { paddingBottom: insets.bottom + Space[4] }]}>
          <View style={styles.footerPriceRow}>
            <Text style={styles.footerPriceLabel}>Price</Text>
            <Text style={styles.footerPrice}>Rs {payableTotal.toLocaleString('en-IN')}</Text>
          </View>
          <Animated.View style={checkoutTactile.animatedStyle}>
            <TouchableOpacity
              style={[styles.checkoutBtn, isCheckoutDisabled && styles.checkoutBtnDisabled]}
              onPress={handleCheckout}
              disabled={isCheckoutDisabled}
              {...checkoutTactile.handlers}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={`Proceed to buy ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Buy ({itemCount})</Text>
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
            <Text style={styles.headerTitle}>Shopping Cart</Text>
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
          title="Clear cart"
          body="Remove all items from your cart?"
          confirmLabel="Clear"
          destructive
        />
      )}

      {removeTarget && (
        <RemoveCartItemSheet
          itemName={removeTarget.kind === 'saved' ? removeTarget.item.Name : removeTarget.name}
          itemImage={removeTarget.kind === 'saved' ? removeTarget.item.Images : removeTarget.image}
          showMoveToWishlist={removeTarget.kind === 'saved'}
          moveLoading={moveLoading}
          onRemove={confirmRemove}
          onMoveToWishlist={confirmMoveToWishlist}
          onClose={dismissRemoveSheet}
        />
      )}

      {/* ── Tax Breakdown Sheet ────────────────────────────────────────── */}
      {showTaxBreakdown && (
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            onPress={() => setShowTaxBreakdown(false)}
            activeOpacity={1}
          />
          <View style={[styles.taxSheet, { paddingBottom: insets.bottom + Space[4] }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Price Breakdown</Text>
              <TouchableOpacity
                onPress={() => setShowTaxBreakdown(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={24} color={Colors.ink1} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
              {/* Total Amount */}
              <View style={styles.breakdownRowTotal}>
                <Text style={styles.breakdownLabelTotal}>Total Amount (incl. taxes)</Text>
                <Text style={styles.breakdownValueTotal}>
                  Rs {payableTotal.toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Tax Breakdown Section */}
              {summary?.TaxBreakdown && summary.TaxBreakdown.length > 0 && (
                <>
                  <View style={styles.taxSectionDivider} />
                  <Text style={styles.taxSectionTitle}>Tax Breakdown</Text>
                  {summary.TaxBreakdown.map((tax, index) => (
                    <View key={`${tax.TaxId}-${tax.TaxRate}-${index}`} style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>
                        {tax.TaxName ?? `Tax (${tax.TaxRate}%)`}
                      </Text>
                      <Text style={styles.breakdownValue}>
                        Rs {tax.TaxAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, styles.totalTaxLabel]}>Total Tax</Text>
                    <Text style={[styles.breakdownValue, styles.totalTaxValue]}>
                      Rs {totalTax.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
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
    fontWeight:    '600',
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
    backgroundColor: Colors.brandNavy,
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

  // ── Order summary — card with background ─────────────────────────────────────────
  summaryCard: {
    marginHorizontal: Space.screenH,
    marginTop:        Space[2],
    backgroundColor:  Colors.surface,
    borderRadius:     Radius.lg,
    borderWidth:      1,
    borderColor:      Colors.surfaceDeep,
    paddingHorizontal: Space[4],
    paddingVertical:  Space[4],
    gap:              Space[2],
  },
  summarySection: {
    gap: Space[3],
  },
  taxBreakdownSection: {
    gap: Space[3],
    paddingVertical: Space[2],
  },
  summaryCardLabel: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 2,
    marginBottom:  Space[1],
  },
  summaryRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'baseline',
    gap:            Space[2],
  },
  summaryLabel: {
    ...Type.caption,
    color: Colors.ink3,
    flex:  1,
  },
  summaryValue: {
    ...Type.caption,
    color: Colors.ink2,
    fontWeight: '500',
  },
  savingsLabel: {
    ...Type.caption,
    color: '#226B3C',
  },
  savingsValue: {
    ...Type.caption,
    color: '#226B3C',
  },
  strikethoughLabel: {
    textDecorationLine: 'line-through',
    color: Colors.ink4,
  },
  strikethoughValue: {
    textDecorationLine: 'line-through',
    color: Colors.ink4,
  },
  freeShipping: {
    color: '#226B3C',
  },
  summaryRule: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical: Space[3],
  },
  summaryTotalRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'baseline',
  },
  summaryTotalLabel: {
    fontFamily:    FontFamily.sans,
    fontSize:      15,
    fontWeight:    '500',
    color:         Colors.ink1,
    letterSpacing: -0.1,
  },
  summaryTotalValue: {
    fontFamily:    FontFamily.sans,
    fontSize:      16,
    fontWeight:    '700',
    color:         Colors.ink1,
    letterSpacing: -0.1,
  },
  summaryPayableBlock: {
    gap:              Space[2],
    backgroundColor:  Colors.surfaceSoft,
    borderRadius:     Radius.md,
    paddingHorizontal: Space[3],
    paddingVertical:  Space[3],
    marginTop:        Space[1],
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
    fontWeight:    '700',
    color:         Colors.ink1,
    letterSpacing: -0.4,
    lineHeight:    32,
  },
  unavailableNote: {
    ...Type.caption,
    color:     Colors.ink4,
    marginTop: Space[2],
  },
  unavailableWarning: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[2],
    marginHorizontal:  Space.screenH,
    marginTop:         Space[3],
    paddingVertical:   Space[2],
    paddingHorizontal: Space[3],
    backgroundColor:   'rgba(249,115,22,0.08)',
    borderRadius:      Radius.sm,
  },
  unavailableWarningText: {
    ...Type.caption,
    color: Colors.ink4,
    flex:  1,
  },
  summaryDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical:  Space[3],
  },
  summaryNote: {
    ...Type.caption,
    color:     Colors.ink4,
    marginTop: Space[2],
    textAlign: 'center',
  },
  savingsBannerInline: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[1],
    marginBottom:      Space[2],
    paddingVertical:   Space[2],
    paddingHorizontal: Space[2],
    backgroundColor:   'rgba(34,107,60,0.08)',
    borderRadius:      Radius.sm,
  },
  savingsBannerInlineText: {
    fontFamily: FontFamily.sans,
    fontSize:   12,
    fontWeight: '500',
    color:      '#226B3C',
    flex:       1,
  },

  // ── Price Details section ─────────────────────────────────────────────────
  priceDetailsSection: {
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[4],
    backgroundColor:   WHITE,
    gap:               Space[2],
  },
  priceDetailsLabel: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 1.6,
    fontSize:      9,
    marginBottom:  Space[2],
  },
  priceRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    paddingVertical: Space[2],
  },
  priceRowLabel: {
    ...Type.caption,
    color: Colors.ink3,
    flex:  1,
  },
  priceRowValue: {
    ...Type.caption,
    color:      Colors.ink2,
    fontWeight: '500',
  },
  mrpValueStruck: {
    color:              Colors.ink4,
    textDecorationLine: 'line-through',
  },
  priceRowNote: {
    ...Type.caption,
    color:    Colors.ink4,
    fontSize: 12,
  },
  priceDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical:  Space[2],
  },
  totalAmountLabel: {
    ...Type.caption,
    color: Colors.ink3,
  },
  totalAmountValueWrap: {
    alignItems: 'flex-end',
    gap: 0,
  },
  inclTaxesText: {
    ...Type.caption,
    color: Colors.brandNavy,
    textDecorationLine: 'underline',
    fontSize: 12,
  },

  // ── Price Details sheet ────────────────────────────────────────────────────
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  taxSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    maxHeight: '80%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.rule,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Space.screenH,
    paddingVertical: Space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  sheetTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.ink1,
    letterSpacing: -0.2,
  },
  sheetContent: {
    paddingHorizontal: Space.screenH,
    paddingVertical: Space[4],
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Space[2],
  },
  breakdownRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Space[3],
    paddingHorizontal: Space[2],
    backgroundColor: Colors.surfaceSoft,
    borderRadius: Radius.md,
  },
  breakdownLabel: {
    ...Type.caption,
    color: Colors.ink3,
  },
  breakdownLabelTotal: {
    fontFamily: FontFamily.serif,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink1,
  },
  breakdownValue: {
    ...Type.caption,
    color: Colors.ink2,
    fontWeight: '500',
  },
  breakdownValueTotal: {
    fontFamily: FontFamily.serif,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink1,
    letterSpacing: -0.2,
  },
  totalTaxLabel: {
    fontWeight: '700',
  },
  totalTaxValue: {
    fontWeight: '700',
  },
  breakdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical: Space[3],
  },
  discountLabel: {
    ...Type.caption,
    color: '#226B3C',
  },
  discountValue: {
    ...Type.caption,
    color: '#226B3C',
    fontWeight: '500',
  },
  freeShippingText: {
    color: '#226B3C',
  },
  priceRowValueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[2],
  },
  savingSectionHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Space[2],
    paddingHorizontal: Space[2],
    backgroundColor: 'rgba(34,107,60,0.08)',
    borderRadius: Radius.sm,
  },
  savingLabel: {
    ...Type.caption,
    color: '#226B3C',
    fontWeight: '500',
  },
  savingValue: {
    ...Type.caption,
    color: '#226B3C',
    fontWeight: '600',
  },
  taxSectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical: Space[3],
  },
  taxSectionTitle: {
    ...Type.label,
    color: Colors.ink4,
    letterSpacing: 1.6,
    marginVertical: Space[2],
    fontSize: 9,
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
  footerPayableRow: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'space-between',
    marginBottom:   Space[3],
  },
  footerPayableLabel: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 1.6,
    fontSize:      9,
  },
  footerPayableAmount: {
    fontFamily:    FontFamily.serif,
    fontSize:      20,
    fontWeight:    '600',
    color:         Colors.ink1,
    letterSpacing: -0.2,
  },
  summaryTopRule: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  footerPriceRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Space[3],
  },
  footerPriceLabel: {
    ...Type.caption,
    color: Colors.ink3,
  },
  footerPrice: {
    ...Type.caption,
    color:      Colors.ink2,
    fontWeight: '500',
  },
  checkoutBtn: {
    width:           '100%',
    height:          52,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.brandNavy,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
  },
  checkoutBtnDisabled: {
    opacity: 0.4,
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
