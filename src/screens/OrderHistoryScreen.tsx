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
import type { OrderHistoryFilters } from '../api/order';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useFocusEffect } from '@react-navigation/native';
import {
  StatusBadge,
  BottomNavBar,
  FadeImage,
  Skeleton,
  OrderFilterSheet,
  ErrorBanner,
} from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useCart } from '../context/CartContext';
import { formatDate } from '../utils/formatDate';
import { orderStatusLabel } from '../utils/orderStatus';
import { OrderStatusCode, type OrderHistoryItemInterface } from '../api/interfaces';
import { toastEmitter } from '../utils/toastEmitter';
import { LoginPromptSheet } from '../components/ui';

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type OrderHistoryScreenProps = {
  navigation: NavigationProp;
};

const IMG_W = 56;
const IMG_H = 70;

// Progress steps for active orders (not terminal states)
const PROGRESS_STEPS: OrderStatusCode[] = [
  OrderStatusCode.New,
  OrderStatusCode.Confirmed,
  OrderStatusCode.Processing,
  OrderStatusCode.Fulfilled,
  OrderStatusCode.Shipped,
  OrderStatusCode.Delivered,
];

const ACTIVE_STATUSES = new Set([
  OrderStatusCode.New,
  OrderStatusCode.Confirmed,
  OrderStatusCode.Processing,
  OrderStatusCode.Fulfilled,
  OrderStatusCode.Shipped,
]);

interface OrderGroup {
  orderNumber: string;
  orderedDate: string;
  items: OrderHistoryItemInterface[];
  totalAmount: number;
  // Use the status of the first item (all items in a group share the same status)
  status: OrderStatusCode;
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
        status: item.OrderStatus,
      });
    }
    const group = map.get(key)!;
    group.items.push(item);
    group.totalAmount += item.Amount ?? 0;
  }
  return Array.from(map.values());
}

// ── Order progress bar ────────────────────────────────────────────────────────
const PROGRESS_LABELS: Record<OrderStatusCode, string> = {
  [OrderStatusCode.New]:        'Placed',
  [OrderStatusCode.Confirmed]:  'Confirmed',
  [OrderStatusCode.Processing]: 'Processing',
  [OrderStatusCode.Fulfilled]:  'Packed',
  [OrderStatusCode.Shipped]:    'Shipped',
  [OrderStatusCode.Delivered]:  'Delivered',
  [OrderStatusCode.Cancelled]:  'Cancelled',
  [OrderStatusCode.Returned]:   'Returned',
};

const OrderProgressBar: React.FC<{ status: OrderStatusCode }> = ({ status }) => {
  const currentIdx = PROGRESS_STEPS.indexOf(status);
  if (currentIdx < 0) return null;

  return (
    <View style={progStyles.container}>
      {PROGRESS_STEPS.map((step, i) => {
        const filled   = i <= currentIdx;
        const isActive = i === currentIdx;
        return (
          <View key={step} style={progStyles.stepWrap}>
            <View
              style={[
                progStyles.segment,
                filled    && progStyles.segmentFilled,
                isActive  && progStyles.segmentActive,
              ]}
            />
            {isActive ? (
              <Text style={progStyles.stepLabel}>{PROGRESS_LABELS[step]}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const progStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap:           3,
    marginTop:     10,
    marginBottom:  2,
  },
  stepWrap: {
    flex:      1,
    alignItems: 'center',
  },
  segment: {
    width:           '100%',
    height:          3,
    borderRadius:    2,
    backgroundColor: Colors.rule,
  },
  segmentFilled: {
    backgroundColor: Colors.ink3,
  },
  segmentActive: {
    backgroundColor: Colors.accent,
  },
  stepLabel: {
    fontFamily:    FontFamily.mono,
    fontSize:      8,
    letterSpacing: 0.3,
    color:         Colors.accent,
    marginTop:     3,
    textAlign:     'center',
  },
});

// ── Single item row within a card ─────────────────────────────────────────────
const OrderItemRow: React.FC<{ item: OrderHistoryItemInterface; isLast: boolean }> = ({
  item,
  isLast,
}) => {
  const firstImage = item.Images?.split(';').filter(Boolean)[0] ?? '';

  return (
    <View style={[itemStyles.row, !isLast && itemStyles.rowBorder]}>
      <FadeImage
        uri={firstImage}
        width={IMG_W}
        height={IMG_H}
        borderRadius={Radius.sm}
      />
      <View style={itemStyles.meta}>
        {item.Brand_Name ? (
          <Text style={itemStyles.brand}>{item.Brand_Name.toUpperCase()}</Text>
        ) : null}
        <Text style={itemStyles.name} numberOfLines={2}>{item.Name}</Text>
        {item.Variant ? (
          <Text style={itemStyles.variant}>{item.Variant}</Text>
        ) : null}
        <View style={itemStyles.qtyPriceRow}>
          <Text style={itemStyles.qty}>Qty {item.Quantity}</Text>
          <Text style={itemStyles.price}>Rs {(item.Amount ?? 0).toFixed(0)}</Text>
        </View>
      </View>
    </View>
  );
};

const itemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Space[3],
    paddingVertical: Space[3],
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  brand: {
    ...Type.label,
    color: Colors.ink4,
  },
  name: {
    fontFamily:    FontFamily.serif,
    fontSize:      14,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.1,
    lineHeight:    14 * 1.45,
  },
  variant: {
    ...Type.caption,
    color: Colors.ink4,
  },
  qtyPriceRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      2,
  },
  qty: {
    fontFamily:    FontFamily.mono,
    fontSize:      10,
    color:         Colors.ink4,
    letterSpacing: 0.2,
    lineHeight:    10 * 1.4,
  },
  price: {
    fontFamily:    FontFamily.serif,
    fontSize:      14,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.1,
    lineHeight:    14 * 1.2,
  },
});

// ── Order group card ──────────────────────────────────────────────────────────
const OrderCard: React.FC<{
  group: OrderGroup;
  onPress: (item: OrderHistoryItemInterface) => void;
  onReorder: (group: OrderGroup) => void;
  delay: number;
}> = ({ group, onPress, onReorder, delay }) => {
  const haptic = useHaptic();
  const entrance = useEntrance(delay);
  const { animatedStyle: pressStyle, handlers } = useTactile();
  const status = orderStatusLabel(group.status);
  const isActive = ACTIVE_STATUSES.has(group.status);
  const isCancelled = group.status === OrderStatusCode.Cancelled || group.status === OrderStatusCode.Returned;
  const itemCount = group.items.length;

  return (
    <Animated.View style={[entrance, cardStyles.wrapper]}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          {...handlers}
          activeOpacity={1}
          onPress={() => { haptic.light(); onPress(group.items[0]); }}
          style={cardStyles.card}
        >
          {/* Left status strip */}
          <View
            style={[
              cardStyles.strip,
              isCancelled && cardStyles.stripCancelled,
              isActive && cardStyles.stripActive,
              group.status === OrderStatusCode.Delivered && cardStyles.stripDelivered,
            ]}
          />

          <View style={cardStyles.body}>
            {/* Card header */}
            <View style={cardStyles.header}>
              <View style={cardStyles.headerLeft}>
                <Text style={cardStyles.orderNum}>#{group.orderNumber}</Text>
                <Text style={cardStyles.orderDate}>
                  {formatDate(group.orderedDate)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <View style={cardStyles.headerRight}>
                <StatusBadge status={status} />
                <Icon name="chevron-forward" size={13} color={Colors.ink5} style={{ marginTop: 2 }} />
              </View>
            </View>

            {/* Progress bar for active orders */}
            {isActive ? <OrderProgressBar status={group.status} /> : null}

            {/* Divider */}
            <View style={cardStyles.divider} />

            {/* Item rows */}
            {group.items.map((item, i) => (
              <OrderItemRow
                key={`${item.Inventory_Id}-${i}`}
                item={item}
                isLast={i === group.items.length - 1}
              />
            ))}

            {/* Card footer: total (only when 2+ items) + reorder */}
            <View style={cardStyles.footer}>
              {itemCount > 1 ? (
                <View>
                  <Text style={cardStyles.totalLabel}>ORDER TOTAL</Text>
                  <Text style={cardStyles.totalAmount}>
                    Rs {group.totalAmount.toFixed(0)}
                  </Text>
                </View>
              ) : <View />}
              <TouchableOpacity
                style={cardStyles.reorderBtn}
                activeOpacity={0.8}
                onPress={(e) => {
                  e.stopPropagation();
                  haptic.light();
                  onReorder(group);
                }}
              >
                <Text style={cardStyles.reorderBtnText}>Reorder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const cardStyles = StyleSheet.create({
  wrapper: {
    marginBottom: Space[3],
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.rule,
    overflow: 'hidden',
  },
  strip: {
    width: 4,
    backgroundColor: Colors.ink5,
  },
  stripActive: {
    backgroundColor: Colors.accent,
  },
  stripDelivered: {
    backgroundColor: Colors.ink3,
  },
  stripCancelled: {
    backgroundColor: Colors.danger,
  },
  body: {
    flex: 1,
    paddingHorizontal: Space[4],
    paddingTop: Space[3],
    paddingBottom: Space[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    gap: 3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[1],
  },
  orderNum: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    color:         Colors.ink2,
    letterSpacing: 0.4,
    lineHeight:    11 * 1.4,
  },
  orderDate: {
    fontFamily:    FontFamily.mono,
    fontSize:      10,
    color:         Colors.ink4,
    letterSpacing: 0.2,
    lineHeight:    10 * 1.4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical: Space[2],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Space[3],
    paddingTop: Space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.rule,
  },
  totalLabel: {
    ...Type.label,
    color: Colors.ink4,
    marginBottom: 2,
  },
  totalAmount: {
    fontFamily:    FontFamily.serif,
    fontSize:      17,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.2,
    lineHeight:    17 * 1.2,
  },
  reorderBtn: {
    paddingVertical:   8,
    paddingHorizontal: 18,
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       Colors.ink1,
  },
  reorderBtnText: {
    fontFamily:    FontFamily.sans,
    fontSize:      13,
    fontWeight:    '500',
    color:         Colors.ink1,
    letterSpacing: 0.1,
    lineHeight:    13 * 1.4,
  },
});

const getProfileCode = async (): Promise<number | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
  if (!raw) return null;
  return JSON.parse(raw).CustomerProfileCode ?? null;
};

// ── Screen ────────────────────────────────────────────────────────────────────
const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const { guard, showLoginPrompt, dismissLoginPrompt } = useAuthGuard();
  const { setCartCount } = useCart();

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
  const hasFetchedOnce   = useRef(false);
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
    } catch (e: any) {
      const msg = e?.message ?? 'Something went wrong.';
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
      if (!hasFetchedOnce.current) {
        hasFetchedOnce.current = true;
      }
      reload(filtersRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
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

  const handleReorder = (group: OrderGroup) => {
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
        toastEmitter.emit('success', `${group.items.length === 1 ? '1 item' : `${group.items.length} items`} added to cart`);
      } catch (e: any) {
        setReorderError(e?.message ?? 'Could not add items to cart.');
      }
    });
  };

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
      if (filters.status === 'delivered') return g.status === OrderStatusCode.Delivered;
      if (filters.status === 'cancelled') return g.status === OrderStatusCode.Cancelled;
      if (filters.status === 'returned')  return g.status === OrderStatusCode.Returned;
      return true;
    });
  }, [orders, filters.status]);

  const groupCount = groups.length;

  const renderItem = ({ item, index }: ListRenderItemInfo<OrderGroup>) => (
    <OrderCard
      group={item}
      onPress={(orderItem) => navigation.navigate('OrderDetails', { orderItem })}
      onReorder={handleReorder}
      delay={Math.min(index * 60, 300)}
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
                  When you place an order, your updates will appear here.
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
          {/* Card header skeleton */}
          <View style={styles.skeletonHeader}>
            <View style={{ gap: Space[1], flex: 1 }}>
              <Skeleton height={11} width="40%" />
              <Skeleton height={10} width="55%" />
            </View>
            <Skeleton height={22} width={80} radius={Radius.pill} />
          </View>
          <View style={styles.skeletonDivider} />
          {/* Item row skeleton */}
          <View style={styles.skeletonRow}>
            <Skeleton width={IMG_W} height={IMG_H} radius={Radius.sm} />
            <View style={styles.skeletonMeta}>
              <Skeleton height={9}  width="30%" style={{ marginBottom: Space[1] }} />
              <Skeleton height={13} width="80%" style={{ marginBottom: Space[1] }} />
              <Skeleton height={11} width="50%" />
            </View>
          </View>
          {/* Footer skeleton */}
          <View style={styles.skeletonDivider} />
          <View style={styles.skeletonFooter}>
            <Skeleton height={14} width={60} />
            <Skeleton height={34} width={80} radius={Radius.pill} />
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
        removeClippedSubviews
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Inline light header */}
      <View style={[styles.header, { paddingTop: insets.top + Space[3] }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-back" size={22} color={Colors.ink1} />
        </TouchableOpacity>

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
          <Icon name="options-outline" size={20} color={Colors.ink1} />
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

      <BottomNavBar
        activeTab="Orders"
        onNavigate={(route) => navigation.navigate(route)}
        onNavigateToAuth={(screen) => navigation.navigate(screen)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[4],
    backgroundColor:   Colors.surface,
  },
  backBtn: {
    marginRight: Space[3],
  },
  headerCenter: {
    flex:      1,
    gap:       2,
  },
  headerTitle: {
    fontFamily:   FontFamily.serif,
    fontSize:     22,
    fontWeight:   '400',
    color:        Colors.ink1,
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

  filterBtn: {
    position: 'relative',
  },
  filterDot: {
    position:        'absolute',
    top:             -2,
    right:           -2,
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: Colors.accent,
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
  skeletonRow: {
    flexDirection: 'row',
    gap: Space[3],
    paddingVertical: Space[2],
  },
  skeletonMeta: {
    flex: 1,
    gap: Space[1],
    paddingTop: Space[1],
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    borderWidth:     1,
    borderColor:     Colors.ink1,
    borderRadius:    Radius.pill,
    paddingVertical: Space[4],
    alignItems:      'center',
  },
  emptyCTAText: {
    ...Type.bodyStrong,
    color: Colors.ink1,
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
