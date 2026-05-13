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
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';

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
  // Mark: ring scales up, then mark character fades in
  const ringScale   = useRef(new Animated.Value(0.52)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;

  // Content blocks: each fades + translates up independently
  const headlineAnim = useRef(new Animated.Value(0)).current;
  const orderAnim    = useRef(new Animated.Value(0)).current;
  const bodyAnim     = useRef(new Animated.Value(0)).current;
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
    // Mark ring expands on Carry curve
    Animated.parallel([
      Animated.timing(ringOpacity, {
        toValue:  1,
        duration: 160,
        delay:    DELAY.mark,
        easing:   Motion.easing.out,
        useNativeDriver: true,
      }),
      Animated.timing(ringScale, {
        toValue:  1,
        duration: Motion.duration.carry,
        delay:    DELAY.mark,
        easing:   Motion.easing.inOut,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Mark character appears after ring settles, haptic fires here
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
      makeSettle(bodyAnim,     DELAY.body),
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
          <Animated.View
            style={[
              styles.ring,
              {
                opacity:   ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          >
            <Animated.Text style={[styles.markChar, { opacity: markOpacity }]}>
              ✓
            </Animated.Text>
          </Animated.View>
        </View>

        {/* ── Headline ─────────────────────────────────────────────────── */}
        <Animated.View style={[styles.headlineBlock, blockStyle(headlineAnim, 14)]}>
          <Text style={styles.headline}>Order placed.</Text>
          <Text style={styles.subline}>
            We'll send you updates as it{'\n'}makes its way to you.
          </Text>
        </Animated.View>

        {/* ── Order number row ─────────────────────────────────────────── */}
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

        {/* ── Body copy ────────────────────────────────────────────────── */}
        <Animated.View style={[styles.bodyBlock, blockStyle(bodyAnim, 8)]}>
          <Text style={styles.bodyText}>
            You can track the status of your order{'\n'}
            in the orders section.
          </Text>
        </Animated.View>

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
  // Thin ember ring — accentTint fill, 1.5px accent border
  ring: {
    width:           72,
    height:          72,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.accentTint,
    borderWidth:     1.5,
    borderColor:     Colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  markChar: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      28,
    color:         Colors.accent,
    lineHeight:    32,
    // Optical vertical centering for the serif checkmark glyph
    marginTop:     2,
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

  // ── Body copy ────────────────────────────────────────────────────────────
  bodyBlock: {
    marginBottom: Space[10],
  },
  bodyText: {
    ...Type.caption,
    textAlign:  'center',
    lineHeight: 13 * 1.6,
    color:      Colors.ink4,
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
