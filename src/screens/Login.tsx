import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { loginCustomer } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';
import { useHaptic } from '../hooks/useHaptic';

type RootStackParamList = {
  Home: undefined;
};

// ── Hero atmospheric composition ─────────────────────────────────────────────
// Five gradient passes + one elliptical focal bloom.
// No geometry, no lines, no images — depth purely through tone.
//
//   Bloom    — large soft ellipse, right-center, ~3% white. Reads as a
//              diffused spotlight catch on a surface just out of frame.
//              This is the single focal anchor that keeps the hero from
//              reading as a flat black rectangle.
//   Warm     — ivory bias top-right → dissolves left. Off-camera light source.
//   Shadow   — cool depth counter bottom-left. Creates stereo field.
//   Top seal — status-bar region stays deep ink regardless of bloom intensity.
//   Bottom veil — hero floor fades into the form-panel tone shift.
//   Left frame — contrast push that grounds the wordmark on the left edge.
const HeroArt: React.FC<{ heroHeight: number }> = ({ heroHeight }) => (
  <View
    style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]}
    pointerEvents="none"
  >
    {/* Elliptical focal bloom — the single visual anchor in the hero.
        Positioned right-of-center, vertically centered in the upper two-thirds.
        Reads as a soft highlight catch on an unseen surface — not a shape,
        not geometry, just a presence of light. */}
    <View
      style={{
        position:        'absolute',
        width:           heroHeight * 1.1,
        height:          heroHeight * 1.1,
        borderRadius:    heroHeight * 0.55,
        backgroundColor: 'rgba(255,255,255,0.028)',
        top:             -(heroHeight * 0.22),
        right:           -(heroHeight * 0.28),
      }}
    />

    {/* Warm ivory bias — diffused off-camera light source, top-right */}
    <LinearGradient
      colors={[
        'rgba(210,185,155,0.20)',
        'rgba(160,140,115,0.08)',
        'rgba(30,28,26,0.0)',
      ]}
      start={{ x: 0.85, y: 0.0 }}
      end={{ x: 0.1,  y: 0.85 }}
      style={StyleSheet.absoluteFillObject}
    />

    {/* Cool shadow — opposing depth, bottom-left */}
    <LinearGradient
      colors={[
        'rgba(8,8,12,0.0)',
        'rgba(8,8,12,0.28)',
        'rgba(8,8,12,0.50)',
      ]}
      start={{ x: 0.6, y: 0.2 }}
      end={{ x: 0.0, y: 1.0 }}
      style={StyleSheet.absoluteFillObject}
    />

    {/* Top seal — status bar stays deep ink */}
    <LinearGradient
      colors={[
        'rgba(0,0,0,0.50)',
        'rgba(0,0,0,0.15)',
        'rgba(0,0,0,0.0)',
      ]}
      start={{ x: 0.5, y: 0.0 }}
      end={{ x: 0.5, y: 0.30 }}
      style={StyleSheet.absoluteFillObject}
    />

    {/* Bottom veil — hero floor into form-panel transition */}
    <LinearGradient
      colors={[
        'rgba(0,0,0,0.0)',
        'rgba(0,0,0,0.22)',
        'rgba(14,12,10,0.48)',
      ]}
      start={{ x: 0.5, y: 0.50 }}
      end={{ x: 0.5, y: 1.0 }}
      style={StyleSheet.absoluteFillObject}
    />

    {/* Left-edge frame — wordmark contrast anchor */}
    <LinearGradient
      colors={[
        'rgba(0,0,0,0.28)',
        'rgba(0,0,0,0.06)',
        'rgba(0,0,0,0.0)',
      ]}
      start={{ x: 0.0, y: 0.5 }}
      end={{ x: 0.42, y: 0.5 }}
      style={[
        StyleSheet.absoluteFillObject,
        { height: heroHeight * 0.65, top: heroHeight * 0.18 },
      ]}
    />
  </View>
);

// ── Entrance timing (staggered Settle curve, per spec A8) ───────────────────
const ENTRANCE_DELAYS = {
  wordmark: 0,
  tagline:  140,
  fields:   280,
  cta:      400,
} as const;

const Login: React.FC = () => {
  const { height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>();
  const haptic = useHaptic();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  // ── Entrance animation values ───────────────────────────────────────────────
  const wordmarkAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim  = useRef(new Animated.Value(0)).current;
  const fieldsAnim   = useRef(new Animated.Value(0)).current;
  const ctaAnim      = useRef(new Animated.Value(0)).current;

  // ── Loading dots ─────────────────────────────────────────────────────────────
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  // ── Button shake (failure) ───────────────────────────────────────────────────
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // ── Mount: fire staggered entrance ─────────────────────────────────────────
  useEffect(() => {
    const makeEntrance = (val: Animated.Value, delay: number) =>
      Animated.spring(val, {
        toValue:  1,
        delay,
        ...Motion.spring.settle,
      });

    Animated.parallel([
      makeEntrance(wordmarkAnim, ENTRANCE_DELAYS.wordmark),
      makeEntrance(taglineAnim,  ENTRANCE_DELAYS.tagline),
      makeEntrance(fieldsAnim,   ENTRANCE_DELAYS.fields),
      makeEntrance(ctaAnim,      ENTRANCE_DELAYS.cta),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Loading dots loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading) return;

    const pulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1,   duration: 300, easing: Motion.easing.out, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 300, easing: Motion.easing.out, useNativeDriver: true }),
        ]),
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 150);
    const a3 = pulse(dot3, 300);
    a1.start(); a2.start(); a3.start();

    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [loading, dot1, dot2, dot3]);

  // ── Shake: 220ms horizontal oscillation ────────────────────────────────────
  const shake = useCallback(() => {
    haptic.warning();
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  6, duration: 50, easing: Motion.easing.out, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 55, easing: Motion.easing.out, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  4, duration: 50, easing: Motion.easing.out, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 50, easing: Motion.easing.out, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 55, easing: Motion.easing.out, useNativeDriver: true }),
    ]).start();
  }, [haptic, shakeAnim]);

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    if (loading) return;
    setFieldError(null);

    const data = { LoginID: username.trim(), Password: password };
    setLoading(true);

    try {
      const result = await loginCustomer(data);
      if (result.statusCode !== 1) {
        setLoading(false);
        setFieldError(result.userMessage || 'Invalid credentials.');
        shake();
        return;
      }
      await AsyncStorage.setItem(STORAGE_KEYS.userData, JSON.stringify(result.result));
      navigation.navigate('Home');
    } catch (error: any) {
      setLoading(false);
      setFieldError(error?.message ?? 'Something went wrong. Please try again.');
      shake();
    }
  }, [loading, username, password, navigation, shake]);

  // ── Derived layout ──────────────────────────────────────────────────────────
  const heroHeight = Math.round(screenHeight * 0.39);

  // Entrance → translateY + opacity for each block
  const entranceStyle = (anim: Animated.Value, initialY = 14) => ({
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [initialY, 0] }),
    }],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Dark atelier hero ──────────────────────────────────────────────── */}
      <View style={[styles.hero, { height: heroHeight }]}>
        <HeroArt heroHeight={heroHeight} />

        <Animated.View style={[styles.heroContent, entranceStyle(wordmarkAnim, 20)]}>
          <Text style={styles.wordmark}>shop.</Text>
        </Animated.View>

        <Animated.View style={[styles.taglineWrap, entranceStyle(taglineAnim)]}>
          <Text style={styles.tagline}>Made for the things{'\n'}you'll keep.</Text>
        </Animated.View>
      </View>

      {/* ── Light form panel ───────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.formPanel}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.formInner}>
          {/* Fields */}
          <Animated.View style={[styles.fieldsBlock, entranceStyle(fieldsAnim)]}>
            <FloatingLabelInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              activeColor={Colors.ink1}
            />
            <FloatingLabelInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              activeColor={Colors.ink1}
              error={fieldError}
            />
          </Animated.View>

          {/* CTA */}
          <Animated.View
            style={[
              styles.ctaBlock,
              { transform: [{ translateX: shakeAnim }] },
              entranceStyle(ctaAnim),
            ]}
          >
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.92}
              style={[styles.ctaButton, loading && styles.ctaButtonLoading]}
              accessibilityRole="button"
              accessibilityLabel="Log in"
              accessibilityState={{ busy: loading }}
            >
              {loading ? (
                <View style={styles.dotsRow}>
                  {[dot1, dot2, dot3].map((dot, i) => (
                    <Animated.View
                      key={i}
                      style={[styles.dot, { opacity: dot }]}
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.ctaLabel}>Log in</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.ink1,
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor:   Colors.ink1,
    justifyContent:    'flex-end',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[5],
  },
  heroContent: {
    marginBottom: Space[4],
  },
  wordmark: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      52,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -1.2,
    lineHeight:    52 * 1.0,
  },
  taglineWrap: {
  },
  tagline: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      20,
    fontWeight:    '400',
    color:         'rgba(255,255,255,0.58)',
    letterSpacing: -0.3,
    lineHeight:    20 * 1.45,
  },

  // ── Form panel ───────────────────────────────────────────────────────────────
  formPanel: {
    flex:            1,
    backgroundColor: Colors.surfaceDeep,
  },
  formInner: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[8],
    paddingBottom:     Space[6],
  },
  fieldsBlock: {
    gap: Space[8],  // 32px — clears the absolute error caption below first field
  },

  // ── CTA ─────────────────────────────────────────────────────────────────────
  ctaBlock: {
    marginTop: Space[8],
  },
  ctaButton: {
    width:           '100%',
    height:          56,
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    alignItems:      'center',
    justifyContent:  'center',
  },
  ctaButtonLoading: {
    // Slightly reduced opacity while busy — button stays full-width per spec
    opacity: 0.7,
  },
  ctaLabel: {
    ...Type.bodyStrong,
    color:         '#FFFFFF',
    letterSpacing: 0.4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap:           8,
    alignItems:    'center',
  },
  dot: {
    width:         6,
    height:        6,
    borderRadius:  3,
    backgroundColor: '#FFFFFF',
  },
});

export default Login;
