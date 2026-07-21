import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { loginCustomer } from '../api/auth';
import { userFacingMessage } from '../api/apiError';
import {
  getSavedCartItems,
  postSaveCartItems,
  updateCartItemQuantity,
  getGuestCart,
  clearGuestCart,
  type GuestCartItem,
} from '../api/cart';
import { effectivePurchaseLimit } from '../utils/stock';
import { useCart } from '../context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { STORAGE_KEYS } from '../config/storageKeys';
import { BRAND } from '../config/brand';
import { setTokenCache } from '../api/axiosInstance';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';
import { ForgotPasswordSheet } from '../components/ui';
import { useHaptic } from '../hooks/useHaptic';
import { useAppToast } from '../hooks/useAppToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';

const Login: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Login'>>();
  const insets = useSafeAreaInsets();
  const skipEntrance = route.params?.skipEntrance ?? false;
  const haptic = useHaptic();
  const toast = useAppToast();
  const { setCartCount } = useCart();

  // ── Form state ────────────────────────────────────────────────────────────────
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [forgotVisible, setForgotVisible] = useState(false);

  // ── Entrance animation ────────────────────────────────────────────────────────
  const headerAnim = useRef(new Animated.Value(skipEntrance ? 1 : 0)).current;
  const chipsAnim = useRef(new Animated.Value(skipEntrance ? 1 : 0)).current;
  const formAnim = useRef(new Animated.Value(skipEntrance ? 1 : 0)).current;

  useEffect(() => {
    if (skipEntrance) return;
    const make = (val: Animated.Value, delay: number) =>
      Animated.spring(val, {
        toValue: 1,
        delay,
        ...Motion.spring.settle,
        useNativeDriver: true,
      });
    Animated.parallel([
      make(headerAnim, 0),
      make(chipsAnim, 120),
      make(formAnim, 240),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slideIn = (anim: Animated.Value): object => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  });

  // ── Loading dots ──────────────────────────────────────────────────────────────
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!loading) return;
    const pulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: Motion.duration.settle,
            easing: Motion.easing.out,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.3,
            duration: Motion.duration.settle,
            easing: Motion.easing.out,
            useNativeDriver: true,
          }),
        ]),
      );
    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 150);
    const a3 = pulse(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [loading, dot1, dot2, dot3]);

  // ── Shake ─────────────────────────────────────────────────────────────────────
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const shake = useCallback(() => {
    haptic.warning();
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 50,
        easing: Motion.easing.out,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 55,
        easing: Motion.easing.out,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 4,
        duration: 50,
        easing: Motion.easing.out,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -4,
        duration: 50,
        easing: Motion.easing.out,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 55,
        easing: Motion.easing.out,
        useNativeDriver: true,
      }),
    ]).start();
  }, [haptic, shakeAnim]);

  // ── Auth ──────────────────────────────────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    if (loading) return;
    setFieldError(null);
    setLoading(true);

    try {
      const result = await loginCustomer({
        LoginID: username.trim(),
        Password: password,
      });
      if (result.statusCode !== 1) {
        setLoading(false);
        setFieldError(result.userMessage || 'Invalid credentials.');
        shake();
        return;
      }
      const { AccessToken, RefreshToken, ...userData } = result.result;
      const storeRefreshToken = async () => {
        if (!RefreshToken) return;
        try {
          await Keychain.setGenericPassword('token', RefreshToken, {
            service:       STORAGE_KEYS.refreshToken,
            securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
          });
        } catch {
          // Fall back to ANY if hardware-backed storage is unavailable on this device
          await Keychain.setGenericPassword('token', RefreshToken, {
            service:       STORAGE_KEYS.refreshToken,
            securityLevel: Keychain.SECURITY_LEVEL.ANY,
          });
        }
      };
      await Promise.all([
        Keychain.setGenericPassword('token', AccessToken, {
          service:       STORAGE_KEYS.authToken,
          securityLevel: Keychain.SECURITY_LEVEL.ANY,
        }),
        storeRefreshToken(),
        AsyncStorage.setItem(STORAGE_KEYS.userData, JSON.stringify(userData)),
      ]);
      setTokenCache(AccessToken);
      if (userData.CustomerProfileCode) {
        const [guestItems, existingCartRes] = await Promise.all([
          getGuestCart(),
          getSavedCartItems(userData.CustomerProfileCode).catch(() => null),
        ]);
        const existingItems: any[] =
          existingCartRes?.statusCode === 1 ? existingCartRes.result ?? [] : [];
        if (guestItems.length > 0) {
          let mergeFailures = 0;
          let mergeTrimmed  = 0;
          await Promise.all(
            guestItems.map((item: GuestCartItem) => {
              const existing = existingItems.find(
                ci => ci.InventoryId === item.inventoryId,
              );
              const combinedQty = (existing?.Quantity ?? 0) + item.quantity;
              // maxPerOrder/stock/backOrder are only captured for guest items
              // added after those fixes shipped — undefined for older entries,
              // in which case there's nothing reliable to clamp against, so
              // pass the raw quantity through unchanged rather than guess.
              const limit = item.maxPerOrder != null || item.stock != null
                ? effectivePurchaseLimit(item.maxPerOrder, item.stock, item.backOrder)
                : null;
              const finalQty = limit != null ? Math.min(combinedQty, limit) : combinedQty;
              if (limit != null && finalQty < combinedQty) mergeTrimmed++;

              return existing
                ? updateCartItemQuantity(
                    existing.CartDetailsCode,
                    item.inventoryId,
                    finalQty,
                  ).catch(() => { mergeFailures++; })
                : postSaveCartItems({
                    CustomerProfileCode: userData.CustomerProfileCode,
                    InventoryId: item.inventoryId,
                    Quantity: finalQty,
                    IsPurchased: false,
                  }).catch(() => { mergeFailures++; });
            }),
          );
          await clearGuestCart();
          if (mergeFailures > 0) {
            toast.error({
              title: 'Some cart items not synced',
              description: `${mergeFailures} item${mergeFailures > 1 ? 's' : ''} couldn't be added to your cart.`,
            });
          } else if (mergeTrimmed > 0) {
            toast.warning({
              title: 'Cart quantities adjusted',
              description: `${mergeTrimmed} item${mergeTrimmed > 1 ? 's' : ''} exceeded the per-order limit and ${mergeTrimmed > 1 ? 'were' : 'was'} trimmed.`,
            });
          }
        }
        const cartRes =
          guestItems.length > 0
            ? await getSavedCartItems(userData.CustomerProfileCode).catch(
                () => null,
              )
            : existingCartRes;
        if (cartRes?.statusCode === 1) {
          setCartCount(
            (cartRes.result ?? []).reduce(
              (sum: number, item: any) => sum + item.Quantity,
              0,
            ),
          );
        }
      }
      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      setLoading(false);
      setFieldError(userFacingMessage(error));
      shake();
    }
  }, [loading, username, password, navigation, shake, setCartCount]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <ForgotPasswordSheet
        isOpen={forgotVisible}
        onClose={() => setForgotVisible(false)}
        onSuccess={() => {
          setForgotVisible(false);
          toast.success({
            title: 'Password sent',
            description: 'Check your email for your new password.',
          });
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.inner,
            { paddingTop: insets.top + Space[8] },
          ]}
          bounces={false}
        >
          {/* ── Wordmark header ─────────────────────────────────────────────── */}
          <Animated.View style={[styles.header, slideIn(headerAnim)]}>
            <Text style={styles.wordmark}>{BRAND.name}</Text>
            <Text style={styles.subtitle}>Continue shopping.</Text>
          </Animated.View>

          {/* ── Form ─────────────────────────────────────────────────────────── */}
          <Animated.View style={slideIn(formAnim)}>
            <View style={styles.fieldsBlock}>
              <FloatingLabelInput
                label="Email or mobile"
                value={username}
                onChangeText={setUsername}
                placeholder="email or mobile number"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                activeColor={Colors.accent}
              />
              <View style={styles.passwordBlock}>
                <FloatingLabelInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="password"
                  showToggle
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  activeColor={Colors.accent}
                  error={fieldError}
                />
                <TouchableOpacity
                  onPress={() => setForgotVisible(true)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.forgotLink}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── CTA ───────────────────────────────────────────────────────── */}
            <Animated.View
              style={[
                styles.ctaBlock,
                { transform: [{ translateX: shakeAnim }] },
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

              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.7}
                style={styles.registerLink}
              >
                <Text style={styles.registerText}>
                  Don't have an account?{' '}
                  <Text style={styles.registerTextBold}>Sign up</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })
                }
                activeOpacity={0.7}
                style={styles.guestLink}
              >
                <Text style={styles.guestText}>Continue as guest</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex: {
    flex: 1,
  },
  inner: {
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[10],
  },

  // ── Header ────────────────────────────────────────────────────────────────────
  header: {
    marginBottom: Space[8],
  },
  wordmark: {
    fontFamily: FontFamily.serifItalic,
    fontSize: 29,
    fontWeight: '400',
    color: Colors.ink1,
    letterSpacing: -0.6,
    lineHeight: 29,
    marginBottom: 36,
  },
  subtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 24,
    fontWeight: '300',
    color: Colors.ink1,
    letterSpacing: -0.4,
  },
  // ── Form ──────────────────────────────────────────────────────────────────────
  fieldsBlock: {
    gap: Space[5],
  },
  passwordBlock: {
    gap: Space[2],
  },
  forgotLink: {
    alignSelf: 'flex-start',
  },
  forgotText: {
    ...Type.caption,
    color: Colors.ink4,
  },

  // ── CTA ───────────────────────────────────────────────────────────────────────
  ctaBlock: {
    marginTop: Space[6],
  },
  ctaButton: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.ink1,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonLoading: {
    opacity: 0.7,
  },
  ctaLabel: {
    ...Type.bodyStrong,
    color: Colors.accentInk,
    letterSpacing: 0.4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentInk,
  },
  registerLink: {
    marginTop: Space[4],
    alignItems: 'center',
  },
  registerText: {
    ...Type.caption,
    color: Colors.ink3,
  },
  registerTextBold: {
    ...Type.caption,
    color: Colors.ink2,
    fontWeight: '500',
  },
  guestLink: {
    marginTop: Space[3],
    alignItems: 'center',
  },
  guestText: {
    ...Type.caption,
    color: Colors.ink3,
  },
});

export default Login;
