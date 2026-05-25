import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { postConfirmCustomer } from '../api/auth';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useHaptic } from '../hooks/useHaptic';
import Icon from 'react-native-vector-icons/Ionicons';

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

const OTP_LENGTH = 6;

const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OTPVerification'>>();
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const { CustomerName, EmailID, MobileNumber, CountryCode, Password } = route.params;

  const [otp, setOtp]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(contentAnim, {
      toValue: 1,
      delay: 60,
      ...Motion.spring.settle,
      useNativeDriver: true,
    }).start();
    setTimeout(() => inputRef.current?.focus(), 400);
  }, [contentAnim]);

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
      const res = await postConfirmCustomer({
        OTP:           code,
        CustomerName,
        EmailID,
        MobileNumber:  Number(MobileNumber),
        CountryCode,
        LoginPassword: Password,
        Address:       '',
        StreetName:    '',
        CityName:      '',
        ZipCode:       0,
      });

      if (res.statusCode !== 1) {
        setLoading(false);
        setError(res.userMessage || 'Invalid OTP. Please try again.');
        shake();
        return;
      }

      haptic.success();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err: any) {
      setLoading(false);
      setError(err?.message ?? 'Something went wrong. Please try again.');
      shake();
    }
  }, [loading, CustomerName, EmailID, MobileNumber, CountryCode, Password, navigation, shake, haptic]);

  const handleOtpChange = useCallback((val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(cleaned);
    setError(null);
    if (cleaned.length === OTP_LENGTH) handleVerify(cleaned);
  }, [handleVerify]);

  const entranceStyle = {
    opacity: contentAnim,
    transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  // Render OTP boxes
  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => {
    const char = otp[i] ?? '';
    const isActive = otp.length === i;
    return (
      <View
        key={i}
        style={[
          styles.otpBox,
          isActive && styles.otpBoxActive,
          !!char && styles.otpBoxFilled,
          error && styles.otpBoxError,
        ]}
      >
        <Text style={styles.otpChar}>{char}</Text>
      </View>
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
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.emailHighlight}>{EmailID}</Text>
        </Text>

        {/* Hidden input — drives OTP boxes */}
        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          style={styles.hiddenInput}
          caretHidden
        />

        {/* OTP boxes */}
        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            style={styles.otpTouchable}
          >
            {boxes}
          </TouchableOpacity>
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
  hiddenInput: {
    position: 'absolute',
    opacity:  0,
    width:    0,
    height:   0,
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
    alignItems:      'center',
    justifyContent:  'center',
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
  otpChar: {
    fontFamily:    FontFamily.mono,
    fontSize:      20,
    color:         Colors.ink1,
    letterSpacing: 0,
  },
  errorText: {
    ...Type.caption,
    color:        Colors.danger,
    marginBottom: Space[4],
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
