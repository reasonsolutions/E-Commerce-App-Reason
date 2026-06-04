import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useHaptic } from '../hooks/useHaptic';
import { FadeImage, PrimaryButton, TextLinkButton } from '../components/ui';
import { formatOrderTimestamp } from '../utils/formatOrderTimestamp';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Thumbnail dimensions ──────────────────────────────────────────────────────
const THUMB_SIZE    = 48;
const THUMB_RADIUS  = Radius.sm;
const MAX_THUMBS    = 3;

// ── Animation delays (ms) ────────────────────────────────────────────────────
const DELAY = {
  mark:        0,
  headline:  400,
  snapshot:  600,
  address:   700,
  orderNum:  800,
  ctas:      960,
} as const;

// ── Route param types ────────────────────────────────────────────────────────
interface CartItemParam {
  name:     string;
  quantity: number;
  price:    number;
  image:    string;
}

interface DeliveryAddressParam {
  street: string;
  city:   string;
}

type OrderSuccessParams = {
  orderNumber?:     string;
  itemCount?:       number;
  orderTotal?:      number;
  orderCurrency?:   string;
  orderTimestamp?:  string | null;
  orderStatus?:     number | null;
  deliveryAddress?: DeliveryAddressParam | null;
  cartItems?:       CartItemParam[];
};

type NavigationProp = {
  navigate: {
    (screen: string): void;
    (screen: string, params: Record<string, any>): void;
  };
  goBack: () => void;
};

type OrderSuccessScreenProps = {
  navigation: NavigationProp;
  route: {
    params?: OrderSuccessParams;
  };
};

// ── Progress dot row — 3 steps: New, Processing, Shipped ─────────────────────
const STATUS_STEPS = ['New', 'Processing', 'Shipped'] as const;

const StatusDots: React.FC<{ orderStatus: number }> = ({ orderStatus }) => {
  // Status codes: 1=New, 2=Confirmed, 3=Processing, 4=Fulfilled, 5=Shipped
  // Map to 3-dot display: step 0 (New) ≤ 2, step 1 (Processing) ≤ 4, step 2 (Shipped) = 5
  const filled = orderStatus <= 2 ? 1 : orderStatus <= 4 ? 2 : 3;
  return (
    <View style={statusStyles.row}>
      {STATUS_STEPS.map((label, i) => {
        const isActive  = i === filled - 1;
        const isPast    = i < filled - 1;
        const isFuture  = i >= filled;
        return (
          <View key={label} style={statusStyles.stepWrap}>
            <View style={[
              statusStyles.segment,
              isPast   && statusStyles.segmentPast,
              isActive && statusStyles.segmentActive,
              isFuture && statusStyles.segmentFuture,
            ]} />
            <Text style={[
              statusStyles.stepLabel,
              isActive && statusStyles.stepLabelActive,
            ]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const statusStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap:           Space[3],
    width:         '100%',
    marginBottom:  Space[2],
  },
  stepWrap: {
    flex:      1,
    alignItems: 'center',
    gap:        Space[1] + 1,
  },
  segment: {
    width:        '100%',
    height:       3,
    borderRadius: 2,
  },
  segmentPast: {
    backgroundColor: Colors.ink3,
  },
  segmentActive: {
    backgroundColor: Colors.accent,
  },
  segmentFuture: {
    backgroundColor: Colors.rule,
  },
  stepLabel: {
    fontFamily:    FontFamily.mono,
    fontSize:      9,
    letterSpacing: 0.3,
    color:         Colors.ink4,
    textAlign:     'center',
  },
  stepLabelActive: {
    color: Colors.accent,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────
const OrderSuccessScreen: React.FC<OrderSuccessScreenProps> = ({ navigation, route }) => {
  const params          = route.params ?? {};
  const orderNumber     = params.orderNumber;
  const itemCount       = params.itemCount     ?? 0;
  const orderTotal      = params.orderTotal    ?? 0;
  const orderTimestamp  = params.orderTimestamp ?? null;
  const orderStatus     = params.orderStatus   ?? null;
  const deliveryAddress = params.deliveryAddress ?? null;
  const cartItems       = params.cartItems ?? [];

  const haptic = useHaptic();

  // ── Computed display values ──────────────────────────────────────────────────
  const displayTotal = `Rs ${orderTotal.toFixed(0)}`;
  const displayTimestamp = formatOrderTimestamp(orderTimestamp);
  const itemLabel        = itemCount === 1 ? '1 item' : `${itemCount} items`;

  // City shown prominently; street as secondary context if city is missing
  const addressLine = deliveryAddress
    ? (deliveryAddress.city || deliveryAddress.street || null)
    : null;
  const addressDetail = deliveryAddress?.city && deliveryAddress?.street
    ? deliveryAddress.street
    : null;

  const visibleThumbs  = cartItems.slice(0, MAX_THUMBS);
  const extraCount     = cartItems.length > MAX_THUMBS ? cartItems.length - MAX_THUMBS : 0;
  const hasImages      = visibleThumbs.some(i => !!i.image);
  const showSnapshot   = itemCount > 0 || orderTotal > 0;
  const showThumbs     = hasImages && visibleThumbs.length > 0;
  const showStatus     = typeof orderStatus === 'number' && orderStatus >= 1;

  // ── Animation values ─────────────────────────────────────────────────────────
  const RING_R        = 34;
  const CIRCUMFERENCE = 2 * Math.PI * RING_R;

  const strokeOffset = useRef(new Animated.Value(CIRCUMFERENCE)).current;
  const markOpacity  = useRef(new Animated.Value(0)).current;

  const headlineAnim = useRef(new Animated.Value(0)).current;
  const snapshotAnim = useRef(new Animated.Value(0)).current;
  const addressAnim  = useRef(new Animated.Value(0)).current;
  const orderNumAnim = useRef(new Animated.Value(0)).current;
  const ctasAnim     = useRef(new Animated.Value(0)).current;

  const makeSettle = (val: Animated.Value, delay: number) =>
    Animated.timing(val, {
      toValue:         1,
      delay,
      duration:        Motion.duration.settle,
      easing:          Motion.easing.out,
      useNativeDriver: true,
    });

  useEffect(() => {
    Animated.timing(strokeOffset, {
      toValue:         0,
      duration:        Motion.duration.carry,
      delay:           DELAY.mark,
      easing:          Motion.easing.inOut,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(markOpacity, {
        toValue:         1,
        duration:        Motion.duration.tap,
        easing:          Motion.easing.out,
        useNativeDriver: true,
      }).start();
      haptic.success();
    });

    Animated.parallel([
      makeSettle(headlineAnim, DELAY.headline),
      makeSettle(snapshotAnim, DELAY.snapshot),
      makeSettle(addressAnim,  DELAY.address),
      makeSettle(orderNumAnim, DELAY.orderNum),
      makeSettle(ctasAnim,     DELAY.ctas),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blockStyle = (anim: Animated.Value, initialY = 10) => ({
    opacity:   anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [initialY, 0] }) }],
  });

  const handleViewOrders = useCallback(() => {
    navigation.navigate('Orders');
  }, [navigation]);

  const handleContinueShopping = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* ── Success mark ──────────────────────────────────────────────── */}
        <View style={styles.markWrap}>
          <View style={styles.ringWrap}>
            <View style={styles.ringFill} />
            <Svg width={72} height={72} style={StyleSheet.absoluteFill}>
              <AnimatedCircle
                cx={36}
                cy={36}
                r={RING_R}
                fill="none"
                stroke={Colors.accent}
                strokeWidth={1.5}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                transform="rotate(-90, 36, 36)"
              />
            </Svg>
            <Animated.Text style={[styles.markChar, { opacity: markOpacity }]}>
              ✓
            </Animated.Text>
          </View>
        </View>

        {/* ── Headline ─────────────────────────────────────────────────── */}
        <Animated.View style={[styles.headlineBlock, blockStyle(headlineAnim, 14)]}>
          <Text style={styles.headline}>Order placed.</Text>
          <Text style={styles.subline}>Your order is on the way</Text>
        </Animated.View>

        {/* ── Order snapshot card ──────────────────────────────────────── */}
        {showSnapshot ? (
          <Animated.View style={[styles.snapshotBlock, blockStyle(snapshotAnim, 10)]}>
            <View style={styles.snapshotCard}>
              {/* Meta: item count · timestamp */}
              <View style={styles.snapshotMeta}>
                {itemCount > 0 ? (
                  <Text style={styles.snapshotMetaText}>{itemLabel}</Text>
                ) : null}
                {itemCount > 0 && displayTimestamp ? (
                  <Text style={styles.snapshotMetaDot}>·</Text>
                ) : null}
                {displayTimestamp ? (
                  <Text style={styles.snapshotMetaText}>Placed {displayTimestamp}</Text>
                ) : null}
              </View>

              {/* Order total */}
              {orderTotal > 0 ? (
                <Text style={styles.snapshotTotal}>{displayTotal}</Text>
              ) : null}

              {/* Thumbnail strip — only when real images are available */}
              {showThumbs ? (
                <View style={styles.thumbRow}>
                  {visibleThumbs.map((item, i) => (
                    <View key={i} style={styles.thumbWrap}>
                      <FadeImage
                        uri={item.image}
                        width={THUMB_SIZE}
                        height={THUMB_SIZE}
                        borderRadius={THUMB_RADIUS}
                      />
                    </View>
                  ))}
                  {extraCount > 0 ? (
                    <View style={styles.thumbExtra}>
                      <Text style={styles.thumbExtraText}>+{extraCount}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        {/* ── Delivery address ─────────────────────────────────────────── */}
        {deliveryAddress ? (
          <Animated.View style={[styles.infoBlock, blockStyle(addressAnim, 10)]}>
            <View style={styles.infoRule} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>DELIVERING TO</Text>
              <View style={styles.infoValueStack}>
                <Text style={styles.infoValuePrimary} numberOfLines={1}>
                  {addressLine || 'Address not available'}
                </Text>
                {addressDetail ? (
                  <Text style={styles.infoValueSecondary} numberOfLines={1}>
                    {addressDetail}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.infoRule} />
          </Animated.View>
        ) : null}

        {/* ── Order number ─────────────────────────────────────────────── */}
        {orderNumber ? (
          <Animated.View style={[styles.infoBlock, blockStyle(orderNumAnim, 10)]}>
            {!deliveryAddress ? <View style={styles.infoRule} /> : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ORDER</Text>
              <Text style={styles.orderNumber}>#{orderNumber}</Text>
            </View>
            <View style={styles.infoRule} />
          </Animated.View>
        ) : null}

        {/* ── Status timeline ──────────────────────────────────────────── */}
        {showStatus ? (
          <Animated.View style={[styles.statusBlock, blockStyle(orderNumAnim, 10)]}>
            <StatusDots orderStatus={orderStatus!} />
          </Animated.View>
        ) : null}

        {/* ── CTAs ─────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.ctasBlock, blockStyle(ctasAnim, 10)]}>
          <PrimaryButton
            label="View My Orders"
            onPress={handleViewOrders}
            accessibilityLabel="View my orders"
          />
          <TextLinkButton
            label="Continue Shopping"
            onPress={handleContinueShopping}
            accessibilityLabel="Continue shopping"
          />
        </Animated.View>

        {/* ── Support link ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.supportLink}
          onPress={handleViewOrders}
          activeOpacity={0.6}
          accessibilityRole="link"
        >
          <Text style={styles.supportText}>
            Can't find your order? View order details
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    flexGrow:          1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[10],
  },

  // ── Mark ─────────────────────────────────────────────────────────────────────
  markWrap: {
    marginBottom: Space[8] + Space[2],
    alignItems:   'center',
  },
  ringWrap: {
    width:          72,
    height:         72,
    alignItems:     'center',
    justifyContent: 'center',
  },
  ringFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.accentTint,
  },
  markChar: {
    fontFamily: FontFamily.serifItalic,
    fontSize:   28,
    color:      Colors.accent,
    lineHeight: 32,
    marginTop:  2,
  },

  // ── Headline ─────────────────────────────────────────────────────────────────
  headlineBlock: {
    alignItems:   'center',
    marginBottom: Space[8],
    width:        '100%',
  },
  headline: {
    ...Type.title,
    fontSize:      30,
    letterSpacing: -0.6,
    color:         Colors.ink1,
    textAlign:     'center',
    marginBottom:  Space[2] + 2,
  },
  subline: {
    ...Type.body,
    color:      Colors.ink3,
    textAlign:  'center',
    lineHeight: 16 * 1.55,
  },

  // ── Order snapshot ────────────────────────────────────────────────────────────
  snapshotBlock: {
    width:        '100%',
    marginBottom: Space[5],
  },
  snapshotCard: {
    backgroundColor: Colors.surfaceSoft,
    borderRadius:    Radius.md,
    padding:         Space[5],
  },
  snapshotMeta: {
    flexDirection:  'row',
    alignItems:     'center',
    flexWrap:       'wrap',
    gap:            Space[1] + 1,
    marginBottom:   Space[2],
  },
  snapshotMetaText: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    color:         Colors.ink4,
    letterSpacing: 0.3,
  },
  snapshotMetaDot: {
    fontFamily: FontFamily.mono,
    fontSize:   11,
    color:      Colors.ink5,
  },
  snapshotTotal: {
    fontFamily:    FontFamily.serif,
    fontSize:      28,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.6,
    marginBottom:  Space[4],
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
  },
  thumbWrap: {
    borderRadius: THUMB_RADIUS,
    overflow:     'hidden',
  },
  thumbExtra: {
    width:           THUMB_SIZE,
    height:          THUMB_SIZE,
    borderRadius:    THUMB_RADIUS,
    backgroundColor: Colors.surfaceDeep,
    alignItems:      'center',
    justifyContent:  'center',
  },
  thumbExtraText: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    color:         Colors.ink3,
    letterSpacing: 0.2,
  },

  // ── Info rows (address + order number share this style) ───────────────────────
  infoBlock: {
    width:        '100%',
    marginBottom: 0,
  },
  infoRule: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  infoRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'flex-start',
    paddingVertical: Space[4],
    gap:             Space[4],
  },
  infoLabel: {
    ...Type.label,
    color:      Colors.ink3,
    flexShrink: 0,
    paddingTop: 2,
  },
  infoValueStack: {
    flex:      1,
    alignItems: 'flex-end',
    gap:        2,
  },
  infoValuePrimary: {
    fontFamily:    FontFamily.sans,
    fontSize:      14,
    fontWeight:    '500',
    color:         Colors.ink1,
    textAlign:     'right',
    letterSpacing: 0.1,
  },
  infoValueSecondary: {
    ...Type.caption,
    color:     Colors.ink4,
    textAlign: 'right',
  },
  orderNumber: {
    fontFamily:    FontFamily.mono,
    fontSize:      15,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: 0.8,
  },

  // ── Status timeline ───────────────────────────────────────────────────────────
  statusBlock: {
    width:        '100%',
    marginTop:    Space[5],
    marginBottom: Space[2],
  },

  // ── CTAs ──────────────────────────────────────────────────────────────────────
  ctasBlock: {
    width:     '100%',
    gap:       Space[2],
    marginTop: Space[8],
  },
  // ── Support link ──────────────────────────────────────────────────────────────
  supportLink: {
    marginTop:       Space[6],
    paddingVertical: Space[2],
    alignItems:      'center',
  },
  supportText: {
    ...Type.caption,
    color:         Colors.ink4,
    textAlign:     'center',
    letterSpacing: 0.1,
  },
});

export default OrderSuccessScreen;
