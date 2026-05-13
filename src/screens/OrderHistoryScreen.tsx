import React, { useState, useCallback, useRef } from 'react';
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
import { postOrderHistory } from '../api/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState, StatusBadge, BottomNavBar } from '../components/ui';
import { ErrorState } from '../components/system';
import type { OrderStatus } from '../components/ui';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type OrderHistoryScreenProps = {
  navigation: NavigationProp;
};

type OrderItem = {
  Inventory_Id: number;
  Item_Id: number;
  Variant: string;
  Name: string;
  Images: string;
  Quantity: number;
  Amount: number;
  OrderStatus: number;
  Brand_Id: number;
  Brand_Name: string;
  OrderNumber?: string;
  OrderedDate?: string;
};

const STATUS_MAP: Record<number, OrderStatus> = {
  1: 'Confirmed',
  2: 'Shipped',
  3: 'Delivered',
  4: 'Cancelled',
};

// 4:5 portrait — canonical card ratio
const IMG_W = 64;
const IMG_H = 80;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Single order row ──────────────────────────────────────────────────────────
const OrderRow: React.FC<{
  item: OrderItem;
  onPress: (item: OrderItem) => void;
  delay: number;
  isLast: boolean;
}> = ({ item, onPress, delay, isLast }) => {
  const haptic    = useHaptic();
  const entrance  = useEntrance(delay);
  const { animatedStyle: pressStyle, handlers } = useTactile();
  const imgOpacity = useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, {
      toValue:         1,
      duration:        Motion.duration.settle,
      easing:          Motion.easing.out,
      useNativeDriver: true,
    }).start();
  }, [imgOpacity]);

  const status     = STATUS_MAP[item.OrderStatus];
  const firstImage = item.Images.split(';')[0] || '';

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
          <View style={styles.imgWrap}>
            <Animated.Image
              source={{ uri: firstImage }}
              style={[styles.img, { opacity: imgOpacity }]}
              resizeMode="cover"
              onLoad={onLoad}
            />
          </View>

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
                <Text style={styles.amount}>${item.Amount.toFixed(2)}</Text>
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
  const { data: orders, loading, isError, error, run } = useAsyncState<OrderItem[]>([]);

  const fetchOrders = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (!userData) return [];
        const user = JSON.parse(userData);
        const response = await postOrderHistory(user.CustomerProfileCode);
        return response.result.OrdHistoryDetails || [];
      }, cancelled),
    [run],
  );

  useFocusEffect(
    useCallback(() => {
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

  const renderItem = ({ item, index }: ListRenderItemInfo<OrderItem>) => (
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
    if (isError) {
      return (
        <ErrorState
          title="Couldn't load orders"
          message={error ?? 'Something went wrong.'}
          onRetry={() => fetchOrders()}
          retryLoading={loading}
        />
      );
    }
    if (orderCount === 0 && !loading) {
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

      {/* Dark editorial header — matches WishlistScreen/ResultScreen pattern */}
      <View style={[styles.header, { paddingTop: insets.top + Space[2] }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerEyebrow}>YOUR ORDERS</Text>
            <Text style={styles.headerTitle}>
              {orderCount === 0
                ? 'History'
                : `${orderCount} ${orderCount === 1 ? 'order' : 'orders'}`}
            </Text>
          </View>

          <View style={styles.headerRight} />
        </View>
        <View style={styles.headerSeam} />
      </View>

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

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: Colors.ink1,
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  backBtn: {
    width:  36,
    height: 36,
    justifyContent: 'center',
    alignItems:     'center',
  },
  headerTitleBlock: {
    flex: 1,
    paddingHorizontal: Space[3],
    gap: 3,
  },
  headerEyebrow: {
    ...Type.label,
    color: 'rgba(255,255,255,0.30)',
  },
  headerTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      26,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight:    26 * 1.1,
  },
  headerRight: {
    width: 36,
  },
  headerSeam: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop:       Space[4],
    marginHorizontal: -Space.screenH,
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

  // ── Image — 4:5 portrait ──────────────────────────────────────────────────────
  imgWrap: {
    width:           IMG_W,
    height:          IMG_H,
    borderRadius:    Radius.sm,
    backgroundColor: Colors.surfaceDeep,
    overflow:        'hidden',
    flexShrink:      0,
  },
  img: {
    width:  '100%',
    height: '100%',
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
