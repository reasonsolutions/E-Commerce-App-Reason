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
import { postCnfOrderDetail, cancelOrder, postReturnRequest } from '../api/order';
import { userFacingMessage } from '../api/apiError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import {
  Skeleton,
  SkeletonRow,
  DarkHeader,
  StatusBadge,
  FadeImage,
  CancelOrderSheet,
  ReturnOrderSheet,
  OrderItemCard,
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
import { orderStatusLabel, currentOrderStatus } from '../utils/orderStatus';
import type {
  OrderDetailItemExtendedInterface,
  OrderDetailResponseInterface,
  OrderStatusCode,
  OrderEventInterface,
} from '../api/interfaces';
import {
  CustomerCancellationReason,
  CancellationReasonLabel,
} from '../config/enum_files/CustomerCancellationReason';
import { RefundMode } from '../config/enum_files/RefundMode';
import { CustomerPlatform } from '../config/enum_files/CustomerPlatform';
import { PaymentModes } from '../config/enum_files/PaymentModes';

const THUMB_W = 72;
const THUMB_H = 72;
const ACTION_BAR_HEIGHT = 64;
const CANCELLABLE_STATUSES: OrderStatusCode[] = [1, 2, 3];
const RETURNABLE_STATUS: OrderStatusCode = 6 as OrderStatusCode; // Delivered

type OrderDetailScreenRouteParams = {
  orderItem: OrderDetailItemExtendedInterface;
  orderNumber: string;
};

type OrderDetailScreenProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

// ── Flat detail row ────────────────────────────────────────────────────────────
const DetailRow: React.FC<{
  label: string;
  value: React.ReactNode;
  isLast?: boolean;
  emphasis?: boolean;
}> = ({ label, value, isLast, emphasis }) => (
  <View
    style={[
      detailStyles.row,
      emphasis && detailStyles.rowEmphasis,
      !isLast && !emphasis && detailStyles.rowDivider,
    ]}
  >
    <Text style={[detailStyles.rowLabel, emphasis && detailStyles.rowLabelEmphasis]}>
      {label}
    </Text>
    <View style={detailStyles.rowRight}>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text
          style={[detailStyles.rowValue, emphasis && detailStyles.rowValueEmphasis]}
          numberOfLines={2}
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  </View>
);

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Space[4],
    gap: Space[4],
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  rowEmphasis: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.ink1,
    paddingTop: Space[4],
  },
  rowLabel: {
    ...Type.label,
    color: Colors.ink4,
    flexShrink: 0,
  },
  rowLabelEmphasis: {
    color: Colors.ink1,
  },
  rowRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.ink2,
    letterSpacing: 0.2,
    textAlign: 'right',
  },
  rowValueEmphasis: {
    fontFamily: FontFamily.serif,
    fontSize: 20,
    fontWeight: '400',
    color: Colors.ink1,
    letterSpacing: -0.2,
  },
});

// ── Per-item event timeline ────────────────────────────────────────────────────
const ItemTimeline: React.FC<{ events: OrderEventInterface[] }> = ({
  events,
}) => {
  if (!events.length) return null;
  return (
    <View style={timelineStyles.wrap}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <View key={index} style={timelineStyles.row}>
            <View style={timelineStyles.spine}>
              <View
                style={[
                  timelineStyles.dot,
                  event.IsCompleted && timelineStyles.dotCompleted,
                ]}
              />
              {!isLast ? (
                <View
                  style={[
                    timelineStyles.line,
                    event.IsCompleted && timelineStyles.lineCompleted,
                  ]}
                />
              ) : null}
            </View>
            <View style={timelineStyles.content}>
              <Text
                style={[
                  timelineStyles.desc,
                  event.IsCompleted && timelineStyles.descCompleted,
                ]}
              >
                {event.Description}
              </Text>
              {event.Date ? (
                <Text style={timelineStyles.meta}>
                  {formatDate(event.Date)}
                  {event.Location ? `  ·  ${event.Location}` : ''}
                </Text>
              ) : null}
              {event.ShipementEvent && event.ShipementEvent.length > 0 ? (
                <View style={timelineStyles.subWrap}>
                  {event.ShipementEvent.map((shipEvent, shipIndex) => (
                    <View key={shipIndex} style={timelineStyles.subRow}>
                      <View style={timelineStyles.subDot} />
                      <View style={timelineStyles.subContent}>
                        <Text style={timelineStyles.subDesc}>
                          {shipEvent.Description}
                        </Text>
                        {shipEvent.Date ? (
                          <Text style={timelineStyles.meta}>
                            {formatDate(shipEvent.Date)}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
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
    gap: Space[3],
    paddingBottom: Space[3],
  },
  spine: {
    alignItems: 'center',
    width: 14,
    flexShrink: 0,
    marginTop: 3,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.rule,
    backgroundColor: Colors.surface,
  },
  dotCompleted: {
    borderColor: Colors.ink1,
    backgroundColor: Colors.ink1,
  },
  line: {
    width: 1.5,
    flex: 1,
    marginTop: 3,
    backgroundColor: Colors.rule,
  },
  lineCompleted: { backgroundColor: Colors.ink1 },
  content: { flex: 1, paddingBottom: Space[1] },
  desc: {
    ...Type.body,
    color: Colors.ink4,
  },
  descCompleted: { color: Colors.ink1 },
  meta: {
    ...Type.caption,
    color: Colors.ink4,
    marginTop: Space[1],
  },
  subWrap: {
    marginTop: Space[2],
    gap: Space[2],
  },
  subRow: {
    flexDirection: 'row',
    gap: Space[2],
  },
  subDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 5,
    flexShrink: 0,
    backgroundColor: Colors.ink4,
  },
  subContent: { flex: 1 },
  subDesc: {
    ...Type.caption,
    color: Colors.ink3,
  },
});

// ── Fixed bottom action bar ────────────────────────────────────────────────────
const OrderActionBar: React.FC<{
  onHelp: () => void;
  bottomInset: number;
}> = ({ onHelp, bottomInset }) => (
  <View style={[barStyles.bar, { paddingBottom: bottomInset + Space[3] }]}>
    <TouchableOpacity
      style={barStyles.btn}
      activeOpacity={0.7}
      onPress={onHelp}
    >
      <Text style={barStyles.btnText}>Need Help</Text>
    </TouchableOpacity>
  </View>
);

const barStyles = StyleSheet.create({
  bar: {
    paddingHorizontal: Space.screenH,
    paddingTop: Space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.rule,
    backgroundColor: Colors.surface,
  },
  btn: {
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  btnText: {
    ...Type.bodyStrong,
    color: Colors.brandNavy,
  },
});

// ── Screen ─────────────────────────────────────────────────────────────────────
const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const route =
    useRoute<RouteProp<{ params: OrderDetailScreenRouteParams }, 'params'>>();
  const fallbackItem = route.params?.orderItem;
  const orderNumber = route.params?.orderNumber ?? fallbackItem?.OrderNumber;

  const {
    data: orderDetails,
    loading,
    isError,
    error,
    run,
  } = useAsyncState<OrderDetailResponseInterface>(null);

  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [cancelTarget, setCancelTarget] =
    useState<OrderDetailItemExtendedInterface | null>(null);
  const [selectedReason, setSelectedReason] =
    useState<CustomerCancellationReason | null>(null);
  const [selectedRefundMode, setSelectedRefundMode] =
    useState<RefundMode | null>(null);
  const [remarks, setRemarks] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);

  const [showReturnSheet, setShowReturnSheet] = useState(false);
  const [returnTarget, setReturnTarget] =
    useState<OrderDetailItemExtendedInterface | null>(null);
  const [selectedReturnReason, setSelectedReturnReason] =
    useState<number | null>(null);
  const [selectedReturnReasonLabel, setSelectedReturnReasonLabel] =
    useState<string>('');
  const [selectedReturnRefundMode, setSelectedReturnRefundMode] =
    useState<RefundMode | null>(null);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnSuccess, setReturnSuccess] = useState(false);

  const fetchOrderDetails = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (!userData) throw new Error('Session expired. Please log in again.');
        const user = JSON.parse(userData);
        return postCnfOrderDetail(
          String(orderNumber),
          user.CustomerProfileCode,
        );
      }, cancelled),
    [run, orderNumber],
  );

  React.useEffect(() => {
    if (!orderNumber) return;
    const cancelled = { current: false };
    fetchOrderDetails(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [fetchOrderDetails, orderNumber]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  }, [fetchOrderDetails]);

  const openCancelSheet = (item: OrderDetailItemExtendedInterface) => {
    const payment = orderDetails?.PaymentInfo;
    const cod =
      !!payment?.PaymentDetails?.CashOnDelivery?.[0]?.CollectionReference ||
      payment?.PaymentMode?.Code === PaymentModes.CashOnDelivery;
    setCancelTarget(item);
    setCancelError(null);
    setSelectedReason(null);
    setSelectedRefundMode(cod ? RefundMode.NO_REFUND : null);
    setRemarks('');
    haptic.light();
    setShowCancelSheet(true);
  };

  const openReturnSheet = (item: OrderDetailItemExtendedInterface) => {
    const payment = orderDetails?.PaymentInfo;
    const cod =
      !!payment?.PaymentDetails?.CashOnDelivery?.[0]?.CollectionReference ||
      payment?.PaymentMode?.Code === PaymentModes.CashOnDelivery;
    setReturnTarget(item);
    setReturnError(null);
    setSelectedReturnReason(null);
    setSelectedReturnReasonLabel('');
    setSelectedReturnRefundMode(cod ? RefundMode.NO_REFUND : null);
    setReturnRemarks('');
    haptic.light();
    setShowReturnSheet(true);
  };

  const toggleExpandItem = (itemId: string) => {
    setExpandedItemIds(current =>
      current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId],
    );
    haptic.light();
  };

  const handleConfirmCancel = async () => {
    if (
      !selectedReason ||
      !selectedRefundMode ||
      !cancelTarget ||
      !cancelTarget.SubOrder ||
      !orderNumber
    ) {
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
        CustomerProfileCode: user.CustomerProfileCode,
        CustomerPlatform:
          Platform.OS === 'ios'
            ? CustomerPlatform.IOS
            : CustomerPlatform.Android,
        OrderNumber: orderNumber,
        SubOrder: [
          {
            Id: cancelTarget.SubOrder.Code,
            InventoryId: cancelTarget.Inventory_Id,
          },
        ],
        CustomerCancellationReason: selectedReason,
        RefundMode: selectedRefundMode,
        Remarks: remarks.trim() || CancellationReasonLabel[selectedReason],
      });
      if (response?.statusCode !== 1) {
        setCancelError(
          response?.userMessage ?? 'Could not cancel. Please try again.',
        );
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

  const handleConfirmReturn = async () => {
    if (
      !selectedReturnReason ||
      !selectedReturnRefundMode ||
      !returnTarget ||
      !orderNumber
    ) {
      setReturnError('Please select a reason and a refund mode.');
      return;
    }
    try {
      setReturnLoading(true);
      setReturnError(null);
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      if (!raw) throw new Error('Session expired. Please log in again.');
      const user = JSON.parse(raw);
      const payment = orderDetails?.PaymentInfo;
      const cod =
        !!payment?.PaymentDetails?.CashOnDelivery?.[0]?.CollectionReference ||
        payment?.PaymentMode?.Code === PaymentModes.CashOnDelivery;
      const response = await postReturnRequest({
        CustomerProfileCode: user.CustomerProfileCode,
        OrderNumber: orderNumber,
        ReturnReasonType: selectedReturnReason,
        ReturnReasonRemark: returnRemarks.trim() || selectedReturnReasonLabel,
        OrderDetailsCode: returnTarget.OrderDetailsCode,
        OrderMasterCode: returnTarget.OrderMasterCode,
        ...(cod ? {} : { RefundMode: selectedReturnRefundMode }),
      });
      if (response?.statusCode !== 1) {
        setReturnError(
          response?.userMessage ?? 'Could not submit return. Please try again.',
        );
        return;
      }
      haptic.success();
      setShowReturnSheet(false);
      setReturnSuccess(true);
      fetchOrderDetails();
    } catch (err) {
      setReturnError(userFacingMessage(err));
    } finally {
      setReturnLoading(false);
    }
  };

  const headerAnim = useEntrance(0);
  const itemsAnim = useEntrance(80);
  const addressAnim = useEntrance(160);
  const paymentAnim = useEntrance(220);

  const displayDate =
    fallbackItem?.OrderedDate ??
    orderDetails?.OrderDetails[0]?.OrderedDate ??
    '';

  const Header = (
    <Animated.View style={headerAnim}>
      <DarkHeader
        eyebrow={
          displayDate
            ? `YOUR ORDER  ·  ${formatDate(displayDate)}`
            : 'YOUR ORDER'
        }
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
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.surface}
          translucent
        />
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

  if (isError) {
    return (
      <View style={styles.root}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.surface}
          translucent
        />
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

  // Loading state — show skeleton
  if (!orderDetails) {
    return (
      <View style={styles.root}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.surface}
          translucent
        />
        {Header}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <View style={styles.skeletonItemRow}>
              <Skeleton width={THUMB_W} height={THUMB_H} radius={Radius.sm} />
              <View style={{ flex: 1, gap: Space[2] }}>
                <Skeleton height={9} width="35%" />
                <Skeleton height={14} width="85%" />
                <Skeleton height={12} width="50%" />
              </View>
            </View>
            <View style={styles.skeletonItemRow}>
              <Skeleton width={THUMB_W} height={THUMB_H} radius={Radius.sm} />
              <View style={{ flex: 1, gap: Space[2] }}>
                <Skeleton height={9} width="40%" />
                <Skeleton height={14} width="70%" />
                <Skeleton height={12} width="45%" />
              </View>
            </View>
          </View>
          <View style={[styles.section, { marginTop: Space[6] }]}>
            <Skeleton
              height={9}
              width="25%"
              style={{ marginBottom: Space[4] }}
            />
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

  const items = orderDetails.OrderDetails;
  const delivery = orderDetails.DeliveryDetail;
  const orderedDate = items[0]?.OrderedDate ?? displayDate;

  // Group by sub-order (seller/fulfilment partner) — each seller manages their own
  // portion independently, so items can diverge in status once merchants act on
  // their part. A sub-order is NOT guaranteed to be a single physical package —
  // items within it can still ship separately, so avoid "shipment" language here.
  const sellerGroups: {
    number: string;
    items: OrderDetailItemExtendedInterface[];
  }[] = [];
  for (const item of items) {
    const number = item.SubOrder?.Number ?? '';
    let group = sellerGroups.find(g => g.number === number);
    if (!group) {
      group = { number, items: [] };
      sellerGroups.push(group);
    }
    group.items.push(item);
  }
  const isMultiSeller = sellerGroups.length > 1;

  const orderPayment = orderDetails.PaymentInfo;
  // MRP = sum of all item compare prices (original MRP before discounts)
  const mrp = items.reduce(
    (sum, it) => sum + (it.PricingDetails?.ComparePrice ?? 0) * it.Quantity,
    0,
  );
  const codReference =
    orderPayment.PaymentDetails?.CashOnDelivery?.[0]?.CollectionReference;
  // No refund method to choose when the order was never paid upfront —
  // COD is settled at delivery, so a cancellation before that has nothing
  // to refund and never reaches PaymentMode.Code, only PaymentDetails.CashOnDelivery.
  const isCOD =
    !!codReference || orderPayment.PaymentMode?.Code === PaymentModes.CashOnDelivery;

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface}
        translucent
      />
      {Header}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + ACTION_BAR_HEIGHT + Space[8] },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
          {isMultiSeller
            ? sellerGroups.map((group, gi) => (
                <View
                  key={group.number || gi}
                  style={gi > 0 ? styles.subOrderGroup : undefined}
                >
                  {group.items.map(item => {
                    const derivedStatus = currentOrderStatus(
                      item.OrderStatus,
                      item.Events,
                    );
                    const status = orderStatusLabel(derivedStatus);
                    const isCancellable =
                      CANCELLABLE_STATUSES.includes(derivedStatus);
                    const isReturnable =
                      derivedStatus === RETURNABLE_STATUS &&
                      !item.ReturnEligibility?.IsReturnWindowExpired;
                    const isExpanded = expandedItemIds.includes(
                      item.InventoryID.toString(),
                    );

                    return (
                      <OrderItemCard
                        key={`${item.InventoryID}`}
                        id={item.InventoryID.toString()}
                        image={item.Images.split(',')[0] ?? ''}
                        title={item.Name}
                        brandName={item.BrandName}
                        variantLabel={item.Variant}
                        quantity={item.Quantity}
                        price={item.PricingDetails?.GrossAmount ?? 0}
                        statusLabel={status}
                        isCancellable={isCancellable}
                        onCancel={() => openCancelSheet(item)}
                        isReturnable={isReturnable}
                        onReturn={() => openReturnSheet(item)}
                        expanded={isExpanded}
                        onToggle={toggleExpandItem}
                        renderTimeline={() => (
                          <ItemTimeline events={item.Events ?? []} />
                        )}
                      />
                    );
                  })}
                </View>
              ))
            : items.map(item => {
                const derivedStatus = currentOrderStatus(
                  item.OrderStatus,
                  item.Events,
                );
                const status = orderStatusLabel(derivedStatus);
                const isCancellable =
                  CANCELLABLE_STATUSES.includes(derivedStatus);
                const isReturnable =
                  derivedStatus === RETURNABLE_STATUS &&
                  !item.ReturnEligibility?.IsReturnWindowExpired;
                const isExpanded = expandedItemIds.includes(
                  item.InventoryID.toString(),
                );

                return (
                  <OrderItemCard
                    key={`${item.InventoryID}`}
                    id={item.InventoryID.toString()}
                    image={item.Images.split(',')[0] ?? ''}
                    title={item.Name}
                    brandName={item.BrandName}
                    variantLabel={item.Variant}
                    quantity={item.Quantity}
                    price={item.PricingDetails?.GrossAmount ?? 0}
                    statusLabel={status}
                    isCancellable={isCancellable}
                    onCancel={() => openCancelSheet(item)}
                    isReturnable={isReturnable}
                    onReturn={() => openReturnSheet(item)}
                    expanded={isExpanded}
                    onToggle={toggleExpandItem}
                    renderTimeline={() => (
                      <ItemTimeline events={item.Events ?? []} />
                    )}
                  />
                );
              })}
        </Animated.View>

        {/* ── Delivery address ── */}
        <Animated.View style={[styles.section, addressAnim]}>
          <Text style={styles.sectionEyebrow}>DELIVERING TO</Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressName}>{delivery.CustomerName}</Text>
            {[
              delivery.Address,
              delivery.StreetName,
              delivery.City,
              delivery.Zipcode,
            ].filter(Boolean).length > 0 ? (
              <Text style={styles.addressLine}>
                {[
                  delivery.Address,
                  delivery.StreetName,
                  delivery.City,
                  delivery.Zipcode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            ) : null}
            {delivery.MobileNumber ? (
              <Text style={styles.addressPhone}>
                {String(delivery.MobileNumber)}
              </Text>
            ) : null}
          </View>
        </Animated.View>

        {/* ── Payment summary ── */}
        <Animated.View style={[styles.section, paymentAnim]}>
          <Text style={styles.sectionEyebrow}>PAYMENT SUMMARY</Text>
          <DetailRow
            label="MRP"
            value={`Rs ${mrp.toLocaleString('en-IN')}`}
          />
          {orderPayment.TotalSaved && orderPayment.TotalSaved > 0 ? (
            <DetailRow
              label="YOU SAVE"
              value={`− Rs ${orderPayment.TotalSaved.toLocaleString('en-IN')}`}
            />
          ) : null}
          {orderPayment.DeliveryCharges > 0 ? (
            <DetailRow
              label="DELIVERY"
              value={`Rs ${orderPayment.DeliveryCharges.toLocaleString(
                'en-IN',
              )}`}
            />
          ) : orderPayment.isFreeShipping ? (
            <DetailRow label="DELIVERY" value="Free" />
          ) : null}
          {orderPayment.CouponAvailed ? (
            <DetailRow label="COUPON" value={orderPayment.CouponAvailed} />
          ) : null}

          {/* Tax Breakdown */}
          {orderPayment.TaxBreakdown && orderPayment.TaxBreakdown.length > 0 ? (
            <View style={styles.taxBreakdownSection}>
              <View style={styles.taxBreakdownDivider} />
              <Text style={styles.taxBreakdownTitle}>TAX BREAKDOWN</Text>
              {orderPayment.TaxBreakdown.map((taxItem, index) => (
                <View
                  key={`${taxItem.TaxId}-${index}`}
                  style={styles.taxBreakdownRow}
                >
                  <Text style={styles.taxBreakdownLabel}>{taxItem.TaxName}</Text>
                  <Text style={styles.taxBreakdownValue}>
                    Rs {taxItem.TaxAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <DetailRow
            label="TOTAL AMOUNT"
            value={`Rs ${orderPayment.AmountPaid.toLocaleString('en-IN')}`}
            isLast={!orderPayment.PaymentMode?.Description}
            emphasis
          />
          {orderPayment.PaymentMode?.Description ? (
            <DetailRow
              label="PAYMENT"
              value={orderPayment.PaymentMode.Description}
            />
          ) : null}
          {codReference ? (
            <DetailRow label="REFERENCE" value={codReference} isLast />
          ) : null}
        </Animated.View>
      </ScrollView>

      <OrderActionBar
        onHelp={() => navigation.navigate('HelpCenter')}
        bottomInset={insets.bottom}
      />

      {/* ── Cancel success modal ── */}
      <Modal
        visible={cancelSuccess}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Order Cancelled</Text>
            <Text style={styles.modalBody}>
              Your item has been cancelled successfully.
            </Text>
            <TouchableOpacity
              style={styles.modalCta}
              activeOpacity={0.8}
              onPress={() => {
                setCancelSuccess(false);
                (
                  navigation.navigate as (
                    screen: string,
                    params?: Record<string, unknown>,
                  ) => void
                )('MainTabs', { screen: 'Orders', params: { refresh: true } });
              }}
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
          showRefundMode={!isCOD}
          remarks={remarks}
          cancelError={cancelError}
          cancelLoading={cancelLoading}
          onSelectReason={reason => {
            haptic.light();
            setSelectedReason(reason);
          }}
          onSelectRefundMode={mode => {
            haptic.light();
            setSelectedRefundMode(mode);
          }}
          onChangeRemarks={setRemarks}
          onConfirm={handleConfirmCancel}
          onClose={() => setShowCancelSheet(false)}
        />
      )}

      {/* ── Return success modal ── */}
      <Modal
        visible={returnSuccess}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Return Requested</Text>
            <Text style={styles.modalBody}>
              Your return request has been submitted successfully.
            </Text>
            <TouchableOpacity
              style={styles.modalCta}
              activeOpacity={0.8}
              onPress={() => {
                setReturnSuccess(false);
                (
                  navigation.navigate as (
                    screen: string,
                    params?: Record<string, unknown>,
                  ) => void
                )('MainTabs', { screen: 'Orders', params: { refresh: true } });
              }}
            >
              <Text style={styles.modalCtaText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Return order sheet ── same rendering pattern as CancelOrderSheet above. */}
      {showReturnSheet && (
        <ReturnOrderSheet
          itemName={returnTarget?.Name}
          selectedReason={selectedReturnReason}
          selectedRefundMode={selectedReturnRefundMode}
          showRefundMode={!isCOD}
          remarks={returnRemarks}
          returnError={returnError}
          returnLoading={returnLoading}
          onSelectReason={(reason, description) => {
            haptic.light();
            setSelectedReturnReason(reason);
            setSelectedReturnReasonLabel(description);
          }}
          onSelectRefundMode={mode => {
            haptic.light();
            setSelectedReturnRefundMode(mode);
          }}
          onChangeRemarks={setReturnRemarks}
          onConfirm={handleConfirmReturn}
          onClose={() => setShowReturnSheet(false)}
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
  stateWrap: { flex: 1 },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: Space[8],
  },

  // ── Order meta strip ───────────────────────────────────────────────────────────
  metaStrip: {
    paddingHorizontal: Space.screenH,
    paddingVertical: Space[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  metaText: {
    ...Type.label,
    fontSize: 10,
    color: Colors.ink4,
    letterSpacing: 0.3,
  },

  // ── Section ────────────────────────────────────────────────────────────────────
  section: {
    marginTop: Space[4],
    marginHorizontal: Space.screenH,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: Space[4],
    paddingVertical: Space[2],
    ...Shadow.sm,
  },
  sectionEyebrow: {
    ...Type.label,
    color: Colors.ink4,
    paddingTop: Space[2],
    paddingBottom: Space[1],
  },
  subOrderGroup: {
    marginTop: Space[6],
    paddingTop: Space[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.rule,
  },

  // ── Skeleton ───────────────────────────────────────────────────────────────────
  skeletonItemRow: {
    flexDirection: 'row',
    gap: Space[3],
    paddingVertical: Space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },

  // ── Delivery address ───────────────────────────────────────────────────────────
  addressCard: {
    gap: Space[1],
    paddingTop: Space[2],
    paddingBottom: Space[4],
  },
  addressName: {
    fontFamily: FontFamily.serif,
    fontSize: 15,
    color: Colors.ink1,
    letterSpacing: -0.1,
    lineHeight: 15 * 1.35,
  },
  addressLine: {
    ...Type.caption,
    color: Colors.ink3,
    lineHeight: 18,
    marginTop: 2,
  },
  addressPhone: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.ink4,
    letterSpacing: 0.3,
    marginTop: 2,
  },

  // ── Cancel success modal ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Space.screenH,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Space[6],
    gap: Space[3],
  },
  modalTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 22,
    color: Colors.ink1,
    letterSpacing: -0.3,
  },
  modalBody: {
    ...Type.body,
    color: Colors.ink3,
    lineHeight: 22,
  },
  modalCta: {
    marginTop: Space[2],
    backgroundColor: Colors.ink1,
    borderRadius: Radius.pill,
    paddingVertical: Space[4],
    alignItems: 'center',
  },
  modalCtaText: {
    ...Type.bodyStrong,
    color: Colors.surface,
  },

  // Tax Breakdown Section
  taxBreakdownSection: {
    gap: Space[2],
  },
  taxBreakdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  taxBreakdownTitle: {
    ...Type.label,
    color: Colors.ink4,
    fontSize: 10,
    marginTop: Space[1],
  },
  taxBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Space[1],
  },
  taxBreakdownLabel: {
    fontSize: 12,
    color: Colors.ink4,
    flex: 1,
  },
  taxBreakdownValue: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.ink4,
  },
});

export default OrderDetailScreen;
