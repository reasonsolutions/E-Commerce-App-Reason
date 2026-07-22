import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Animated,
  ActivityIndicator,
  ListRenderItemInfo,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { postOrderHistory } from '../api/order';
import { postSaveCartItems } from '../api/cart';
import { userFacingMessage } from '../api/apiError';
import { toastEmitter } from '../utils/toastEmitter';
import type { OrderHistoryFilters } from '../api/order';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import {
  FadeImage,
  Skeleton,
  OrderFilterSheet,
  ErrorBanner,
} from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius, Shadow } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useTabRootBackHandler } from '../hooks/useTabRootBackHandler';
import { useCart } from '../context/CartContext';
import { formatDate } from '../utils/formatDate';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { OrderStatusCode, type OrderHistoryItemInterface, type OrderDetailItemExtendedInterface } from '../api/interfaces';
import { LoginPromptSheet } from '../components/ui';
import { Motion } from '../theme/motion';

type OrderHistoryScreenProps = {
  navigation: StackNavigationProp<RootStackParamList>;
  route:      RouteProp<RootStackParamList, 'Orders'>;
};

interface OrderGroup {
  orderNumber: string;
  orderedDate: string;
  items: OrderHistoryItemInterface[];
  totalAmount: number;
}

function groupOrders(items: OrderHistoryItemInterface[]): OrderGroup[] {
  const map = new Map<string, OrderGroup>();
  for (const item of items) {
    const key = item.OrderNumber;
    if (!map.has(key)) {
      map.set(key, {
        orderNumber: item.OrderNumber,
        orderedDate: item.OrderedDate,
        items: [],
        totalAmount: 0,
      });
    }
    const group = map.get(key)!;
    group.items.push(item);
  }
  // AmountPaid is order-level (same value repeated on every item in the
  // order, via PaymentInfo) — read it once rather than summing each item's
  // net Amount, which would show the pre-tax subtotal instead of the real
  // amount charged.
  for (const group of map.values()) {
    group.totalAmount = group.items[0]?.PaymentInfo?.AmountPaid
      ?? group.items.reduce((sum, it) => sum + (it.Amount ?? 0), 0);
  }
  return Array.from(map.values());
}

const THUMB_SIZE = 44;
const MAX_THUMBS = 3;

// ── Order summary card ────────────────────────────────────────────────────────
const OrderCard: React.FC<{
  group: OrderGroup;
  onPress: (group: OrderGroup) => void;
  onReorder: (group: OrderGroup) => void;
  delay: number;
}> = React.memo(({ group, onPress, onReorder, delay }) => {
  const haptic = useHaptic();
  const entrance = useEntrance(delay);
  const itemCount = group.items.length;
  const visibleThumbs = group.items.slice(0, MAX_THUMBS);
  const overflow = itemCount - MAX_THUMBS;
  const sellerCount = new Set(
    group.items.map(it => it.CompanyName).filter((name): name is string => !!name),
  ).size;
  const sellerLabel = sellerCount > 1
    ? `${sellerCount} sellers`
    : (group.items.find(it => it.CompanyName)?.CompanyName ?? null);

  return (
    <Animated.View style={[entrance, cardStyles.wrapper]}>
      <TouchableOpacity
        style={cardStyles.card}
        activeOpacity={0.88}
        onPress={() => { haptic.light(); onPress(group); }}
      >
        {/* Thumbnails + total on one row */}
        <View style={cardStyles.topRow}>
          <View style={cardStyles.thumbRow}>
            {visibleThumbs.map((item, i) => (
              <View key={`${item.Inventory_Id}-${i}`} style={cardStyles.thumbWrap}>
                <FadeImage
                  uri={resolveImageUrl(item.Images)}
                  width={THUMB_SIZE}
                  height={THUMB_SIZE}
                  borderRadius={Radius.sm}
                  resizeMode="contain"
                  showSkeleton
                />
              </View>
            ))}
            {overflow > 0 && (
              <View style={cardStyles.overflowBadge}>
                <Text style={cardStyles.overflowText}>+{overflow}</Text>
              </View>
            )}
          </View>
          <Text style={cardStyles.total} numberOfLines={1}>
            MUR {group.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
        </View>

        {/* Date · seller(s) — status is shown on the order details screen instead */}
        <View style={cardStyles.metaRow}>
          <View style={cardStyles.metaCol}>
            <Text style={cardStyles.metaPrimary}>
              {formatDate(group.orderedDate)}
              {sellerLabel ? `  ·  ${sellerLabel}` : ''}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={cardStyles.actions}>
          <View style={cardStyles.viewDetailsRow}>
            <Text style={cardStyles.viewDetailsText}>View order details</Text>
            <Icon name="arrow-forward" size={13} color={Colors.accent} />
          </View>
          <View
            onStartShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
          >
            <TouchableOpacity
              style={cardStyles.reorderLink}
              activeOpacity={0.7}
              onPress={() => { haptic.light(); onReorder(group); }}
            >
              <Text style={cardStyles.reorderLinkText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const cardStyles = StyleSheet.create({
  wrapper: {
    marginBottom: Space[4],
  },
  card: {
    backgroundColor:   Colors.surface,
    borderRadius:      20,
    paddingHorizontal: Space[4],
    paddingVertical:   Space[4],
    ...Shadow.sm,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            Space[3],
    marginBottom:   Space[3],
  },
  thumbRow: {
    flexDirection: 'row',
    flexShrink:    1,
    gap:           Space[2],
  },
  thumbWrap: {
    backgroundColor: Colors.surfaceSoft,
    borderRadius:    Radius.sm,
    overflow:        'hidden',
  },
  overflowBadge: {
    width:           THUMB_SIZE,
    height:          THUMB_SIZE,
    borderRadius:    Radius.sm,
    backgroundColor: Colors.surfaceDeep,
    alignItems:      'center',
    justifyContent:  'center',
  },
  overflowText: {
    fontSize:      12,
    fontWeight:    '500',
    color:         Colors.ink3,
    letterSpacing: 0.2,
  },
  total: {
    fontFamily:    FontFamily.sans,
    fontSize:      17,
    fontWeight:    '700',
    color:         Colors.ink1,
    letterSpacing: -0.2,
    flexShrink:    0,
  },
  metaRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:            Space[3],
  },
  metaCol: {
    flex: 1,
    gap:  3,
  },
  metaPrimary: {
    fontFamily:    FontFamily.sans,
    fontSize:      13,
    fontWeight:    '600',
    color:         Colors.ink1,
    letterSpacing: 0.1,
  },
  actions: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginTop:      Space[3],
    paddingTop:     Space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.rule,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[1] + 2,
  },
  viewDetailsText: {
    fontFamily:    FontFamily.sans,
    fontSize:      12.5,
    fontWeight:    '700',
    color:         Colors.accent,
    letterSpacing: 0.1,
  },
  reorderLink: {
    paddingVertical: Space[1],
  },
  reorderLinkText: {
    fontFamily:         FontFamily.sans,
    fontSize:           12.5,
    fontWeight:         '400',
    color:              Colors.brandNavy,
    textDecorationLine: 'underline',
    letterSpacing:      0.1,
  },
});

const getProfileCode = async (): Promise<number | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
  if (!raw) return null;
  return JSON.parse(raw).CustomerProfileCode ?? null;
};

// ── Screen ────────────────────────────────────────────────────────────────────
const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const { guard, showLoginPrompt, dismissLoginPrompt } = useAuthGuard();
  const { setCartCount } = useCart();
  useTabRootBackHandler(navigation);

  // Bottom-tab siblings stay mounted at all times and each set their own
  // StatusBar style — RN merges state from every mounted instance app-wide,
  // so another tab's style can win even after switching back here. Reassert
  // on every focus rather than relying solely on the declarative <StatusBar>
  // below (see HomeScreen.tsx for the same fix / fuller rationale).
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
    }, []),
  );

  const [orders, setOrders]           = useState<OrderHistoryItemInterface[]>([]);
  const [hasMore, setHasMore]         = useState(true);
  const [hasFetched, setHasFetched]   = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError]       = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [reorderError, setReorderError]   = useState<string | null>(null);
  const [isGuest, setIsGuest]             = useState(false);

  const [filters, setFilters]             = useState<OrderHistoryFilters>({});
  const [filterVisible, setFilterVisible] = useState(false);

  const fetchingRef      = useRef(false);
  const pageRef          = useRef(1);
  const filtersRef       = useRef<OrderHistoryFilters>({});
  filtersRef.current     = filters;

  const fetchPage = useCallback(async (
    pageNum: number,
    activeFilters: OrderHistoryFilters,
    replace: boolean,
  ) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const code = await getProfileCode();
      if (!code) { setIsGuest(true); setHasFetched(true); return; }
      setIsGuest(false);
      const { items, hasMore: more } = await postOrderHistory(code, pageNum, activeFilters);
      setOrders(prev => replace ? items : [...prev, ...items]);
      pageRef.current = pageNum;
      setHasMore(more);
      if (replace) setFetchError(null);
      else setLoadMoreError(null);
    } catch (e) {
      const msg = userFacingMessage(e);
      if (replace) setFetchError(msg);
      else setLoadMoreError(msg);
    } finally {
      setHasFetched(true);
      fetchingRef.current = false;
    }
  }, []);

  const reload = useCallback((activeFilters: OrderHistoryFilters) => {
    setHasFetched(false);
    setOrders([]);
    pageRef.current = 1;
    setHasMore(true);
    setFetchError(null);
    fetchPage(1, activeFilters, true);
  }, [fetchPage]);

  useFocusEffect(
    useCallback(() => {
      const forceRefresh = route.params?.refresh;
      if (forceRefresh) navigation.setParams({ refresh: undefined });
      reload(filtersRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.refresh]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPage(1, filters, true);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (!hasMore || fetchingRef.current) return;
    setLoadingMore(true);
    await fetchPage(pageRef.current + 1, filtersRef.current, false);
    setLoadingMore(false);
  };

  const handleApplyFilters = (newFilters: OrderHistoryFilters) => {
    setFilters(newFilters);
    setFilterVisible(false);
    reload(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setFilterVisible(false);
    reload({});
  };

  const handleReorder = useCallback((group: OrderGroup) => {
    guard(async () => {
      const code = await getProfileCode();
      if (!code) return;
      setReorderError(null);

      try {
        await Promise.all(
          group.items.map(item =>
            postSaveCartItems({
              CustomerProfileCode: code,
              InventoryId: item.Inventory_Id,
              Quantity: item.Quantity ?? 1,
              IsPurchased: false,
            }),
          ),
        );
        haptic.success();
        setCartCount((prev: number) => prev + group.items.length);
        toastEmitter.emit('success', 'Added to bag');
      } catch (e) {
        setReorderError(userFacingMessage(e));
      }
    });
  }, [guard, haptic, setCartCount]);

  const activeFilterCount = [
    filters.sortBy && filters.sortBy !== 'desc',
    filters.dateFrom,
    filters.dateTo,
    filters.status && filters.status !== 'all',
  ].filter(Boolean).length;

  const groups = useMemo(() => {
    const allGroups = groupOrders(orders);
    if (!filters.status || filters.status === 'all') return allGroups;
    return allGroups.filter(g => {
      if (filters.status === 'delivered') return g.items.some(it => it.OrderStatus === OrderStatusCode.Delivered);
      if (filters.status === 'cancelled') return g.items.some(it => it.OrderStatus === OrderStatusCode.Cancelled);
      if (filters.status === 'returned')  return g.items.some(it => it.OrderStatus === OrderStatusCode.Returned);
      return true;
    });
  }, [orders, filters.status]);

  const groupCount = groups.length;

  const handlePressGroup = useCallback((group: OrderGroup) => {
    navigation.navigate('OrderDetails', { orderItem: group.items[0] as OrderDetailItemExtendedInterface, orderNumber: group.orderNumber });
  }, [navigation]);

  const renderItem = ({ item, index }: ListRenderItemInfo<OrderGroup>) => (
    <OrderCard
      group={item}
      onPress={handlePressGroup}
      onReorder={handleReorder}
      delay={Motion.stagger.delay(index)}
    />
  );

  const renderFooter = () => {
    if (loadMoreError) {
      return (
        <ErrorBanner
          body={loadMoreError}
          onRetry={() => {
            setLoadMoreError(null);
            fetchPage(pageRef.current + 1, filtersRef.current, false);
          }}
        />
      );
    }
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={Colors.ink3} />
        </View>
      );
    }
    return null;
  };

  const hasActiveFilters = !!(filters.sortBy && filters.sortBy !== 'desc') || !!filters.dateFrom || !!filters.dateTo || !!(filters.status && filters.status !== 'all');

  const renderEmpty = () => {
    if (isGuest) {
      return (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyContent}>
            <Icon name="person-outline" size={36} color={Colors.ink4} />
            <View style={styles.emptyText}>
              <Text style={styles.emptyTitle}>Sign in to view your orders.</Text>
              <Text style={styles.emptyBody}>
                Your orders, delivery updates, and purchase history will appear here.
              </Text>
            </View>
          </View>
          <View style={styles.emptyFooter}>
            <TouchableOpacity
              style={styles.emptyCTA}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text style={styles.emptyCTAText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emptySecondary}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Home')}
              accessibilityRole="button"
              accessibilityLabel="Continue shopping"
            >
              <Text style={styles.emptySecondaryText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyContent}>
          <Icon name="receipt-outline" size={36} color={Colors.ink4} />
          <View style={styles.emptyText}>
            {hasActiveFilters ? (
              <>
                <Text style={styles.emptyTitle}>No orders found.</Text>
                <Text style={styles.emptyBody}>Try adjusting your filters.</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>No orders yet.</Text>
                <Text style={styles.emptyBody}>
                  Start shopping to see your orders here.
                </Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.emptyFooter}>
          {hasActiveFilters ? (
            <TouchableOpacity
              style={styles.emptyCTA}
              activeOpacity={0.88}
              onPress={handleClearFilters}
              accessibilityRole="button"
              accessibilityLabel="Clear filters"
            >
              <Text style={styles.emptyCTAText}>Clear Filters</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.emptyCTA}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Home')}
              accessibilityRole="button"
              accessibilityLabel="Start shopping"
            >
              <Text style={styles.emptyCTAText}>Start Shopping</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map(i => (
        <View key={i} style={styles.skeletonCard}>
          {/* Header: order number + date */}
          <View style={styles.skeletonHeader}>
            <Skeleton height={10} width="50%" />
            <Skeleton height={10} width="22%" />
          </View>
          {/* Thumbnail strip */}
          <View style={styles.skeletonThumbRow}>
            {[0, 1, 2].map(j => (
              <Skeleton key={j} width={THUMB_SIZE} height={THUMB_SIZE} radius={Radius.sm} />
            ))}
          </View>
          {/* Summary row */}
          <View style={styles.skeletonSummary}>
            <Skeleton height={12} width="20%" />
            <Skeleton height={18} width="30%" />
          </View>
          {/* Status pill */}
          <Skeleton height={22} width={90} radius={Radius.pill} style={{ marginBottom: Space[3] }} />
          {/* Actions */}
          <View style={styles.skeletonDivider} />
          <View style={styles.skeletonFooter}>
            <Skeleton height={38} radius={Radius.pill} style={{ flex: 1 }} />
            <Skeleton height={38} width={80} radius={Radius.pill} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderBody = () => {
    if (!hasFetched) return renderSkeleton();

    if (fetchError) {
      return (
        <ErrorState
          title="Couldn't load your orders."
          message={fetchError}
          onRetry={() => reload(filters)}
          retryLoading={!hasFetched}
        />
      );
    }

    if (groupCount === 0) return renderEmpty();

    return (
      <FlatList
        data={groups}
        renderItem={renderItem}
        keyExtractor={(group) => group.orderNumber}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        ListHeaderComponent={
          reorderError ? (
            <ErrorBanner
              body={reorderError}
              onRetry={() => setReorderError(null)}
            />
          ) : null
        }
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.ink1]}
            tintColor={Colors.ink3}
          />
        }
      />
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surfaceSoft} />

      {/* Inline light header */}
      <View style={[styles.header, { paddingTop: insets.top + Space[3] }]}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Orders</Text>
          {groupCount > 0 ? (
            <Text style={styles.headerCount}>{groupCount} order{groupCount !== 1 ? 's' : ''}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => { haptic.light(); setFilterVisible(true); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.filterBtn}
        >
          <Icon name="options-outline" size={18} color={Colors.ink1} />
          {activeFilterCount > 0 ? (
            <View style={styles.filterDot} />
          ) : null}
        </TouchableOpacity>
      </View>
      <View style={styles.headerDivider} />

      {renderBody()}

      <OrderFilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilters}
        onClearAll={handleClearFilters}
        current={filters}
      />

      {showLoginPrompt && (
        <LoginPromptSheet
          context="orders"
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
    flex: 1,
    backgroundColor: Colors.surfaceSoft,
  },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[4],
    backgroundColor:   Colors.surfaceSoft,
  },
  backBtn: {
    marginRight: Space[3],
  },
  headerCenter: {
    flex:      1,
    gap:       2,
  },
  headerTitle: {
    fontFamily:  FontFamily.serif,
    fontSize:    26,
    fontWeight:  '600',
    color:       Colors.ink1,
    letterSpacing: -0.1,
  },
  headerCount: {
    ...Type.label,
    color: Colors.ink4,
  },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  filterBtn: {
    position:        'relative',
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.surface,
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     Colors.rule,
    alignItems:      'center',
    justifyContent:  'center',
  },
  filterDot: {
    position:        'absolute',
    top:             -2,
    right:           -2,
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: Colors.brandNavy,
  },

  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
    paddingBottom:     Space[8],
  },
  footerLoader: {
    paddingVertical: Space[5],
    alignItems:      'center',
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────────
  skeletonWrap: {
    flex: 1,
    paddingHorizontal: Space.screenH,
    paddingTop: Space[5],
    gap: Space[3],
  },
  skeletonCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.rule,
    paddingHorizontal: Space[4],
    paddingVertical: Space[3],
    gap: Space[2],
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Space[3],
  },
  skeletonDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical: Space[1],
  },
  skeletonThumbRow: {
    flexDirection: 'row',
    gap: Space[2],
    paddingVertical: Space[1],
  },
  skeletonSummary: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'baseline',
    paddingVertical: Space[1],
  },
  skeletonFooter: {
    flexDirection: 'row',
    gap: Space[3],
    alignItems: 'center',
    paddingTop: Space[2],
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyWrap: {
    flex: 1,
  },
  emptyContent: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Space[6],
    paddingBottom:     Space[10],
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
    color: Colors.accentInk,
  },
  emptySecondary: {
    alignItems:      'center',
    paddingVertical: Space[2],
  },
  emptySecondaryText: {
    ...Type.caption,
    color:              Colors.ink3,
    textDecorationLine: 'underline',
  },
});

export default OrderHistoryScreen;
