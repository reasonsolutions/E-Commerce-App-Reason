import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
    params?: {
      orderNumber?: string;
    };
  };
};

// Staggered settle delays — each block arrives after the one before it
const DELAY = {
  mark:      0,
  headline:  400,
  order:     600,
  body:      780,
  ctas:      960,
} as const;

const OrderSuccessScreen: React.FC<OrderSuccessScreenProps> = ({ navigation, route }) => {
  const orderNumber = route.params?.orderNumber;
  const haptic = useHaptic();
  const primaryTactile = useTactile();

  // ── Animation values ───────────────────────────────────────────────────────
  const RING_R        = 34;
  const CIRCUMFERENCE = 2 * Math.PI * RING_R;

  // SVG stroke draw: dashoffset goes from full circumference → 0
  const strokeOffset = useRef(new Animated.Value(CIRCUMFERENCE)).current;
  const markOpacity  = useRef(new Animated.Value(0)).current;

  // Content blocks: each fades + translates up independently
  const headlineAnim = useRef(new Animated.Value(0)).current;
  const orderAnim    = useRef(new Animated.Value(0)).current;
  const ctasAnim     = useRef(new Animated.Value(0)).current;

  const makeSettle = (val: Animated.Value, delay: number) =>
    Animated.parallel([
      Animated.timing(val, {
        toValue:  1,
        delay,
        duration: Motion.duration.settle,
        easing:   Motion.easing.out,
        useNativeDriver: true,
      }),
    ]);

  useEffect(() => {
    // SVG circle stroke draws itself around the ring
    Animated.timing(strokeOffset, {
      toValue:  0,
      duration: Motion.duration.carry,
      delay:    DELAY.mark,
      easing:   Motion.easing.inOut,
      useNativeDriver: true,
    }).start(() => {
      // Tick fades in after circle completes, haptic fires here
      Animated.timing(markOpacity, {
        toValue:  1,
        duration: Motion.duration.tap,
        easing:   Motion.easing.out,
        useNativeDriver: true,
      }).start();
      haptic.success();
    });

    // Content blocks settle in sequence
    Animated.parallel([
      makeSettle(headlineAnim, DELAY.headline),
      makeSettle(orderAnim,    DELAY.order),
      makeSettle(ctasAnim,     DELAY.ctas),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blockStyle = (anim: Animated.Value, initialY = 10) => ({
    opacity:   anim,
    transform: [{
      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [initialY, 0] }),
    }],
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

      <View style={styles.content}>

        {/* ── Success mark ────────────────────────────────────────────── */}
        <View style={styles.markWrap}>
          <View style={styles.ringWrap}>
            {/* Tinted fill background */}
            <View style={styles.ringFill} />
            {/* Animated SVG stroke draw */}
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
            {/* Tick fades in after ring completes */}
            <Animated.Text style={[styles.markChar, { opacity: markOpacity }]}>
              ✓
            </Animated.Text>
          </View>
        </View>

        {/* ── Headline ─────────────────────────────────────────────────── */}
        <Animated.View style={[styles.headlineBlock, blockStyle(headlineAnim, 14)]}>
          <Text style={styles.headline}>Order placed.</Text>
          <Text style={styles.subline}>
            We'll send you updates as it{'\n'}makes its way to you.
          </Text>
        </Animated.View>

        {/* ── Order number + delivery estimate ─────────────────────────── */}
        {orderNumber ? (
          <Animated.View style={[styles.orderBlock, blockStyle(orderAnim, 10)]}>
            <View style={styles.orderRule} />
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Order</Text>
              <Text style={styles.orderNumber}>#{orderNumber}</Text>
            </View>
            <View style={styles.orderRule} />
          </Animated.View>
        ) : null}

        {/* ── CTAs ─────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.ctasBlock, blockStyle(ctasAnim, 10)]}>
          {/* Primary — ink pill */}
          <Animated.View style={primaryTactile.animatedStyle}>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={handleViewOrders}
              {...primaryTactile.handlers}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel="View my orders"
            >
              <Text style={styles.primaryCtaText}>View My Orders</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Secondary — text link, subordinate */}
          <TouchableOpacity
            style={styles.secondaryCta}
            onPress={handleContinueShopping}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="Continue shopping"
          >
            <Text style={styles.secondaryCtaText}>Continue Shopping</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[8],
  },

  // ── Mark ────────────────────────────────────────────────────────────────
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

  // ── Headline block ───────────────────────────────────────────────────────
  headlineBlock: {
    alignItems:   'center',
    marginBottom: Space[8],
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
    color:     Colors.ink3,
    textAlign: 'center',
    lineHeight: 16 * 1.55,
  },

  // ── Order row ────────────────────────────────────────────────────────────
  orderBlock: {
    width:        '100%',
    marginBottom: Space[8],
  },
  orderRule: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  orderRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'baseline',
    paddingVertical: Space[4],
  },
  orderLabel: {
    ...Type.label,
    color: Colors.ink3,
  },
  orderNumber: {
    fontFamily:    FontFamily.mono,
    fontSize:      15,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: 0.8,
  },



  // ── CTAs ─────────────────────────────────────────────────────────────────
  ctasBlock: {
    width:      '100%',
    alignItems: 'center',
    gap:        Space[2],
  },
  primaryCta: {
    width:           '100%',
    height:          52,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.ink1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  primaryCtaText: {
    ...Type.bodyStrong,
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryCta: {
    paddingVertical: Space[2],
  },
  secondaryCtaText: {
    ...Type.caption,
    color:              Colors.ink3,
    textDecorationLine: 'underline',
    letterSpacing:      0.2,
  },
});

export default OrderSuccessScreen;
