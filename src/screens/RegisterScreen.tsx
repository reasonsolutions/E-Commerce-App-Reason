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

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [mobile, setMobile]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(contentAnim, {
      toValue: 1,
      delay: 60,
      ...Motion.spring.settle,
      useNativeDriver: true,
    }).start();
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
        CustomerName:  name.trim(),
        EmailID:       email.trim(),
        MobileNumber:  Number(mobile.trim()),
        CountryCode:   230,
        LoginPassword: password,
        Address:       '',
        StreetName:    '',
        CityName:      '',
        ZipCode:       0,
      });

      if (res.statusCode !== 1) {
        setLoading(false);
        setFieldError(res.userMessage || 'Registration failed.');
        shake();
        return;
      }

      setLoading(false);
      navigation.navigate('OTPVerification', {
        CustomerName:  name.trim(),
        EmailID:       email.trim(),
        MobileNumber:  mobile.trim(),
        CountryCode:   230,
        Password:      password,
      });
    } catch (error: any) {
      setLoading(false);
      setFieldError(error?.message ?? 'Something went wrong. Please try again.');
      shake();
    }
  }, [loading, name, email, mobile, password, navigation, shake]);

  const entranceStyle = {
    opacity: contentAnim,
    transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Space[2] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-back" size={24} color={Colors.ink1} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={entranceStyle}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join us and start shopping.</Text>

            <View style={styles.fields}>
              <FloatingLabelInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                activeColor={Colors.ink1}
              />
              <FloatingLabelInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                activeColor={Colors.ink1}
              />
              <FloatingLabelInput
                label="Mobile Number"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                returnKeyType="next"
                activeColor={Colors.ink1}
              />
              <FloatingLabelInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                showToggle
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                activeColor={Colors.ink1}
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
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
  },
  scrollContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[4],
    paddingBottom:     Space[8],
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
  },
  fields: {
    gap:          Space[8],
    marginBottom: Space[8],
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
    color:      Colors.ink1,
    fontWeight: '600',
  },
});

export default RegisterScreen;
