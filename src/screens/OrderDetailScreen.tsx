import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { postCnfOrderDetail, cancelOrder } from '../api/order';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { Skeleton, SkeletonRow, StatusBadge, DarkHeader, PrimaryButton } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { formatDate } from '../utils/formatDate';
import { orderStatusLabel } from '../utils/orderStatus';
import type { OrderDetailItemExtendedInterface, OrderDetailResponseInterface, OrderStatusCode, OrderEventInterface } from '../api/interfaces';
import { CustomerCancellationReason, CancellationReasonLabel } from '../config/enum_files/CustomerCancellationReason';
import { RefundMode, RefundModeLabel } from '../config/enum_files/RefundMode';
import { CustomerPlatform } from '../config/enum_files/CustomerPlatform';

// 4:5 portrait — canonical card ratio
const IMG_W = 88;
const IMG_H = 110;

type OrderDetailScreenRouteParams = {
  orderItem: OrderDetailItemExtendedInterface;
};

type OrderDetailScreenProps = {
  navigation: StackNavigationProp<any>;
};


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

const CANCELLABLE_STATUSES: OrderStatusCode[] = [1, 2, 3]; // New, Confirmed, Processing

// ── Screen ────────────────────────────────────────────────────────────────────
const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const route  = useRoute<RouteProp<{ params: OrderDetailScreenRouteParams }, 'params'>>();
  const orderItem   = route.params?.orderItem;
  const orderNumber = orderItem?.OrderNumber;

  const { data: orderDetails, loading, isError, error, run } =
    useAsyncState<OrderDetailResponseInterface>(null);

  // ── Cancel order state ─────────────────────────────────────────────────────
  const cancelSheetRef = useRef<BottomSheet>(null);
  const [selectedReason, setSelectedReason] = useState<CustomerCancellationReason | null>(null);
  const [selectedRefundMode, setSelectedRefundMode] = useState<RefundMode | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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

  const openCancelSheet = () => {
    setCancelError(null);
    setSelectedReason(null);
    setSelectedRefundMode(null);
    haptic.light();
    cancelSheetRef.current?.expand();
  };

  const handleConfirmCancel = async () => {
    if (!selectedReason || !selectedRefundMode) {
      setCancelError('Please select a reason and a refund mode.');
      return;
    }
    const liveItem = orderDetails?.OrderDetails[0];
    if (!liveItem || !orderNumber) return;

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
          Id:          parseInt(liveItem.SubOrderNumber.replace('SORDNO-', ''), 10),
          InventoryId: liveItem.Inventory_Id,
        }],
        CustomerCancellationReason: selectedReason,
        RefundMode:                 selectedRefundMode,
        Remarks:                    CancellationReasonLabel[selectedReason],
      });

      if (response?.statusCode !== 1) {
        setCancelError(response?.userMessage ?? 'Could not cancel this order. Please try again.');
        return;
      }

      haptic.success();
      cancelSheetRef.current?.close();
      Alert.alert(
        'Order Cancelled',
        response.userMessage ?? 'Your order has been cancelled successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      setCancelError(err?.response?.data?.userMessage ?? 'Something went wrong. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  const headerAnim   = useEntrance(0);
  const productAnim  = useEntrance(80);
  const orderAnim    = useEntrance(160);
  const paymentAnim  = useEntrance(220);
  const deliveryAnim = useEntrance(280);
  const eventsAnim   = useEntrance(360);

  const Header = (
    <Animated.View style={headerAnim}>
      <DarkHeader
        eyebrow="YOUR ORDER"
        title={orderNumber ? `#${orderNumber}` : 'Details'}
        titleFont="mono"
        onBack={() => navigation.goBack()}
        paddingTop={insets.top + Space[2]}
      />
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
            title="Couldn't load this order."
            message={error ?? 'Tap retry to try again.'}
            onRetry={() => fetchOrderDetails()}
            retryLoading={loading}
          />
        </View>
      </View>
    );
  }

  const order    = orderItem ?? orderDetails?.OrderDetails[0];
  const delivery = orderDetails?.DeliveryDetail[0];
  const events   = orderDetails?.Events ?? [];
  const firstImg = order?.Images?.split(';').filter(Boolean)[0] ?? '';
  const status   = order ? orderStatusLabel(order.OrderStatus) : undefined;
  const isCancellable = order ? CANCELLABLE_STATUSES.includes(order.OrderStatus as OrderStatusCode) : false;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (!order) {
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
              <Text style={styles.amount}>Rs {(order.Amount ?? 0).toFixed(0)}</Text>
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

        {/* ── Payment section ── */}
        {order.PaymentInfo ? (
          <Animated.View style={[styles.section, paymentAnim]}>
            <Text style={styles.sectionEyebrow}>PAYMENT</Text>
            <DetailRow label="AMOUNT PAID"  value={`Rs ${order.PaymentInfo.AmountPaid.toFixed(2)}`} />
            {order.PaymentInfo.Discount > 0 ? (
              <DetailRow label="DISCOUNT" value={`− Rs ${order.PaymentInfo.Discount.toFixed(2)}`} />
            ) : null}
            {order.PaymentInfo.DeliveryCharges > 0 ? (
              <DetailRow label="DELIVERY" value={`Rs ${order.PaymentInfo.DeliveryCharges.toFixed(2)}`} />
            ) : null}
            {order.PaymentInfo.isFreeShipping ? (
              <DetailRow label="DELIVERY" value="Free" />
            ) : null}
            {order.PaymentInfo.CouponAvailed ? (
              <DetailRow label="COUPON" value={order.PaymentInfo.CouponAvailed} />
            ) : null}
            <DetailRow
              label="TOTAL"
              value={`Rs ${order.PaymentInfo.TotalAmountAfterDiscount.toFixed(2)}`}
              isLast
            />
          </Animated.View>
        ) : null}

        {/* ── Delivery section ── */}
        {delivery ? (
          <Animated.View style={[styles.section, deliveryAnim]}>
            <Text style={styles.sectionEyebrow}>DELIVERY</Text>
            <DetailRow label="NAME"    value={delivery.CustomerName} />
            <DetailRow label="MOBILE"  value={String(delivery.MobileNumber)} />
            <DetailRow label="ADDRESS" value={[delivery.Address, delivery.StreetName, delivery.City, delivery.Zipcode].filter(Boolean).join(', ')} isLast />
          </Animated.View>
        ) : null}

        {/* ── Order timeline ── */}
        {events.length > 0 ? (
          <Animated.View style={[styles.section, eventsAnim]}>
            <Text style={styles.sectionEyebrow}>TRACKING</Text>
            {events.map((event: OrderEventInterface, index: number) => {
              const isLast = index === events.length - 1;
              return (
                <View key={index} style={styles.eventRow}>
                  {/* Spine */}
                  <View style={styles.eventSpine}>
                    <View style={[styles.eventDot, event.IsCompleted && styles.eventDotCompleted]} />
                    {!isLast ? (
                      <View style={[styles.eventLine, event.IsCompleted && styles.eventLineCompleted]} />
                    ) : null}
                  </View>
                  {/* Content */}
                  <View style={styles.eventContent}>
                    <Text style={[styles.eventDescription, event.IsCompleted && styles.eventDescriptionCompleted]}>
                      {event.Description}
                    </Text>
                    {event.Date ? (
                      <Text style={styles.eventMeta}>
                        {formatDate(event.Date)}{event.Location ? `  ·  ${event.Location}` : ''}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Animated.View>
        ) : null}

        {/* ── Cancel order CTA — only for cancellable statuses ── */}
        {isCancellable ? (
          <Animated.View style={[styles.cancelWrap, eventsAnim]}>
            <TouchableOpacity onPress={openCancelSheet} style={styles.cancelLink} activeOpacity={0.6}>
              <Text style={styles.cancelLinkText}>Cancel this order</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* ── Cancel order bottom sheet ── */}
      <BottomSheet
        ref={cancelSheetRef}
        index={-1}
        snapPoints={['75%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetScrollView
          contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + Space[6] }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sheetTitle}>Cancel Order</Text>
          <Text style={styles.sheetSubtitle}>#{orderNumber}</Text>

          {/* Reason picker */}
          <Text style={styles.sheetSectionLabel}>REASON FOR CANCELLATION</Text>
          {(Object.values(CustomerCancellationReason).filter(v => typeof v === 'number') as CustomerCancellationReason[]).map(reason => (
            <TouchableOpacity
              key={reason}
              onPress={() => { haptic.light(); setSelectedReason(reason); }}
              style={[styles.optionRow, selectedReason === reason && styles.optionRowSelected]}
              activeOpacity={0.7}
            >
              <View style={[styles.optionRadio, selectedReason === reason && styles.optionRadioSelected]} />
              <Text style={[styles.optionLabel, selectedReason === reason && styles.optionLabelSelected]}>
                {CancellationReasonLabel[reason]}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Refund mode picker */}
          <Text style={[styles.sheetSectionLabel, { marginTop: Space[5] }]}>REFUND METHOD</Text>
          {(Object.values(RefundMode).filter(v => typeof v === 'number') as RefundMode[]).map(mode => (
            <TouchableOpacity
              key={mode}
              onPress={() => { haptic.light(); setSelectedRefundMode(mode); }}
              style={[styles.optionRow, selectedRefundMode === mode && styles.optionRowSelected]}
              activeOpacity={0.7}
            >
              <View style={[styles.optionRadio, selectedRefundMode === mode && styles.optionRadioSelected]} />
              <Text style={[styles.optionLabel, selectedRefundMode === mode && styles.optionLabelSelected]}>
                {RefundModeLabel[mode]}
              </Text>
            </TouchableOpacity>
          ))}

          {cancelError ? (
            <Text style={styles.sheetError}>{cancelError}</Text>
          ) : null}

          <PrimaryButton
            label="Confirm Cancellation"
            onPress={handleConfirmCancel}
            loading={cancelLoading}
            style={styles.sheetCta}
          />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
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

  // ── Order timeline ────────────────────────────────────────────────────────────
  eventRow: {
    flexDirection: 'row',
    gap:           Space[3],
    paddingBottom: Space[4],
  },
  eventSpine: {
    alignItems:  'center',
    width:       16,
    flexShrink:  0,
    marginTop:   3,
  },
  eventDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    borderWidth:  1.5,
    borderColor:  Colors.rule,
    backgroundColor: Colors.surface,
  },
  eventDotCompleted: {
    borderColor:     Colors.ink1,
    backgroundColor: Colors.ink1,
  },
  eventLine: {
    width:           1.5,
    flex:            1,
    marginTop:       3,
    backgroundColor: Colors.rule,
  },
  eventLineCompleted: {
    backgroundColor: Colors.ink1,
  },
  eventContent: {
    flex:         1,
    paddingBottom: Space[1],
  },
  eventDescription: {
    ...Type.body,
    color: Colors.ink4,
  },
  eventDescriptionCompleted: {
    color: Colors.ink1,
  },
  eventMeta: {
    ...Type.caption,
    color:     Colors.ink4,
    marginTop: Space[1],
  },

  // ── Cancel link ───────────────────────────────────────────────────────────────
  cancelWrap: {
    marginTop:  Space[8],
    alignItems: 'center',
  },
  cancelLink: {
    paddingVertical: Space[2],
  },
  cancelLinkText: {
    ...Type.caption,
    color:             Colors.danger,
    textDecorationLine: 'underline',
  },

  // ── Cancel sheet ──────────────────────────────────────────────────────────────
  sheetBg: {
    backgroundColor: Colors.surface,
  },
  sheetHandle: {
    backgroundColor: Colors.rule,
  },
  sheetContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[4],
  },
  sheetTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    ...Type.label,
    color:        Colors.ink4,
    marginTop:    Space[1],
    marginBottom: Space[5],
  },
  sheetSectionLabel: {
    ...Type.label,
    color:        Colors.ink4,
    marginBottom: Space[3],
  },
  optionRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[3],
    paddingVertical:   Space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  optionRowSelected: {
    // no background change — radio dot is the indicator
  },
  optionRadio: {
    width:        16,
    height:       16,
    borderRadius: 8,
    borderWidth:  1.5,
    borderColor:  Colors.ink4,
    flexShrink:   0,
  },
  optionRadioSelected: {
    borderColor:     Colors.ink1,
    backgroundColor: Colors.ink1,
  },
  optionLabel: {
    ...Type.body,
    color: Colors.ink3,
    flex:  1,
  },
  optionLabelSelected: {
    color: Colors.ink1,
  },
  sheetError: {
    ...Type.caption,
    color:     Colors.danger,
    marginTop: Space[4],
    textAlign: 'center',
  },
  sheetCta: {
    marginTop: Space[6],
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
