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
import Icon from 'react-native-vector-icons/Ionicons';
import { useHaptic } from '../hooks/useHaptic';
import { FadeImage } from '../components/ui';
import { useTactile } from '../hooks/useTactile';
import { formatOrderTimestamp } from '../utils/formatOrderTimestamp';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HERO_IMG_SIZE = 112;
const THUMB_RADIUS  = Radius.md;

const RING_R        = 36;
const RING_SIZE     = 88;
const RING_CX       = RING_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

const DELAY = {
  mark:    0,
  hero:    340,
  order:   520,
  address: 640,
  ctas:    760,
} as const;

interface CartItemParam {
  name:          string;
  quantity:      number;
  price:         number;
  comparePrice?: number;
  image:         string;
}

interface DeliveryAddressParam {
  street: string;
  city:   string;
}

type OrderSuccessParams = {
  orderNumber?:              string;
  itemCount?:                number;
  orderTotal?:               number;
  orderTotalBeforeDiscount?: number;
  orderCurrency?:            string;
  orderTimestamp?:           string | null;
  orderStatus?:              number | null;
  paymentMethod?:            string | null;
  deliveryAddress?:          DeliveryAddressParam | null;
  cartItems?:                CartItemParam[];
};

type NavigationProp = {
  navigate: (screen: string, params?: Record<string, any>) => void;
  goBack:   () => void;
};

type Props = {
  navigation: NavigationProp;
  route:      { params?: OrderSuccessParams };
};

// ── Screen ───────────────────────────────────────────────────────────────────
const OrderSuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const p = route.params ?? {};

  const orderNumber              = p.orderNumber ?? '';
  const itemCount                = p.itemCount   ?? 0;
  const orderTotal               = p.orderTotal  ?? 0;
  const orderTotalBeforeDiscount = p.orderTotalBeforeDiscount ?? orderTotal;
  const orderTimestamp           = p.orderTimestamp ?? null;
  const paymentMethod            = p.paymentMethod ?? null;
  const deliveryAddress          = p.deliveryAddress ?? null;
  const cartItems                = p.cartItems ?? [];

  const haptic        = useHaptic();
  const ctaTactile    = useTactile();
  const ordersTactile = useTactile();

  // ── Computed ──────────────────────────────────────────────────────────────
  const shortOrder = orderNumber
    ? orderNumber.replace(/^ORDNO_\d{6}/, '#').replace(/^ORDNO_/, '#')
    : '';

  const displayTotal = orderTotal > 0
    ? `Rs ${orderTotal.toLocaleString('en-IN')}` : null;

  const displayTime = formatOrderTimestamp(orderTimestamp);

  const totalSavings = orderTotalBeforeDiscount > orderTotal
    ? orderTotalBeforeDiscount - orderTotal : 0;

  const metaParts: string[] = [];
  if (itemCount > 0) metaParts.push(itemCount === 1 ? '1 item' : `${itemCount} items`);
  if (displayTime)   metaParts.push(displayTime);
  const metaLine = metaParts.join('  ·  ');

  const addrLines: string[] = [];
  if (deliveryAddress?.street) addrLines.push(deliveryAddress.street);
  if (deliveryAddress?.city)   addrLines.push(deliveryAddress.city);

  const heroItem    = cartItems.find(i => !!i.image) ?? cartItems[0] ?? null;
  const extraCount  = heroItem && cartItems.length > 1 ? cartItems.length - 1 : 0;
  const hasHeroImg  = !!heroItem?.image;
  const showOrder   = hasHeroImg || !!metaLine || !!paymentMethod;
  const showAddress   = addrLines.length > 0;

  // ── Animations ────────────────────────────────────────────────────────────
  const strokeOffset = useRef(new Animated.Value(CIRCUMFERENCE)).current;
  const markOpacity  = useRef(new Animated.Value(0)).current;
  const heroAnim     = useRef(new Animated.Value(0)).current;
  const orderAnim    = useRef(new Animated.Value(0)).current;
  const addressAnim  = useRef(new Animated.Value(0)).current;
  const ctasAnim     = useRef(new Animated.Value(0)).current;

  const settle = (val: Animated.Value, delay: number) =>
    Animated.timing(val, {
      toValue: 1, delay, duration: Motion.duration.settle,
      easing: Motion.easing.out, useNativeDriver: true,
    });

  useEffect(() => {
    Animated.timing(strokeOffset, {
      toValue: 0, duration: Motion.duration.carry, delay: DELAY.mark,
      easing: Motion.easing.inOut, useNativeDriver: true,
    }).start(() => {
      Animated.timing(markOpacity, {
        toValue: 1, duration: Motion.duration.tap,
        easing: Motion.easing.out, useNativeDriver: true,
      }).start();
      haptic.success();
    });
    Animated.parallel([
      settle(heroAnim,    DELAY.hero),
      settle(orderAnim,   DELAY.order),
      settle(addressAnim, DELAY.address),
      settle(ctasAnim,    DELAY.ctas),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fade = (anim: Animated.Value, dy = 12) => ({
    opacity:   anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }],
  });

  const handleTrackOrder       = useCallback(() => navigation.navigate('Orders'), [navigation]);
  const handleViewOrders       = useCallback(() => navigation.navigate('Orders'), [navigation]);
  const handleContinueShopping = useCallback(() => navigation.navigate('Home'),   [navigation]);

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
            <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
              <AnimatedCircle
                cx={RING_CX} cy={RING_CX} r={RING_R}
                fill="none"
                stroke={Colors.accent}
                strokeWidth={2}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                transform={`rotate(-90, ${RING_CX}, ${RING_CX})`}
              />
            </Svg>
            <Animated.Text style={[s.markChar, { opacity: markOpacity }]}>✓</Animated.Text>
          </View>

          {/* Confirmation text */}
          <Text style={s.headline}>Order Confirmed</Text>
          <Text style={s.subline}>Thank you for shopping with us.</Text>

          {/* Total — the emotional number, lives in the hero */}
          {displayTotal ? (
            <View style={s.totalBlock}>
              <Text style={s.totalAmount}>{displayTotal}</Text>
              {shortOrder ? <Text style={s.totalOrderNum}>{shortOrder}</Text> : null}
              {totalSavings > 0 ? (
                <Text style={s.savings}>
                  Saved Rs {totalSavings.toLocaleString('en-IN')}
                </Text>
              ) : null}
            </View>
          ) : null}

        </Animated.View>

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        {showOrder || showAddress ? (
          <View style={s.rule} />
        ) : null}

        {/* ── Order card — images + meta ───────────────────────────────────── */}
        {showOrder ? (
          <Animated.View style={[s.card, fade(orderAnim)]}>

            {hasHeroImg ? (
              <FadeImage
                uri={heroItem!.image}
                width={HERO_IMG_SIZE}
                height={HERO_IMG_SIZE}
                borderRadius={THUMB_RADIUS}
              />
            ) : null}

            <View style={s.orderMeta}>
              {metaLine ? <Text style={s.meta}>{metaLine}</Text> : null}
              {paymentMethod ? <Text style={s.payment}>{paymentMethod}</Text> : null}
              {extraCount > 0 ? (
                <Text style={s.extraLabel}>+{extraCount} more item{extraCount > 1 ? 's' : ''}</Text>
              ) : null}
            </View>

          </Animated.View>
        ) : null}

        {/* ── Address card ─────────────────────────────────────────────────── */}
        {showAddress ? (
          <Animated.View style={[s.card, fade(addressAnim)]}>
            <View style={s.addrHeader}>
              <Icon name="location-outline" size={15} color={Colors.accent} />
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

          <Animated.View style={ordersTactile.animatedStyle}>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={handleViewOrders}
              {...ordersTactile.handlers}
              activeOpacity={1}
              accessibilityRole="button"
            >
              <Text style={s.secondaryBtnText}>View Orders</Text>
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
    flex:            1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    flexGrow:          1,
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[6],
    paddingBottom:     Space[10],
    gap:               Space[4],
  },

  // ── Hero — open, tinted warm patch behind it ──────────────────────────────
  hero: {
    backgroundColor: 'rgba(178,90,61,0.04)',
    borderRadius:    24,
    padding:         Space[5],
    paddingBottom:   Space[6],
    gap:             Space[2],
  },
  ringWrap: {
    width:          RING_SIZE,
    height:         RING_SIZE,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Space[2],
  },
  ringFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.accentTint,
  },
  markChar: {
    fontFamily: FontFamily.serifItalic,
    fontSize:   26,
    color:      Colors.accent,
    lineHeight: 32,
    marginTop:  2,
  },
  headline: {
    fontFamily:    FontFamily.serif,
    fontSize:      32,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.7,
    lineHeight:    36,
  },
  subline: {
    fontFamily: FontFamily.sans,
    fontSize:   14,
    color:      Colors.ink3,
    lineHeight: 20,
  },
  totalBlock: {
    marginTop: Space[4],
    gap:       Space[1],
  },
  totalAmount: {
    fontFamily:    FontFamily.serif,
    fontSize:      42,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -1.4,
    lineHeight:    46,
  },
  totalOrderNum: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    color:         Colors.ink4,
    letterSpacing: 0.8,
  },
  savings: {
    fontFamily: FontFamily.sans,
    fontSize:   13,
    color:      '#226B3C',
    fontWeight: '500',
    lineHeight: 18,
    marginTop:  Space[1],
  },

  // ── Hairline rule ──────────────────────────────────────────────────────────
  rule: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── Cards — white, float above warm surface ────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     '#EFE9E4',
    padding:         Space[5],
    gap:             Space[3],
  },

  // ── Order meta group ───────────────────────────────────────────────────────
  orderMeta: {
    gap: Space[1],
  },
  meta: {
    fontFamily: FontFamily.sans,
    fontSize:   14,
    color:      Colors.ink2,
    lineHeight: 20,
  },
  payment: {
    ...Type.caption,
    color: Colors.ink4,
  },
  extraLabel: {
    ...Type.caption,
    color: Colors.ink4,
  },

  // ── Address ────────────────────────────────────────────────────────────────
  addrHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[1],
  },
  addrHeaderText: {
    fontFamily:    FontFamily.sans,
    fontSize:      12,
    fontWeight:    '600',
    color:         Colors.ink3,
    letterSpacing: 0.2,
  },
  addrPrimary: {
    fontFamily: FontFamily.sans,
    fontSize:   14,
    color:      Colors.ink1,
    lineHeight: 20,
  },
  addrSecondary: {
    ...Type.caption,
    color:      Colors.ink4,
    lineHeight: 17,
  },

  // ── CTAs ───────────────────────────────────────────────────────────────────
  ctasBlock: {
    gap:       Space[3],
    marginTop: Space[1],
  },
  primaryBtn: {
    width:           '100%',
    height:          52,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.ink1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  primaryBtnText: {
    ...Type.bodyStrong,
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    width:           '100%',
    height:          52,
    borderRadius:    Radius.pill,
    borderWidth:     1,
    borderColor:     Colors.ink3,
    alignItems:      'center',
    justifyContent:  'center',
  },
  secondaryBtnText: {
    ...Type.bodyStrong,
    color: Colors.ink1,
  },
  tertiaryBtn: {
    alignItems:      'center',
    paddingVertical: Space[2],
  },
  tertiaryBtnText: {
    ...Type.caption,
    color: Colors.ink4,
  },
});

export default OrderSuccessScreen;
