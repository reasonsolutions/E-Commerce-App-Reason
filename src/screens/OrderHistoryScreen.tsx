import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Animated,
  ListRenderItemInfo,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { postOrderHistory } from '../api/order';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState, StatusBadge, BottomNavBar, DarkHeader, FadeImage, Skeleton } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useAsyncState } from '../hooks/useAsyncState';
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

// ── Screen ────────────────────────────────────────────────────────────────────
const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { data: orders, loading, isError, error, run } = useAsyncState<OrderHistoryItemInterface[]>([]);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchOrders = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (!userData) return [];
        const user = JSON.parse(userData);
        const result = await postOrderHistory(user.CustomerProfileCode);
        setHasFetched(true);
        return result;
      }, cancelled),
    [run],
  );

  useFocusEffect(
    useCallback(() => {
      setHasFetched(false);
      const cancelled = { current: false };
      fetchOrders(cancelled);
      return () => { cancelled.current = true; };
    }, [fetchOrders]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const orderList  = orders ?? [];
  const orderCount = orderList.length;

  const renderItem = ({ item, index }: ListRenderItemInfo<OrderHistoryItemInterface>) => (
    <OrderRow
      item={item}
      onPress={(order) => navigation.navigate('OrderDetails', { orderItem: order })}
      delay={Math.min(index * 55, 320)}
      isLast={index === orderList.length - 1}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      icon={<Icon name="receipt-outline" size={26} color={Colors.ink4} />}
      title="No orders yet."
      body="Once you place an order, it will live here."
      action={
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.emptyLink}>Browse the collection</Text>
          <View style={styles.emptyLinkUnderline} />
        </TouchableOpacity>
      }
    />
  );

  const renderBody = () => {
    if (!hasFetched && !isError) {
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
    if (isError) {
      return (
        <ErrorState
          title="Couldn't load your orders."
          message={error ?? 'Tap retry to try again.'}
          onRetry={() => fetchOrders()}
          retryLoading={loading}
        />
      );
    }
    if (orderCount === 0 && hasFetched) {
      return renderEmpty();
    }
    return (
      <FlatList
        data={orderList}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.Inventory_Id}-${index}`}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
        title={orderCount === 0 ? 'History' : `${orderCount} ${orderCount === 1 ? 'order' : 'orders'}`}
        onBack={() => navigation.goBack()}
        paddingTop={insets.top + Space[2]}
      />

      {renderBody()}

      <BottomNavBar
        activeTab="Orders"
        onNavigate={(route) => navigation.navigate(route)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
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

  // ── Empty state CTA — text link ───────────────────────────────────────────────
  emptyLink: {
    ...Type.caption,
    color:     Colors.ink3,
    textAlign: 'center',
  },
  emptyLinkUnderline: {
    height:          1,
    backgroundColor: Colors.ink4,
    marginTop:       3,
    width:           '100%',
  },
});

export default OrderHistoryScreen;
