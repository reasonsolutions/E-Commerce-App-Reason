import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { postCnfOrderDetail } from '../api/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { Skeleton, SkeletonRow, StatusBadge } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import type { OrderStatus } from '../components/ui';

// 4:5 portrait — canonical card ratio
const IMG_W = 88;
const IMG_H = 110;

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
  OrderDate?: string;
  CreatedDate?: string;
};

type DeliveryDetail = {
  OrderDeliveryAddressCode: number;
  CustomerName: string;
  MobileNumber: number;
  FullAddress: string;
  CustomerProfileCode: number;
};

type OrderDetailProps = {
  OrderDetails: OrderItem[];
  DeliveryDetail: DeliveryDetail[];
};

type OrderDetailScreenRouteParams = {
  orderItem: OrderItem;
};

type OrderDetailScreenProps = {
  navigation: StackNavigationProp<any>;
};

const STATUS_MAP: Record<number, OrderStatus> = {
  1: 'Confirmed',
  2: 'Shipped',
  3: 'Delivered',
  4: 'Cancelled',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ── Flat detail row — label left, value right ────────────────────────────────
const DetailRow: React.FC<{
  label: string;
  value: React.ReactNode;
  isLast?: boolean;
}> = ({ label, value, isLast }) => (
  <View style={[detailStyles.row, !isLast && detailStyles.rowDivider]}>
    <Text style={detailStyles.rowLabel}>{label}</Text>
    <View style={detailStyles.rowRight}>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={detailStyles.rowValue} numberOfLines={2}>{value}</Text>
      ) : (
        value
      )}
    </View>
  </View>
);

const detailStyles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: Space[4],
    gap:             Space[4],
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  rowLabel: {
    ...Type.label,
    color:     Colors.ink4,
    flexShrink: 0,
  },
  rowRight: {
    flex:           1,
    alignItems:     'flex-end',
  },
  rowValue: {
    fontFamily:    FontFamily.mono,
    fontSize:      12,
    color:         Colors.ink2,
    letterSpacing: 0.2,
    textAlign:     'right',
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────
const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const route  = useRoute<RouteProp<{ params: OrderDetailScreenRouteParams }, 'params'>>();
  const orderItem   = route.params?.orderItem;
  const orderNumber = orderItem?.OrderNumber;

  const { data: orderDetails, loading, isError, error, run } =
    useAsyncState<OrderDetailProps>(null);

  const fetchOrderDetails = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (!userData) throw new Error('Session expired. Please log in again.');
        const user = JSON.parse(userData);
        const response = await postCnfOrderDetail(String(orderNumber), user.CustomerProfileCode);
        return response.result;
      }, cancelled),
    [run, orderNumber],
  );

  React.useEffect(() => {
    if (!orderNumber) return;
    const cancelled = { current: false };
    fetchOrderDetails(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchOrderDetails, orderNumber]);

  const headerAnim  = useEntrance(0);
  const productAnim = useEntrance(80);
  const orderAnim   = useEntrance(160);
  const deliveryAnim = useEntrance(240);

  // ── Shared header ──────────────────────────────────────────────────────────
  const Header = (
    <Animated.View
      style={[styles.header, { paddingTop: insets.top + Space[2] }, headerAnim]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerEyebrow}>YOUR ORDER</Text>
          <Text style={styles.headerTitle}>
            {orderNumber ? `#${orderNumber}` : 'Details'}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.headerSeam} />
    </Animated.View>
  );

  // ── No order number ────────────────────────────────────────────────────────
  if (!orderNumber) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />
        {Header}
        <View style={styles.stateWrap}>
          <ErrorState
            title="Order reference missing"
            message="Please go back and try again."
            onRetry={() => navigation.goBack()}
            retryLoading={false}
          />
        </View>
      </View>
    );
  }

  // ── Fetch error ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />
        {Header}
        <View style={styles.stateWrap}>
          <ErrorState
            title="Couldn't load order"
            message={error ?? 'Something went wrong.'}
            onRetry={() => fetchOrderDetails()}
            retryLoading={loading}
          />
        </View>
      </View>
    );
  }

  const order    = orderItem ?? orderDetails?.OrderDetails[0];
  const delivery = orderDetails?.DeliveryDetail[0];
  const firstImg = order?.Images?.split(';').filter(Boolean)[0] ?? '';
  const status   = order ? STATUS_MAP[order.OrderStatus] : undefined;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (!order || !delivery) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />
        {Header}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Space[10] },
          ]}
        >
          {/* Product skeleton */}
          <View style={styles.skeletonProductRow}>
            <Skeleton width={IMG_W} height={IMG_H} radius={Radius.sm} />
            <View style={styles.skeletonMeta}>
              <Skeleton height={9}  width="45%" style={{ marginBottom: Space[2] }} />
              <Skeleton height={14} width="85%" style={{ marginBottom: Space[1] }} />
              <Skeleton height={13} width="60%" />
            </View>
          </View>
          <View style={styles.skeletonSection}>
            <Skeleton height={9} width="30%" style={{ marginBottom: Space[4] }} />
            <SkeletonRow gap={Space[2]} style={{ marginBottom: Space[3] }}>
              <Skeleton height={12} width="28%" />
              <Skeleton height={12} width="35%" />
            </SkeletonRow>
            <SkeletonRow gap={Space[2]} style={{ marginBottom: Space[3] }}>
              <Skeleton height={12} width="22%" />
              <Skeleton height={12} width="20%" />
            </SkeletonRow>
            <SkeletonRow gap={Space[2]}>
              <Skeleton height={12} width="18%" />
              <Skeleton height={12} width="25%" />
            </SkeletonRow>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Loaded content ─────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />
      {Header}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Space[10] },
        ]}
      >
        {/* ── Product summary ── */}
        <Animated.View style={[styles.productRow, productAnim]}>
          {firstImg ? (
            <View style={styles.imgWrap}>
              <Animated.Image
                source={{ uri: firstImg }}
                style={styles.img}
                resizeMode="cover"
              />
            </View>
          ) : null}
          <View style={styles.productMeta}>
            {order.Brand_Name ? (
              <Text style={styles.brand}>{order.Brand_Name.toUpperCase()}</Text>
            ) : null}
            <Text style={styles.productName} numberOfLines={3}>{order.Name}</Text>
            {order.Variant ? (
              <Text style={styles.variant}>{order.Variant}</Text>
            ) : null}
            <View style={styles.amountRow}>
              <Text style={styles.amount}>${order.Amount.toFixed(2)}</Text>
              {order.Quantity > 1 ? (
                <Text style={styles.qty}>× {order.Quantity}</Text>
              ) : null}
            </View>
          </View>
        </Animated.View>

        {/* ── Order details section ── */}
        <Animated.View style={[styles.section, orderAnim]}>
          <Text style={styles.sectionEyebrow}>ORDER</Text>
          {order.OrderNumber ? (
            <DetailRow label="NUMBER" value={`#${order.OrderNumber}`} />
          ) : null}
          {order.CreatedDate ? (
            <DetailRow label="DATE" value={formatDate(order.CreatedDate)} />
          ) : null}
          <DetailRow label="QUANTITY" value={String(order.Quantity)} />
          {status ? (
            <DetailRow
              label="STATUS"
              value={<StatusBadge status={status} />}
              isLast
            />
          ) : (
            <DetailRow label="STATUS" value={String(order.OrderStatus)} isLast />
          )}
        </Animated.View>

        {/* ── Delivery section ── */}
        <Animated.View style={[styles.section, deliveryAnim]}>
          <Text style={styles.sectionEyebrow}>DELIVERY</Text>
          <DetailRow label="NAME"    value={delivery.CustomerName} />
          <DetailRow label="MOBILE"  value={String(delivery.MobileNumber)} />
          <DetailRow label="ADDRESS" value={delivery.FullAddress} isLast />
        </Animated.View>
      </ScrollView>
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
    backgroundColor:   Colors.ink1,
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[4],
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
    fontFamily:    FontFamily.mono,
    fontSize:      18,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: 0.3,
    lineHeight:    18 * 1.2,
  },
  headerRight: {
    width: 36,
  },
  headerSeam: {
    height:           StyleSheet.hairlineWidth,
    backgroundColor:  'rgba(255,255,255,0.06)',
    marginTop:        Space[4],
    marginHorizontal: -Space.screenH,
  },

  // ── State wrappers ────────────────────────────────────────────────────────────
  stateWrap: {
    flex: 1,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
  },

  // ── Product row ───────────────────────────────────────────────────────────────
  productRow: {
    flexDirection: 'row',
    gap:           Space[4],
    paddingBottom: Space[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
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
  productMeta: {
    flex: 1,
    gap:  4,
    justifyContent: 'flex-start',
  },
  brand: {
    ...Type.label,
    color: Colors.ink4,
  },
  productName: {
    fontFamily:    FontFamily.serif,
    fontSize:      16,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.1,
    lineHeight:    16 * 1.35,
  },
  variant: {
    ...Type.caption,
    color: Colors.ink4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           Space[2],
    marginTop:     2,
  },
  amount: {
    fontFamily:    FontFamily.serif,
    fontSize:      18,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  qty: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    color:         Colors.ink4,
    letterSpacing: 0.3,
  },

  // ── Section ───────────────────────────────────────────────────────────────────
  section: {
    marginTop: Space[6],
  },
  sectionEyebrow: {
    ...Type.label,
    color:        Colors.ink4,
    marginBottom: Space[2],
  },

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  skeletonProductRow: {
    flexDirection: 'row',
    gap:           Space[4],
    paddingBottom: Space[5],
  },
  skeletonMeta: {
    flex: 1,
    paddingTop: Space[1],
  },
  skeletonSection: {
    marginTop: Space[6],
  },
});

export default OrderDetailScreen;
