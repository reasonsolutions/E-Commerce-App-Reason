import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { postOrderHistory } from '../api/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState, Button, StatusBadge, BottomNavBar } from '../components/ui';
import { ErrorState } from '../components/system';
import type { OrderStatus } from '../components/ui';
import { Colors, Space, Radius, Shadow, FontSize, FontWeight } from '../theme';
import { useAsyncState } from '../hooks/useAsyncState';

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

function useEntrance(delay = 0) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 480, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);
  return { opacity, transform: [{ translateY }] };
}

// ── Single order row ──────────────────────────────────────────────────────────
const OrderRow: React.FC<{
  item: OrderItem;
  onPress: (item: OrderItem) => void;
  delay: number;
}> = ({ item, onPress, delay }) => {
  const anim       = useEntrance(delay);
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const onLoad     = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [imgOpacity]);

  const status = STATUS_MAP[item.OrderStatus];
  const firstImage = item.Images.split(';')[0] || '';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Animated.View style={[styles.row, anim]}>
      <TouchableOpacity
        style={styles.rowInner}
        onPress={() => onPress(item)}
        activeOpacity={0.82}
      >
        {/* Image */}
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
          <View style={styles.contentTop}>
            <View style={styles.meta}>
              {item.Brand_Name ? (
                <Text style={styles.brand}>{item.Brand_Name.toUpperCase()}</Text>
              ) : null}
              <Text style={styles.name} numberOfLines={2}>{item.Name}</Text>
              {item.Variant ? (
                <Text style={styles.variant}>{item.Variant}</Text>
              ) : null}
            </View>
            <View style={styles.amountBlock}>
              <Text style={styles.amount}>${item.Amount.toFixed(2)}</Text>
              <Icon name="chevron-forward" size={14} color={Colors.ink5} />
            </View>
          </View>

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

  const renderItem = ({ item, index }: ListRenderItemInfo<OrderItem>) => (
    <OrderRow
      item={item}
      onPress={(order) => navigation.navigate('OrderDetails', { orderItem: order })}
      delay={index * 60}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      icon={<Icon name="receipt-outline" size={32} color={Colors.ink3} />}
      title="No orders yet"
      body="Your order history will appear here"
      action={
        <Button variant="primary" size="md" onPress={() => navigation.navigate('Home')}>
          Start Shopping
        </Button>
      }
    />
  );

  const orderList = orders ?? [];
  const orderCount = orderList.length;

  const renderBody = () => {
    if (isError) {
      return (
        <ErrorState
          title="Couldn't load orders"
          message={error ?? 'An unexpected error occurred.'}
          onRetry={() => fetchOrders()}
          retryLoading={loading}
          icon={<Icon name="receipt-outline" size={32} color={Colors.ink3} />}
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Dark editorial header */}
      <View style={[styles.header, { paddingTop: insets.top + Space[3] }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>YOUR ORDERS</Text>
            <Text style={styles.displayTitle}>
              {orderCount === 0 ? 'History' : `${orderCount} ${orderCount === 1 ? 'order' : 'orders'}`}
            </Text>
          </View>
        </View>
      </View>

      {/* Tonal bridge */}
      <LinearGradient
        colors={['#0A0A0A', Colors.surfaceAlt]}
        style={styles.bridge}
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
    backgroundColor: Colors.surfaceAlt,
  },

  // ── Header ──
  header: {
    backgroundColor: '#0A0A0A',
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[5],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space[3],
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 1.4,
  },
  displayTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: FontSize['2xl'] * 1.15,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Bridge ──
  bridge: {
    height: 48,
    marginTop: -1,
  },

  // ── List ──
  list: {
    flex: 1,
    marginTop: -Space[3],
  },
  listContent: {
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[8],
    gap: Space[3],
  },

  // ── Row ──
  row: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadow.md,
    overflow: 'hidden',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Space[4],
    gap: Space[3],
  },
  imgWrap: {
    width: 76,
    height: 76,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
    flexShrink: 0,
  },
  img: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    gap: Space[3],
  },
  contentTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space[2],
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  brand: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.ink4,
    letterSpacing: 0.9,
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.ink1,
    letterSpacing: -0.1,
    lineHeight: FontSize.base * 1.3,
  },
  variant: {
    fontSize: FontSize.xs,
    color: Colors.ink4,
  },
  amountBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  amount: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.ink1,
    letterSpacing: -0.2,
  },
  contentBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderMeta: {
    gap: 1,
  },
  orderNumber: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.ink3,
    letterSpacing: 0.2,
  },
  orderDate: {
    fontSize: FontSize.xs,
    color: Colors.ink4,
  },
});

export default OrderHistoryScreen;
