import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
  TouchableOpacity,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { postCnfOrderDetail, cancelOrder } from '../api/order';
import { userFacingMessage } from '../api/apiError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import {
  Skeleton,
  SkeletonRow,
  DarkHeader,
  StatusBadge,
  OrderProgressBar,
  FadeImage,
  CancelOrderSheet,
} from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius, Shadow } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { formatDate } from '../utils/formatDate';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { orderStatusLabel } from '../utils/orderStatus';
import type {
  OrderDetailItemExtendedInterface,
  OrderDetailResponseInterface,
  OrderStatusCode,
  OrderEventInterface,
} from '../api/interfaces';
import { CustomerCancellationReason, CancellationReasonLabel } from '../config/enum_files/CustomerCancellationReason';
import { RefundMode } from '../config/enum_files/RefundMode';
import { CustomerPlatform } from '../config/enum_files/CustomerPlatform';

const THUMB_W = 72;
const THUMB_H = 72;
const ACTION_BAR_HEIGHT = 64;
const CANCELLABLE_STATUSES: OrderStatusCode[] = [1, 2, 3];

type OrderDetailScreenRouteParams = {
  orderItem:   OrderDetailItemExtendedInterface;
  orderNumber: string;
};

type OrderDetailScreenProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

// ── Flat detail row ────────────────────────────────────────────────────────────
const DetailRow: React.FC<{ label: string; value: React.ReactNode; isLast?: boolean }> = ({ label, value, isLast }) => (
  <View style={[detailStyles.row, !isLast && detailStyles.rowDivider]}>
    <Text style={detailStyles.rowLabel}>{label}</Text>
    <View style={detailStyles.rowRight}>
      {typeof value === 'string' || typeof value === 'number'
        ? <Text style={detailStyles.rowValue} numberOfLines={2}>{value}</Text>
        : value}
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
    flex:       1,
    alignItems: 'flex-end',
  },
  rowValue: {
    fontSize:      12,
    fontWeight:    '500',
    color:         Colors.ink2,
    letterSpacing: 0.2,
    textAlign:     'right',
  },
});

// ── Per-item event timeline ────────────────────────────────────────────────────
const ItemTimeline: React.FC<{ events: OrderEventInterface[] }> = ({ events }) => {
  if (!events.length) return null;
  return (
    <View style={timelineStyles.wrap}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <View key={index} style={timelineStyles.row}>
            <View style={timelineStyles.spine}>
              <View style={[timelineStyles.dot, event.IsCompleted && timelineStyles.dotCompleted]} />
              {!isLast ? <View style={[timelineStyles.line, event.IsCompleted && timelineStyles.lineCompleted]} /> : null}
            </View>
            <View style={timelineStyles.content}>
              <Text style={[timelineStyles.desc, event.IsCompleted && timelineStyles.descCompleted]}>
                {event.Description}
              </Text>
              {event.Date ? (
                <Text style={timelineStyles.meta}>
                  {formatDate(event.Date)}{event.Location ? `  ·  ${event.Location}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const timelineStyles = StyleSheet.create({
  wrap: { marginTop: Space[3] },
  row: {
    flexDirection: 'row',
    gap:           Space[3],
    paddingBottom: Space[3],
  },
  spine: {
    alignItems: 'center',
    width:      14,
    flexShrink: 0,
    marginTop:  3,
  },
  dot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    borderWidth:     1.5,
    borderColor:     Colors.rule,
    backgroundColor: Colors.surface,
  },
  dotCompleted: {
    borderColor:     Colors.ink1,
    backgroundColor: Colors.ink1,
  },
  line: {
    width:           1.5,
    flex:            1,
    marginTop:       3,
    backgroundColor: Colors.rule,
  },
  lineCompleted: { backgroundColor: Colors.ink1 },
  content:       { flex: 1, paddingBottom: Space[1] },
  desc: {
    ...Type.body,
    color: Colors.ink4,
  },
  descCompleted: { color: Colors.ink1 },
  meta: {
    ...Type.caption,
    color:     Colors.ink4,
    marginTop: Space[1],
  },
});

// ── Single item card inside the order ─────────────────────────────────────────
const ItemCard: React.FC<{
  item: OrderDetailItemExtendedInterface;
  onCancel: (item: OrderDetailItemExtendedInterface) => void;
  isLast: boolean;
}> = ({ item, onCancel, isLast }) => {
  const imgUri = resolveImageUrl(item.Images);
  const status = orderStatusLabel(item.OrderStatus as OrderStatusCode);
  const isCancellable = CANCELLABLE_STATUSES.includes(item.OrderStatus as OrderStatusCode);
  const isActive = [1, 2, 3, 4, 5].includes(item.OrderStatus);

  return (
    <View style={[itemCardStyles.card, !isLast && itemCardStyles.cardBorder]}>
      {/* Image + meta row */}
      <View style={itemCardStyles.row}>
        <FadeImage
          uri={imgUri}
          width={THUMB_W}
          height={THUMB_H}
          borderRadius={Radius.sm}
          resizeMode="contain"
          showSkeleton
        />
        <View style={itemCardStyles.meta}>
          {item.Brand_Name ? (
            <Text style={itemCardStyles.brand}>{item.Brand_Name.toUpperCase()}</Text>
          ) : null}
          <Text style={itemCardStyles.name} numberOfLines={2}>{item.Name}</Text>
          {item.Variant ? (
            <Text style={itemCardStyles.variant}>{item.Variant}</Text>
          ) : null}
          <View style={itemCardStyles.priceRow}>
            <Text style={itemCardStyles.price}>
              MUR {(item.Amount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            {item.Quantity > 1 ? (
              <Text style={itemCardStyles.qty}>× {item.Quantity}</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Status + progress */}
      <View style={itemCardStyles.statusRow}>
        <StatusBadge status={status} />
        {isCancellable ? (
          <TouchableOpacity
            onPress={() => onCancel(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={itemCardStyles.cancelLink}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isActive ? (
        <View style={itemCardStyles.progressWrap}>
          <OrderProgressBar status={item.OrderStatus as OrderStatusCode} />
        </View>
      ) : null}

      {/* Per-item timeline */}
      <ItemTimeline events={item.Events ?? []} />
    </View>
  );
};

const itemCardStyles = StyleSheet.create({
  card: {
    paddingVertical: Space[4],
  },
  cardBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  row: {
    flexDirection: 'row',
    gap:           Space[3],
    marginBottom:  Space[3],
  },
  meta: {
    flex: 1,
    gap:  3,
  },
  brand: {
    ...Type.label,
    color: Colors.ink4,
  },
  name: {
    fontFamily:    FontFamily.sans,
    fontSize:      15,
    fontWeight:    '500',
    color:         Colors.ink1,
    letterSpacing: -0.1,
    lineHeight:    15 * 1.35,
  },
  variant: {
    ...Type.caption,
    color: Colors.ink4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           Space[2],
    marginTop:     2,
  },
  price: {
    fontFamily:    FontFamily.sans,
    fontSize:      15,
    fontWeight:    '700',
    color:         Colors.ink1,
    letterSpacing: -0.1,
  },
  qty: {
    fontSize:      11,
    fontWeight:    '500',
    color:         Colors.ink4,
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  cancelLink: {
    fontFamily:         FontFamily.sans,
    fontSize:           12,
    color:              Colors.danger,
    textDecorationLine: 'underline',
  },
  progressWrap: {
    marginTop: Space[2],
  },
});

// ── Fixed bottom action bar ────────────────────────────────────────────────────
const OrderActionBar: React.FC<{
  onHelp: () => void;
  bottomInset: number;
}> = ({ onHelp, bottomInset }) => (
  <View style={[barStyles.bar, { paddingBottom: bottomInset + Space[3] }]}>
    <TouchableOpacity style={barStyles.btn} activeOpacity={0.7} onPress={onHelp}>
      <Text style={barStyles.btnText}>Need Help</Text>
    </TouchableOpacity>
  </View>
);

const barStyles = StyleSheet.create({
  bar: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[3],
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
    backgroundColor:   Colors.surface,
  },
  btn: {
    height:          44,
    borderRadius:    Radius.pill,
    borderWidth:     1.5,
    borderColor:     Colors.brandNavy,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.surface,
  },
  btnText: {
    ...Type.bodyStrong,
    color: Colors.brandNavy,
  },
});

// ── Screen ─────────────────────────────────────────────────────────────────────
const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const route  = useRoute<RouteProp<{ params: OrderDetailScreenRouteParams }, 'params'>>();
  const fallbackItem  = route.params?.orderItem;
  const orderNumber   = route.params?.orderNumber ?? fallbackItem?.OrderNumber;

  const { data: orderDetails, loading, isError, error, run } =
    useAsyncState<OrderDetailResponseInterface>(null);

  const [showCancelSheet, setShowCancelSheet]       = useState(false);
  const [cancelTarget, setCancelTarget]             = useState<OrderDetailItemExtendedInterface | null>(null);
  const [selectedReason, setSelectedReason]         = useState<CustomerCancellationReason | null>(null);
  const [selectedRefundMode, setSelectedRefundMode] = useState<RefundMode | null>(null);
  const [cancelLoading, setCancelLoading]           = useState(false);
  const [cancelError, setCancelError]               = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess]           = useState(false);
  const [refreshing, setRefreshing]                 = useState(false);

  const fetchOrderDetails = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (!userData) throw new Error('Session expired. Please log in again.');
        const user = JSON.parse(userData);
        return postCnfOrderDetail(String(orderNumber), user.CustomerProfileCode);
      }, cancelled),
    [run, orderNumber],
  );

  React.useEffect(() => {
    if (!orderNumber) return;
    const cancelled = { current: false };
    fetchOrderDetails(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchOrderDetails, orderNumber]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  }, [fetchOrderDetails]);

  const openCancelSheet = (item: OrderDetailItemExtendedInterface) => {
    setCancelTarget(item);
    setCancelError(null);
    setSelectedReason(null);
    setSelectedRefundMode(null);
    haptic.light();
    setShowCancelSheet(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedReason || !selectedRefundMode || !cancelTarget || !orderNumber) {
      setCancelError('Please select a reason and a refund mode.');
      return;
    }
    try {
      setCancelLoading(true);
      setCancelError(null);
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      if (!raw) throw new Error('Session expired. Please log in again.');
      const user = JSON.parse(raw);
      const response = await cancelOrder({
        CustomerProfileCode:        user.CustomerProfileCode,
        CustomerPlatform:           Platform.OS === 'ios' ? CustomerPlatform.IOS : CustomerPlatform.Android,
        OrderNumber:                orderNumber,
        SubOrder: [{
          Id:          cancelTarget.SubOrder.Code,
          InventoryId: cancelTarget.Inventory_Id,
        }],
        CustomerCancellationReason: selectedReason,
        RefundMode:                 selectedRefundMode,
        Remarks:                    CancellationReasonLabel[selectedReason],
      });
      if (response?.statusCode !== 1) {
        setCancelError(response?.userMessage ?? 'Could not cancel. Please try again.');
        return;
      }
      haptic.success();
      setShowCancelSheet(false);
      setCancelSuccess(true);
      fetchOrderDetails();
    } catch (err) {
      setCancelError(userFacingMessage(err));
    } finally {
      setCancelLoading(false);
    }
  };

  const headerAnim  = useEntrance(0);
  const itemsAnim   = useEntrance(80);
  const addressAnim = useEntrance(160);
  const paymentAnim = useEntrance(220);

  const displayDate = fallbackItem?.OrderedDate ?? orderDetails?.OrderDetails[0]?.OrderedDate ?? '';

  const Header = (
    <Animated.View style={headerAnim}>
      <DarkHeader
        eyebrow={displayDate ? `YOUR ORDER  ·  ${formatDate(displayDate)}` : 'YOUR ORDER'}
        title={orderNumber ? `#${orderNumber}` : 'Details'}
        titleFont="mono"
        onBack={() => navigation.goBack()}
        paddingTop={insets.top + Space[2]}
      />
    </Animated.View>
  );

  if (!orderNumber) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} translucent />
        {Header}
        <View style={styles.stateWrap}>
          <ErrorState title="Order reference missing" message="Please go back and try again." onRetry={() => navigation.goBack()} retryLoading={false} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} translucent />
        {Header}
        <View style={styles.stateWrap}>
          <ErrorState title="Couldn't load this order." message={error ?? 'Tap retry to try again.'} onRetry={() => fetchOrderDetails()} retryLoading={loading} />
        </View>
      </View>
    );
  }

  // Loading state — show skeleton
  if (!orderDetails) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} translucent />
        {Header}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.skeletonItemRow}>
              <Skeleton width={THUMB_W} height={THUMB_H} radius={Radius.sm} />
              <View style={{ flex: 1, gap: Space[2] }}>
                <Skeleton height={9}  width="35%" />
                <Skeleton height={14} width="85%" />
                <Skeleton height={12} width="50%" />
              </View>
            </View>
            <View style={styles.skeletonItemRow}>
              <Skeleton width={THUMB_W} height={THUMB_H} radius={Radius.sm} />
              <View style={{ flex: 1, gap: Space[2] }}>
                <Skeleton height={9}  width="40%" />
                <Skeleton height={14} width="70%" />
                <Skeleton height={12} width="45%" />
              </View>
            </View>
          </View>
          <View style={[styles.section, { marginTop: Space[6] }]}>
            <Skeleton height={9} width="25%" style={{ marginBottom: Space[4] }} />
            <SkeletonRow gap={Space[2]} style={{ marginBottom: Space[3] }}>
              <Skeleton height={12} width="30%" />
              <Skeleton height={12} width="35%" />
            </SkeletonRow>
            <SkeletonRow gap={Space[2]}>
              <Skeleton height={12} width="20%" />
              <Skeleton height={12} width="25%" />
            </SkeletonRow>
          </View>
        </ScrollView>
      </View>
    );
  }

  const items    = orderDetails.OrderDetails;
  const delivery = orderDetails.DeliveryDetail[0];
  const orderedDate = items[0]?.OrderedDate ?? displayDate;

  // TotalAmountBeforeDiscount/Discount are per-item; AmountPaid/DeliveryCharges/isFreeShipping
  // are order-level (same value repeated on every item).
  const orderPayment = items[0]?.PaymentInfo;
  // Amount is already the line total (unit price × qty) — do not multiply by Quantity again.
  const subtotal  = items.reduce((sum, it) => sum + (it.Amount ?? 0), 0);
  const discount  = items.reduce((sum, it) => sum + (it.PaymentInfo?.Discount ?? 0), 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} translucent />
      {Header}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + ACTION_BAR_HEIGHT + Space[8] }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* ── Order meta strip ── */}
        <View style={styles.metaStrip}>
          <Text style={styles.metaText}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
            {'  ·  '}
            {formatDate(orderedDate)}
          </Text>
        </View>

        {/* ── Items ── */}
        <Animated.View style={[styles.section, itemsAnim]}>
          <Text style={styles.sectionEyebrow}>ITEMS</Text>
          {items.map((item, i) => (
            <ItemCard
              key={`${item.Inventory_Id}-${i}`}
              item={item}
              onCancel={openCancelSheet}
              isLast={i === items.length - 1}
            />
          ))}
        </Animated.View>

        {/* ── Delivery address ── */}
        {delivery ? (
          <Animated.View style={[styles.section, addressAnim]}>
            <Text style={styles.sectionEyebrow}>DELIVERING TO</Text>
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>{delivery.CustomerName}</Text>
              {[delivery.Address, delivery.StreetName, delivery.City, delivery.Zipcode].filter(Boolean).length > 0 ? (
                <Text style={styles.addressLine}>
                  {[delivery.Address, delivery.StreetName, delivery.City, delivery.Zipcode].filter(Boolean).join(', ')}
                </Text>
              ) : null}
              {delivery.MobileNumber ? (
                <Text style={styles.addressPhone}>{String(delivery.MobileNumber)}</Text>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        {/* ── Payment summary ── */}
        {orderPayment ? (
          <Animated.View style={[styles.section, paymentAnim]}>
            <Text style={styles.sectionEyebrow}>PAYMENT SUMMARY</Text>
            <DetailRow label="SUBTOTAL" value={`MUR ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            {discount > 0 ? (
              <DetailRow label="DISCOUNT" value={`− MUR ${discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            ) : null}
            {orderPayment.DeliveryCharges > 0 ? (
              <DetailRow label="DELIVERY" value={`MUR ${orderPayment.DeliveryCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            ) : orderPayment.isFreeShipping ? (
              <DetailRow label="DELIVERY" value="Free" />
            ) : null}
            {orderPayment.CouponAvailed ? (
              <DetailRow label="COUPON" value={orderPayment.CouponAvailed} />
            ) : null}
            <DetailRow label="TOTAL PAID" value={`MUR ${orderPayment.AmountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} isLast />
          </Animated.View>
        ) : null}
      </ScrollView>

      <OrderActionBar onHelp={() => navigation.navigate('HelpCenter')} bottomInset={insets.bottom} />

      {/* ── Cancel success modal ── */}
      <Modal visible={cancelSuccess} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Order Cancelled</Text>
            <Text style={styles.modalBody}>
              Your item has been cancelled successfully.
            </Text>
            <TouchableOpacity
              style={styles.modalCta}
              activeOpacity={0.8}
              onPress={() => { setCancelSuccess(false); (navigation.navigate as (screen: string, params?: Record<string, unknown>) => void)('MainTabs', { screen: 'Orders', params: { refresh: true } }); }}
            >
              <Text style={styles.modalCtaText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Cancel order sheet ──
          Rendered as its own Modal-wrapped overlay (see CancelOrderSheet),
          mirroring LoginPromptSheet's structure, instead of an inline
          <BottomSheet> mounted in this screen's own view tree — which
          crashed with "[Reanimated] Cannot find host instance for this
          component" during the navigation transition into this screen.
          Root cause of a second crash (same error, triggered by opening the
          sheet itself): CancelOrderSheet used BottomSheetScrollView instead
          of BottomSheetView — swapped to BottomSheetView to match
          LoginPromptSheet, which resolved it. */}
      {showCancelSheet && (
        <CancelOrderSheet
          itemName={cancelTarget?.Name}
          selectedReason={selectedReason}
          selectedRefundMode={selectedRefundMode}
          cancelError={cancelError}
          cancelLoading={cancelLoading}
          onSelectReason={(reason) => { haptic.light(); setSelectedReason(reason); }}
          onSelectRefundMode={(mode) => { haptic.light(); setSelectedRefundMode(mode); }}
          onConfirm={handleConfirmCancel}
          onClose={() => setShowCancelSheet(false)}
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surfaceSoft,
  },
  stateWrap: { flex: 1 },
  scrollContent: {
    paddingTop:    0,
    paddingBottom: Space[8],
  },

  // ── Order meta strip ───────────────────────────────────────────────────────────
  metaStrip: {
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[3],
    backgroundColor:   Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  metaText: {
    ...Type.label,
    fontSize:      10,
    color:         Colors.ink4,
    letterSpacing: 0.3,
  },

  // ── Section ────────────────────────────────────────────────────────────────────
  section: {
    marginTop:         Space[4],
    marginHorizontal:  Space.screenH,
    backgroundColor:   Colors.surface,
    borderRadius:      16,
    paddingHorizontal: Space[4],
    paddingVertical:   Space[2],
    ...Shadow.sm,
  },
  sectionEyebrow: {
    ...Type.label,
    color:         Colors.ink4,
    paddingTop:    Space[2],
    paddingBottom: Space[1],
  },

  // ── Skeleton ───────────────────────────────────────────────────────────────────
  skeletonItemRow: {
    flexDirection:  'row',
    gap:            Space[3],
    paddingVertical: Space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },

  // ── Delivery address ───────────────────────────────────────────────────────────
  addressCard: {
    gap:           Space[1],
    paddingTop:    Space[2],
    paddingBottom: Space[4],
  },
  addressName: {
    fontFamily:    FontFamily.serif,
    fontSize:      15,
    color:         Colors.ink1,
    letterSpacing: -0.1,
    lineHeight:    15 * 1.35,
  },
  addressLine: {
    ...Type.caption,
    color:      Colors.ink3,
    lineHeight: 18,
    marginTop:  2,
  },
  addressPhone: {
    fontSize:      11,
    fontWeight:    '500',
    color:         Colors.ink4,
    letterSpacing: 0.3,
    marginTop:     2,
  },

  // ── Cancel success modal ────────────────────────────────────────────────────────
  modalOverlay: {
    flex:              1,
    backgroundColor:   'rgba(0,0,0,0.5)',
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
  },
  modalCard: {
    width:           '100%',
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    padding:         Space[6],
    gap:             Space[3],
  },
  modalTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  modalBody: {
    ...Type.body,
    color:      Colors.ink3,
    lineHeight: 22,
  },
  modalCta: {
    marginTop:       Space[2],
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    paddingVertical: Space[4],
    alignItems:      'center',
  },
  modalCtaText: {
    ...Type.bodyStrong,
    color: Colors.surface,
  },
});

export default OrderDetailScreen;
