import React, { useState, useCallback, useRef } from 'react';
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
import type { OrderHistoryFilters } from '../api/order';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useFocusEffect } from '@react-navigation/native';
import {
  StatusBadge,
  BottomNavBar,
  DarkHeader,
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
import { formatDate } from '../utils/formatDate';
import { orderStatusLabel } from '../utils/orderStatus';
import type { OrderHistoryItemInterface } from '../api/interfaces';

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type OrderHistoryScreenProps = {
  navigation: NavigationProp;
};

// 4:5 portrait — canonical card ratio
const IMG_W = 64;
const IMG_H = 80;


// ── Single order row ──────────────────────────────────────────────────────────
const OrderRow: React.FC<{
  item: OrderHistoryItemInterface;
  onPress: (item: OrderHistoryItemInterface) => void;
  delay: number;
  isLast: boolean;
}> = ({ item, onPress, delay, isLast }) => {
  const haptic    = useHaptic();
  const entrance  = useEntrance(delay);
  const { animatedStyle: pressStyle, handlers } = useTactile();
  const status     = orderStatusLabel(item.OrderStatus);
  const firstImage = item.Images?.split(';').filter(Boolean)[0] ?? '';

  return (
    <Animated.View style={entrance}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          {...handlers}
          style={styles.row}
          activeOpacity={1}
          onPress={() => { haptic.light(); onPress(item); }}
        >
          {/* Portrait image */}
          <FadeImage
            uri={firstImage}
            width={IMG_W}
            height={IMG_H}
            borderRadius={Radius.sm}
          />

          {/* Content */}
          <View style={styles.content}>
            {/* Top — brand + name + amount */}
            <View style={styles.contentTop}>
              <View style={styles.metaLeft}>
                {item.Brand_Name ? (
                  <Text style={styles.brand}>{item.Brand_Name.toUpperCase()}</Text>
                ) : null}
                <Text style={styles.name} numberOfLines={2}>{item.Name}</Text>
                {item.Variant ? (
                  <Text style={styles.variant}>{item.Variant}</Text>
                ) : null}
              </View>
              {/* Amount — right-aligned serif */}
              <View style={styles.amountBlock}>
                <Text style={styles.amount}>Rs {(item.Amount ?? 0).toFixed(0)}</Text>
                <Icon name="chevron-forward" size={13} color={Colors.ink5} />
              </View>
            </View>

            {/* Bottom — order meta + status */}
            <View style={styles.contentBottom}>
              <View style={styles.orderMeta}>
                {item.OrderNumber ? (
                  <Text style={styles.orderNumber}>#{item.OrderNumber}</Text>
                ) : null}
                {item.OrderedDate ? (
                  <Text style={styles.orderDate}>{formatDate(item.OrderedDate)}</Text>
                ) : null}
              </View>
              {status ? <StatusBadge status={status} /> : null}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Hairline divider — suppressed after last item */}
      {!isLast && <View style={styles.divider} />}
    </Animated.View>
  );
};

const getProfileCode = async (): Promise<number | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
  if (!raw) return null;
  return JSON.parse(raw).CustomerProfileCode ?? null;
};

// ── Screen ────────────────────────────────────────────────────────────────────
const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const [orders, setOrders]           = useState<OrderHistoryItemInterface[]>([]);
  const [hasMore, setHasMore]         = useState(true);
  const [hasFetched, setHasFetched]   = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError]       = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const [filters, setFilters]             = useState<OrderHistoryFilters>({});
  const [filterVisible, setFilterVisible] = useState(false);

  // Refs so closures always read current values without stale captures
  const fetchingRef  = useRef(false);
  const pageRef      = useRef(1);
  const filtersRef   = useRef<OrderHistoryFilters>({});
  filtersRef.current = filters;

  // Fetch a specific page and append or replace
  const fetchPage = useCallback(async (
    pageNum: number,
    activeFilters: OrderHistoryFilters,
    replace: boolean,
  ) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const code = await getProfileCode();
      if (!code) { setHasFetched(true); return; }
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

  // Reset + load page 1 on focus or filter change
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

  const activeFilterCount = [
    filters.sortBy && filters.sortBy !== 'desc',
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const orderCount = orders.length;

  const renderItem = ({ item, index }: ListRenderItemInfo<OrderHistoryItemInterface>) => (
    <OrderRow
      item={item}
      onPress={(order) => navigation.navigate('OrderDetails', { orderItem: order })}
      delay={Math.min(index * 55, 320)}
      isLast={index === orderCount - 1 && !hasMore}
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

  const hasActiveFilters = !!(filters.sortBy && filters.sortBy !== 'desc') || !!filters.dateFrom || !!filters.dateTo;

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyContent}>
        <View style={styles.emptyIllustration}>
          <Icon name="receipt-outline" size={52} color={Colors.ink3} />
        </View>
        {hasActiveFilters ? (
          <>
            <Text style={styles.emptyTitle}>No orders found.</Text>
            <Text style={styles.emptyBody}>Try adjusting your filters.</Text>
          </>
        ) : (
          <>
            <Text style={styles.emptyTitle}>No orders yet.</Text>
            <Text style={styles.emptyBody}>Once you place an order, it will live here.</Text>
          </>
        )}
      </View>
      <View style={styles.emptyFooter}>
        {hasActiveFilters ? (
          <TouchableOpacity
            style={styles.emptyCTA}
            activeOpacity={0.88}
            onPress={handleClearFilters}
          >
            <Text style={styles.emptyCTAText}>Clear filters</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.emptyCTA}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.emptyCTAText}>Browse the collection</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderBody = () => {
    if (!hasFetched) {
      return (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2, 3].map(i => (
            <View key={i}>
              <View style={styles.skeletonRow}>
                <Skeleton width={IMG_W} height={IMG_H} radius={Radius.sm} />
                <View style={styles.skeletonContent}>
                  <Skeleton height={9}  width="35%" style={{ marginBottom: Space[2] }} />
                  <Skeleton height={14} width="80%" style={{ marginBottom: Space[1] }} />
                  <Skeleton height={12} width="55%" />
                  <View style={styles.skeletonBottom}>
                    <Skeleton height={10} width="40%" />
                    <Skeleton height={18} width="22%" radius={Radius.pill} />
                  </View>
                </View>
              </View>
              {i < 3 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      );
    }
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
    if (orderCount === 0) {
      return renderEmpty();
    }
    return (
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.Inventory_Id}-${index}`}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
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
      <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />

      <DarkHeader
        eyebrow="YOUR ORDERS"
        title="History"
        onBack={() => navigation.goBack()}
        paddingTop={insets.top + Space[2]}
        rightSlot={
          <TouchableOpacity
            onPress={() => { haptic.light(); setFilterVisible(true); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.filterBtn}
          >
            <Icon name="options-outline" size={20} color="#FFFFFF" />
            {activeFilterCount > 0 ? (
              <View style={styles.filterDot} />
            ) : null}
          </TouchableOpacity>
        }
      />

      {renderBody()}

      <OrderFilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilters}
        onClearAll={handleClearFilters}
        current={filters}
      />

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

  // ── Filter button ─────────────────────────────────────────────────────────────
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

  // ── List ──────────────────────────────────────────────────────────────────────
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

  // ── Row — no card boxing, hairline dividers ───────────────────────────────────
  row: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    paddingVertical: Space[4],
    gap:             Space[4],
  },
  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── Content ───────────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    gap:  Space[3],
  },
  contentTop: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Space[2],
  },
  metaLeft: {
    flex: 1,
    gap:  3,
  },
  brand: {
    ...Type.label,
    color: Colors.ink4,
  },
  name: {
    fontFamily:    FontFamily.serif,
    fontSize:      15,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.1,
    lineHeight:    15 * 1.35,
  },
  variant: {
    ...Type.caption,
    color: Colors.ink4,
  },
  // Serif amount — right-aligned, restrained weight
  amountBlock: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           2,
    flexShrink:    0,
    paddingTop:    1,
  },
  amount: {
    fontFamily:    FontFamily.serif,
    fontSize:      16,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.2,
  },
  contentBottom: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  // Mono order metadata
  orderMeta: {
    gap: 2,
  },
  orderNumber: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    color:         Colors.ink3,
    letterSpacing: 0.3,
  },
  orderDate: {
    fontFamily:    FontFamily.mono,
    fontSize:      10,
    color:         Colors.ink4,
    letterSpacing: 0.2,
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────────
  skeletonWrap: {
    flex:              1,
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
  },
  skeletonRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    paddingVertical: Space[4],
    gap:             Space[4],
  },
  skeletonContent: {
    flex: 1,
    gap:  Space[2],
    paddingTop: Space[1],
  },
  skeletonBottom: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginTop:      Space[2],
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
});

export default OrderHistoryScreen;
