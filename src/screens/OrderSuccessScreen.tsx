import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
  ScrollView,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import Icon from 'react-native-vector-icons/Ionicons';
import { useHaptic } from '../hooks/useHaptic';
import { FadeImage } from '../components/ui';
import { useTactile } from '../hooks/useTactile';
import { formatOrderTimestamp } from '../utils/formatOrderTimestamp';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const THUMB_SIZE = 72;
const THUMB_RADIUS = Radius.md;
const MAX_THUMBS = 3;

const RING_R = 36;
const RING_SIZE = 88;
const RING_CX = RING_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

const DELAY = {
  mark: 0,
  hero: 340,
  order: 520,
  address: 640,
  ctas: 760,
} as const;

interface CartItemParam {
  name: string;
  quantity: number;
  price: number;
  comparePrice?: number;
  image: string;
}

interface DeliveryAddressParam {
  street: string;
  city: string;
}

type OrderSuccessParams = {
  orderNumber?: string;
  itemCount?: number;
  orderTotal?: number;
  orderTotalBeforeDiscount?: number;
  orderCurrency?: string;
  orderTimestamp?: string | null;
  orderStatus?: number | null;
  paymentMethod?: string | null;
  deliveryAddress?: DeliveryAddressParam | null;
  cartItems?: CartItemParam[];
};

type NavigationProp = {
  navigate: (screen: string, params?: Record<string, any>) => void;
  replace: (screen: string, params?: Record<string, any>) => void;
  goBack: () => void;
};

type Props = {
  navigation: NavigationProp;
  route: { params?: OrderSuccessParams };
};

// ── Screen ───────────────────────────────────────────────────────────────────
const OrderSuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const p = route.params ?? {};

  const orderNumber = p.orderNumber ?? '';
  const itemCount = p.itemCount ?? 0;
  const orderTotal = p.orderTotal ?? 0;
  const orderTotalBeforeDiscount = p.orderTotalBeforeDiscount ?? orderTotal;
  const orderTimestamp = p.orderTimestamp ?? null;
  const paymentMethod = p.paymentMethod ?? null;
  const deliveryAddress = p.deliveryAddress ?? null;
  const cartItems = p.cartItems ?? [];

  const haptic = useHaptic();
  const ctaTactile = useTactile();

  // ── Computed ──────────────────────────────────────────────────────────────
  const shortOrder = orderNumber
    ? orderNumber.replace(/^ORDNO_\d{6}/, '#').replace(/^ORDNO_/, '#')
    : '';

  const displayTotal =
    orderTotal > 0 ? `MUR ${orderTotal.toLocaleString('en-IN')}` : null;

  const displayTime = formatOrderTimestamp(orderTimestamp);

  const totalSavings =
    orderTotalBeforeDiscount > orderTotal
      ? orderTotalBeforeDiscount - orderTotal
      : 0;

  const metaParts: string[] = [];
  if (itemCount > 0)
    metaParts.push(itemCount === 1 ? '1 item' : `${itemCount} items`);
  if (displayTime) metaParts.push(displayTime);
  const metaLine = metaParts.join('  ·  ');

  const addrLines: string[] = [];
  if (deliveryAddress?.street) addrLines.push(deliveryAddress.street);
  if (deliveryAddress?.city) addrLines.push(deliveryAddress.city);

  const imageItems = cartItems.filter(i => !!i.image);
  const visibleThumbs = imageItems.slice(0, MAX_THUMBS);
  const extraCount = imageItems.length - visibleThumbs.length;
  const hasThumbs = visibleThumbs.length > 0;
  const showOrder = hasThumbs || !!metaLine || !!paymentMethod;
  const showAddress = addrLines.length > 0;

  // ── Animations ────────────────────────────────────────────────────────────
  const strokeOffset = useRef(new Animated.Value(CIRCUMFERENCE)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;
  const [showMark, setShowMark] = useState(false);
  const heroAnim = useRef(new Animated.Value(0)).current;
  const orderAnim = useRef(new Animated.Value(0)).current;
  const addressAnim = useRef(new Animated.Value(0)).current;
  const ctasAnim = useRef(new Animated.Value(0)).current;

  const settle = (val: Animated.Value, delay: number) =>
    Animated.timing(val, {
      toValue: 1,
      delay,
      duration: Motion.duration.settle,
      easing: Motion.easing.out,
      useNativeDriver: true,
    });

  useEffect(() => {
    Animated.timing(strokeOffset, {
      toValue: 0,
      duration: Motion.duration.carry,
      delay: DELAY.mark,
      easing: Motion.easing.inOut,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(markOpacity, {
        toValue: 1,
        duration: Motion.duration.tap,
        easing: Motion.easing.out,
        useNativeDriver: true,
      }).start();
      setShowMark(true);
      haptic.success();
    });
    Animated.parallel([
      settle(heroAnim, DELAY.hero),
      settle(orderAnim, DELAY.order),
      settle(addressAnim, DELAY.address),
      settle(ctasAnim, DELAY.ctas),
    ]).start();

    // Safety net: strokeDashoffset isn't a standard native-driver property,
    // so its animation can finish on the JS side (firing this callback and
    // the haptic) without the native paint ever landing — leaving the
    // checkmark stranded. Mutating markOpacity directly has the same failure
    // mode (no guaranteed repaint), so force a real React re-render instead,
    // which is guaranteed to commit.
    const markTimer = setTimeout(() => {
      markOpacity.setValue(1);
      setShowMark(true);
    }, DELAY.mark + Motion.duration.carry + Motion.duration.tap);
    return () => clearTimeout(markTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fade = (anim: Animated.Value, dy = 12) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [dy, 0],
        }),
      },
    ],
  });

  // replace (not navigate) — removes OrderSuccess from the stack instead of
  // pushing MainTabs on top of it. Otherwise MainTabs ends up ABOVE
  // OrderSuccess in the stack, and swiping back from Orders/Home lands back
  // on the (already-used) order confirmation screen.
  const handleTrackOrder = useCallback(
    () =>
      navigation.replace('MainTabs', {
        screen: 'Orders',
        params: { refresh: true },
      }),
    [navigation],
  );
  const handleContinueShopping = useCallback(
    () => navigation.replace('MainTabs', { screen: 'Home' }),
    [navigation],
  );

  // Android hardware back would otherwise pop into Cart/Address underneath —
  // re-entering an already-used checkout flow for a completed order. Redirect
  // to Home instead, same as the Continue Shopping CTA. iOS swipe-back is
  // separately disabled via gestureEnabled: false in AppNavigator.js.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleContinueShopping();
        return true;
      });
      return () => sub.remove();
    }, [handleContinueShopping]),
  );

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Hero — open, no card, full bleed on surface ─────────────────── */}
        <Animated.View style={[s.hero, fade(heroAnim, 20)]}>
          {/* Mark */}
          <View style={s.ringWrap}>
            <View style={s.ringFill} />
            <Svg
              width={RING_SIZE}
              height={RING_SIZE}
              style={StyleSheet.absoluteFill}
            >
              <AnimatedCircle
                cx={RING_CX}
                cy={RING_CX}
                r={RING_R}
                fill="none"
                stroke={Colors.brandNavy}
                strokeWidth={2}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                transform={`rotate(-90, ${RING_CX}, ${RING_CX})`}
              />
            </Svg>
            {showMark ? (
              <Animated.View style={{ opacity: markOpacity }}>
                <Icon name="checkmark" size={26} color={Colors.brandNavy} />
              </Animated.View>
            ) : null}
          </View>

          {/* Confirmation text */}
          <Text style={s.headline}>Order Confirmed</Text>
          <Text style={s.subline}>Thank you for shopping with us.</Text>

          {/* Total — the emotional number, lives in the hero */}
          {displayTotal ? (
            <View style={s.totalBlock}>
              <Text style={s.totalAmount}>{displayTotal}</Text>
              {shortOrder ? (
                <Text style={s.totalOrderNum}>{shortOrder}</Text>
              ) : null}
              {totalSavings > 0 ? (
                <Text style={s.savings}>
                  Saved MUR {totalSavings.toLocaleString('en-IN')}
                </Text>
              ) : null}
            </View>
          ) : null}
        </Animated.View>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        {showOrder || showAddress ? <View style={s.rule} /> : null}

        {/* ── Order card — images + meta ───────────────────────────────────── */}
        {showOrder ? (
          <Animated.View style={[s.card, fade(orderAnim)]}>
            {hasThumbs ? (
              <View style={s.thumbRow}>
                {visibleThumbs.map((item, i) => (
                  <View key={`${item.name}-${i}`} style={s.thumbWrap}>
                    <FadeImage
                      uri={item.image}
                      width={THUMB_SIZE}
                      height={THUMB_SIZE}
                      borderRadius={THUMB_RADIUS}
                    />
                  </View>
                ))}
                {extraCount > 0 ? (
                  <View style={[s.thumbWrap, s.overflowBadge]}>
                    <Text style={s.overflowText}>+{extraCount}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={s.orderMeta}>
              {metaLine ? <Text style={s.meta}>{metaLine}</Text> : null}
              {paymentMethod ? (
                <Text style={s.payment}>{paymentMethod}</Text>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        {/* ── Address card ─────────────────────────────────────────────────── */}
        {showAddress ? (
          <Animated.View style={[s.card, fade(addressAnim)]}>
            <View style={s.addrHeader}>
              <Icon
                name="location-outline"
                size={15}
                color={Colors.brandNavy}
              />
              <Text style={s.addrHeaderText}>Delivering To</Text>
            </View>
            {addrLines.map((line, i) => (
              <Text
                key={i}
                style={i === 0 ? s.addrPrimary : s.addrSecondary}
                numberOfLines={2}
              >
                {line}
              </Text>
            ))}
          </Animated.View>
        ) : null}

        {/* ── CTAs ────────────────────────────────────────────────────────── */}
        <Animated.View style={[s.ctasBlock, fade(ctasAnim)]}>
          <Animated.View style={ctaTactile.animatedStyle}>
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={handleTrackOrder}
              {...ctaTactile.handlers}
              activeOpacity={1}
              accessibilityRole="button"
            >
              <Text style={s.primaryBtnText}>Track Order</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={s.tertiaryBtn}
            onPress={handleContinueShopping}
            activeOpacity={0.6}
            accessibilityRole="button"
          >
            <Text style={s.tertiaryBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Space.screenH,
    paddingTop: Space[6],
    paddingBottom: Space[10],
    gap: Space[4],
  },

  // ── Hero — open, tinted warm patch behind it ──────────────────────────────
  hero: {
    backgroundColor: '#F1EEE7',
    borderRadius: 24,
    padding: Space[5],
    paddingBottom: Space[6],
    gap: Space[2],
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space[2],
  },
  ringFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.pill,
    backgroundColor: Colors.brandNavyTint,
  },
  headline: {
    fontFamily: FontFamily.sans,
    fontSize: 26,
    fontWeight: '700',
    color: Colors.ink1,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  subline: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    color: Colors.ink3,
    lineHeight: 20,
  },
  totalBlock: {
    marginTop: Space[4],
    gap: Space[1],
  },
  totalAmount: {
    fontFamily: FontFamily.sans,
    fontSize: 36,
    fontWeight: '700',
    color: Colors.ink1,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  totalOrderNum: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.ink4,
    letterSpacing: 0.8,
  },
  savings: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: Space[1],
  },

  // ── Hairline rule ──────────────────────────────────────────────────────────
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── Cards — white, float above warm surface ────────────────────────────────
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceDeep,
    padding: Space[5],
    gap: Space[3],
  },

  // ── Order thumbnails ──────────────────────────────────────────────────────
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space[2],
  },
  thumbWrap: {
    backgroundColor: Colors.surfaceSoft,
    borderRadius: THUMB_RADIUS,
    overflow: 'hidden',
  },
  overflowBadge: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: Colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink3,
    letterSpacing: 0.1,
  },

  // ── Order meta group ───────────────────────────────────────────────────────
  orderMeta: {
    gap: Space[1],
  },
  meta: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    color: Colors.ink2,
    lineHeight: 20,
  },
  payment: {
    ...Type.caption,
    color: Colors.ink4,
  },

  // ── Address ────────────────────────────────────────────────────────────────
  addrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[1],
  },
  addrHeaderText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink3,
    letterSpacing: 0.2,
  },
  addrPrimary: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    color: Colors.ink1,
    lineHeight: 20,
  },
  addrSecondary: {
    ...Type.caption,
    color: Colors.ink4,
    lineHeight: 17,
  },

  // ── CTAs ───────────────────────────────────────────────────────────────────
  ctasBlock: {
    gap: Space[3],
    marginTop: Space[1],
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    ...Type.bodyStrong,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  tertiaryBtn: {
    alignItems: 'center',
    paddingVertical: Space[2],
  },
  tertiaryBtnText: {
    ...Type.caption,
    color: Colors.ink4,
  },
});

export default OrderSuccessScreen;
