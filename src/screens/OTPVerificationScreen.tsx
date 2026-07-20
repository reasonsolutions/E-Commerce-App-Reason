import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { postConfirmCustomer, postCreateCustomer } from '../api/auth';
import { userFacingMessage } from '../api/apiError';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useHaptic } from '../hooks/useHaptic';
import Icon from 'react-native-vector-icons/Ionicons';
import { getPendingPassword, setPendingPassword, clearPendingPassword } from '../utils/registrationState';
import type { RootStackParamList } from '../navigation/types';

const OTP_LENGTH = 6;

const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OTPVerification'>>();
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const { CustomerName, EmailID, MobileNumber, CountryCode } = route.params;

  const [otp, setOtp]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // One ref object per box. See the cssInterop={false} note on each TextInput
  // below for why plain refs didn't work here until that prop was added.
  const boxRefs = useRef(
    Array.from({ length: OTP_LENGTH }, () => React.createRef<TextInput>()),
  ).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(contentAnim, {
      toValue: 1,
      delay: 60,
      ...Motion.spring.settle,
      useNativeDriver: true,
    }).start();
    setTimeout(() => boxRefs[0].current?.focus(), 400);
  }, [contentAnim]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError(null);
    setOtp('');
    try {
      const password = getPendingPassword() ?? '';
      await postCreateCustomer({ CustomerName, EmailID, MobileNumber: Number(MobileNumber), CountryCode, Password: password });
      setCountdown(30);
      haptic.success();
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  }, [countdown, resending, CustomerName, EmailID, MobileNumber, CountryCode, haptic]);

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

  const handleVerify = useCallback(async (code: string) => {
    if (code.length < OTP_LENGTH || loading) return;
    setError(null);
    setLoading(true);
    try {
      const password = getPendingPassword() ?? '';
      const res = await postConfirmCustomer({
        OTP:          code,
        CustomerName,
        EmailID,
        MobileNumber: Number(MobileNumber),
        CountryCode,
        Password:     password,
      });

      if (res.statusCode !== 1) {
        setLoading(false);
        setError(res.userMessage || 'Invalid OTP. Please try again.');
        shake();
        return;
      }

      setPendingPassword(null);
      haptic.success();
      Keyboard.dismiss();
      // Wait for the keyboard-dismiss animation to finish before mounting Login —
      // otherwise its KeyboardAvoidingView reacts to the closing keyboard and the
      // form content below the password field jumps/flickers on arrival.
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Login', params: { skipEntrance: true } }] });
      }, 250);
    } catch (err) {
      clearPendingPassword();
      setLoading(false);
      setError(userFacingMessage(err));
      shake();
    }
  }, [loading, CustomerName, EmailID, MobileNumber, CountryCode, navigation, shake, haptic]);

  // Each box is its own real TextInput — a single hidden TextInput behind
  // decorative boxes previously relied on an imperative .focus() forward that
  // silently failed on iOS (both a near-zero-size input and, separately,
  // pointerEvents="none" each independently block first-responder status),
  // leaving the keyboard unable to appear at all. Per-box real inputs remove
  // that indirection entirely — the same direct-tap pattern already used and
  // proven working on RegisterScreen's FloatingLabelInput fields.
  const handleBoxChange = useCallback((index: number, val: string) => {
    // val can arrive as more than one character — e.g. iOS offering the full
    // autofilled one-time-code into a single box, or fast typing coalescing
    // two keystrokes into one onChangeText call. Handle both a single digit
    // (advance one box) and a multi-digit paste/autofill (spread across the
    // remaining boxes) instead of assuming exactly one new character.
    const digits = val.replace(/\D/g, '');
    setError(null);

    if (digits.length > 1) {
      const nextEmpty = Math.min(index + digits.length, OTP_LENGTH - 1);
      boxRefs[nextEmpty].current?.focus();
      setOtp(prev => {
        const chars = prev.split('');
        for (let d = 0; d < digits.length && index + d < OTP_LENGTH; d++) {
          chars[index + d] = digits[d];
        }
        const next = chars.join('').slice(0, OTP_LENGTH);
        if (next.length === OTP_LENGTH) handleVerify(next);
        return next;
      });
      return;
    }

    const digit = digits.slice(-1);
    if (digit && index < OTP_LENGTH - 1) {
      boxRefs[index + 1].current?.focus();
    }
    setOtp(prev => {
      const chars = prev.split('');
      chars[index] = digit;
      const next = chars.join('').slice(0, OTP_LENGTH);
      if (next.length === OTP_LENGTH) handleVerify(next);
      return next;
    });
  }, [handleVerify]);

  const handleBoxKeyPress = useCallback((index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      boxRefs[index - 1].current?.focus();
      setOtp(prev => {
        const chars = prev.split('');
        chars[index - 1] = '';
        return chars.join('');
      });
    }
  }, [otp]);

  const entranceStyle = {
    transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  // Render OTP boxes — each a real, directly-tappable TextInput
  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => {
    const char = otp[i] ?? '';
    const isActive = otp.length === i;
    return (
      <TextInput
        key={i}
        ref={boxRefs[i]}
        // Root cause of refs never attaching, confirmed via runtime tracing:
        // NativeWind's babel preset routes EVERY .tsx file through its own
        // JSX runtime (react-native-css-interop), which swaps every
        // <TextInput> for an interop-wrapped version project-wide — even
        // here, where no className is used anywhere in this file. That
        // wrapper's ref-forwarding does not reliably reach the real native
        // TextInput in this RN/React 19 setup (ref.current stayed null on
        // EVERY box, confirmed via onLayout logging on a physical device).
        // cssInterop={false} is react-native-css-interop's own documented
        // escape hatch (see wrap-jsx.js) — it skips the interop swap for
        // this element, restoring normal ref behavior.
        cssInterop={false}
        value={char}
        onChangeText={val => handleBoxChange(i, val)}
        onKeyPress={({ nativeEvent }) => handleBoxKeyPress(i, nativeEvent.key)}
        keyboardType="number-pad"
        maxLength={1}
        textContentType={i === 0 ? 'oneTimeCode' : undefined}
        autoComplete={i === 0 ? 'one-time-code' : undefined}
        style={[
          styles.otpBox,
          isActive && styles.otpBoxActive,
          !!char && styles.otpBoxFilled,
          !!error && styles.otpBoxError,
        ]}
      />
    );
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + Space[2] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-back" size={24} color={Colors.ink1} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, entranceStyle]}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code via email to{'\n'}
          <Text style={styles.emailHighlight}>{EmailID}</Text>
        </Text>

        {/* OTP boxes — each a real, directly-tappable TextInput */}
        <Animated.View style={[styles.otpRow, styles.otpTouchable, { transform: [{ translateX: shakeAnim }] }]}>
          {boxes}
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleResend}
          disabled={countdown > 0 || resending}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.resendWrap}
        >
          <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
            {resending ? 'Sending…' : countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleVerify(otp)}
          disabled={otp.length < OTP_LENGTH || loading}
          activeOpacity={0.92}
          style={[
            styles.ctaButton,
            (otp.length < OTP_LENGTH || loading) && styles.ctaButtonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Verify OTP"
        >
          <Text style={styles.ctaLabel}>{loading ? '···' : 'Verify'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
  },
  content: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[4],
  },
  title: {
    fontFamily:    FontFamily.serif,
    fontSize:      32,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.8,
    marginBottom:  Space[1],
  },
  subtitle: {
    ...Type.body,
    color:        Colors.ink3,
    marginBottom: Space[8],
    lineHeight:   24,
  },
  emailHighlight: {
    ...Type.body,
    color: Colors.ink1,
  },
  otpRow: {
    marginBottom: Space[4],
  },
  otpTouchable: {
    flexDirection:  'row',
    gap:            Space[2],
  },
  otpBox: {
    flex:            1,
    height:          52,
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     Colors.rule,
    backgroundColor: Colors.surfaceSoft,
    textAlign:       'center',
    fontSize:        20,
    fontWeight:      '600',
    color:           Colors.ink1,
    padding:         0,
  },
  otpBoxActive: {
    borderColor: Colors.ink2,
  },
  otpBoxFilled: {
    borderColor:     Colors.ink1,
    backgroundColor: Colors.surface,
  },
  otpBoxError: {
    borderColor: Colors.danger,
  },
  errorText: {
    ...Type.caption,
    color:        Colors.danger,
    marginBottom: Space[4],
  },
  resendWrap: {
    alignSelf:    'center',
    marginBottom: Space[2],
  },
  resendText: {
    ...Type.caption,
    color: Colors.ink2,
  },
  resendTextDisabled: {
    color: Colors.ink4,
  },
  ctaButton: {
    width:           '100%',
    height:          56,
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       Space[4],
  },
  ctaButtonDisabled: {
    opacity: 0.4,
  },
  ctaLabel: {
    ...Type.bodyStrong,
    color:         '#FFFFFF',
    letterSpacing: 0.4,
  },
});

export default OTPVerificationScreen;
