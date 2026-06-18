import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { postCreateCustomer } from '../api/auth';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';
import { useHaptic } from '../hooks/useHaptic';
import Icon from 'react-native-vector-icons/Ionicons';
import { BRAND } from '../config/brand';

type RootStackParamList = {
  Login: undefined;
  OTPVerification: {
    CustomerName: string;
    EmailID: string;
    MobileNumber: string;
    CountryCode: number;
    Password: string;
  };
};

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [mobile,     setMobile]     = useState('');
  const [password,   setPassword]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const formAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const make = (val: Animated.Value, delay: number) =>
      Animated.spring(val, { toValue: 1, delay, ...Motion.spring.settle, useNativeDriver: true });
    Animated.parallel([
      make(headerAnim, 0),
      make(formAnim, 120),
    ]).start();
  }, [headerAnim, formAnim]);

  const slideIn = (anim: Animated.Value): object => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  });

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

  const handleRegister = useCallback(async () => {
    if (loading) return;
    setFieldError(null);

    if (!name.trim() || !email.trim() || !mobile.trim() || !password) {
      setFieldError('All fields are required.');
      shake();
      return;
    }

    setLoading(true);
    try {
      const res = await postCreateCustomer({
        CustomerName: name.trim(),
        EmailID:      email.trim(),
        MobileNumber: Number(mobile.trim()),
        CountryCode:  230,
        Password:     password,
      });

      if (res.statusCode !== 1) {
        setLoading(false);
        setFieldError(res.userMessage || 'Registration failed.');
        shake();
        return;
      }

      setLoading(false);
      navigation.navigate('OTPVerification', {
        CustomerName: name.trim(),
        EmailID:      email.trim(),
        MobileNumber: mobile.trim(),
        CountryCode:  230,
        Password:     password,
      });
    } catch (error: any) {
      setLoading(false);
      setFieldError(error?.message ?? 'Something went wrong. Please try again.');
      shake();
    }
  }, [loading, name, email, mobile, password, navigation, shake]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F5F2" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.inner, { paddingTop: insets.top + Space[5] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Back + wordmark ─────────────────────────────────────────────── */}
          <Animated.View style={[styles.header, slideIn(headerAnim)]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.backBtn}
            >
              <Icon name="chevron-back" size={22} color={Colors.ink2} />
            </TouchableOpacity>
            <Text style={styles.wordmark}>{BRAND.name}</Text>
            <Text style={styles.title}>Create your account.</Text>
          </Animated.View>

          {/* ── Form ─────────────────────────────────────────────────────────── */}
          <Animated.View style={[styles.formBlock, slideIn(formAnim)]}>
            <View style={styles.fields}>
              <FloatingLabelInput
                label="Full name"
                value={name}
                onChangeText={setName}
                placeholder="your name"
                autoCapitalize="words"
                returnKeyType="next"
                activeColor={Colors.accent}
              />
              <FloatingLabelInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="email address"
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                activeColor={Colors.accent}
              />
              <FloatingLabelInput
                label="Mobile number"
                value={mobile}
                onChangeText={setMobile}
                placeholder="mobile number"
                keyboardType="phone-pad"
                returnKeyType="next"
                activeColor={Colors.accent}
              />
              <FloatingLabelInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="create a password"
                showToggle
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                activeColor={Colors.accent}
                error={fieldError}
              />
            </View>

            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.92}
                style={[styles.ctaButton, loading && styles.ctaButtonLoading]}
                accessibilityRole="button"
                accessibilityLabel="Create account"
              >
                <Text style={styles.ctaLabel}>{loading ? '···' : 'Create account'}</Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
              style={styles.loginLink}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginTextBold}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#F8F5F2',
  },
  flex: {
    flex: 1,
  },
  inner: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[10],
  },

  // ── Header ────────────────────────────────────────────────────────────────────
  header: {
    marginBottom: Space[8],
  },
  backBtn: {
    marginBottom: Space[6],
    alignSelf:    'flex-start',
  },
  wordmark: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      29,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.6,
    lineHeight:    29,
    marginBottom:  36,
  },
  title: {
    fontFamily:    FontFamily.sans,
    fontSize:      24,
    fontWeight:    '300',
    color:         Colors.ink1,
    letterSpacing: -0.4,
  },

  // ── Form ──────────────────────────────────────────────────────────────────────
  formBlock: {
    gap: 0,
  },
  fields: {
    gap:          Space[5],
    marginBottom: Space[6],
  },

  // ── CTA ───────────────────────────────────────────────────────────────────────
  ctaButton: {
    width:           '100%',
    height:          48,
    backgroundColor: '#111111',
    borderRadius:    Radius.pill,
    alignItems:      'center',
    justifyContent:  'center',
  },
  ctaButtonLoading: {
    opacity: 0.7,
  },
  ctaLabel: {
    ...Type.bodyStrong,
    color:         '#FFFFFF',
    letterSpacing: 0.4,
  },
  loginLink: {
    marginTop:  Space[4],
    alignItems: 'center',
  },
  loginText: {
    ...Type.caption,
    color: Colors.ink3,
  },
  loginTextBold: {
    ...Type.caption,
    color:      Colors.ink2,
    fontWeight: '500',
  },
});

export default RegisterScreen;
