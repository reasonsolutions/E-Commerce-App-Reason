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
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { postCreateCustomer } from '../api/auth';
import { userFacingMessage } from '../api/apiError';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';
import { useHaptic } from '../hooks/useHaptic';
import Icon from 'react-native-vector-icons/Ionicons';
import { BRAND } from '../config/brand';
import { setPendingPassword } from '../utils/registrationState';
import type { RootStackParamList } from '../navigation/types';

const COUNTRY_OPTIONS = [
  { label: 'Mauritius', dialCode: '+230', code: 230 },
  { label: 'India',     dialCode: '+91',  code: 91  },
] as const;

type CountryOption = typeof COUNTRY_OPTIONS[number];

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [mobile,          setMobile]          = useState('');
  const [password,        setPassword]        = useState('');
  const [loading,         setLoading]         = useState(false);
  const [fieldError,      setFieldError]      = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRY_OPTIONS[0]);
  const [pickerVisible,   setPickerVisible]   = useState(false);

  const passwordStrength = password.length === 0 ? 0
    : password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9!@#$%^&*]/.test(password) ? 3
    : password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password) ? 2
    : 1;

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
        CountryCode:  selectedCountry.code,
        Password:     password,
      });

      if (res.statusCode !== 1) {
        setLoading(false);
        setFieldError(res.userMessage || 'Registration failed.');
        shake();
        return;
      }

      setLoading(false);
      setPendingPassword(password);
      navigation.navigate('OTPVerification', {
        CustomerName: name.trim(),
        EmailID:      email.trim(),
        MobileNumber: mobile.trim(),
        CountryCode:  selectedCountry.code,
      });
    } catch (error) {
      setLoading(false);
      setFieldError(userFacingMessage(error));
      shake();
    }
  }, [loading, name, email, mobile, password, selectedCountry, navigation, shake]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F5F2" />

      {/* ── Country picker modal ────────────────────────────────────────────── */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select country code</Text>
            <FlatList
              data={COUNTRY_OPTIONS}
              keyExtractor={item => String(item.code)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerRow,
                    item.code === selectedCountry.code && styles.pickerRowSelected,
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerDialCode}>{item.dialCode}</Text>
                  <Text style={styles.pickerCountryName}>{item.label}</Text>
                  {item.code === selectedCountry.code && (
                    <Icon name="checkmark" size={16} color={Colors.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

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
              <View style={styles.mobileRow}>
                <TouchableOpacity
                  style={styles.countryPrefix}
                  onPress={() => setPickerVisible(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Country code ${selectedCountry.dialCode}. Tap to change.`}
                >
                  <Text style={styles.countryPrefixText}>{selectedCountry.dialCode}</Text>
                  <Icon name="chevron-down" size={12} color={Colors.ink4} style={styles.chevron} />
                </TouchableOpacity>
                <View style={styles.mobileInput}>
                  <FloatingLabelInput
                    label="Mobile number"
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="mobile number"
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    activeColor={Colors.accent}
                  />
                </View>
              </View>
              <View>
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
                {password.length > 0 && (
                  <View style={styles.strengthRow}>
                    {[1, 2, 3].map(level => (
                      <View
                        key={level}
                        style={[
                          styles.strengthSegment,
                          passwordStrength >= level && (
                            level === 1 ? styles.strengthWeak :
                            level === 2 ? styles.strengthFair :
                            styles.strengthStrong
                          ),
                        ]}
                      />
                    ))}
                    <Text style={styles.strengthLabel}>
                      {passwordStrength === 1 ? 'Weak' : passwordStrength === 2 ? 'Fair' : 'Strong'}
                    </Text>
                  </View>
                )}
              </View>
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

            <Text style={styles.legalText}>
              {'By creating an account you agree to our '}
              <Text
                style={styles.legalLink}
                onPress={() => navigation.navigate('Legal', { type: 'terms' })}
              >
                Terms of Service
              </Text>
              {' and '}
              <Text
                style={styles.legalLink}
                onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
              >
                Privacy Policy
              </Text>
            </Text>
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

  // ── Mobile prefix ────────────────────────────────────────────────────────────
  mobileRow: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:           Space[3],
  },
  countryPrefix: {
    height:            56,
    paddingHorizontal: Space[3],
    borderRadius:      Radius.sm,
    borderWidth:       StyleSheet.hairlineWidth,
    borderColor:       Colors.rule,
    backgroundColor:   Colors.surfaceSoft,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[1],
  },
  countryPrefixText: {
    fontSize:      14,
    fontWeight:    '500',
    color:         Colors.ink2,
    letterSpacing: 0.4,
  },
  chevron: {
    marginTop: 1,
  },
  mobileInput: {
    flex: 1,
  },

  // ── Country picker modal ──────────────────────────────────────────────────────
  modalBackdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent:  'flex-end',
  },
  pickerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    paddingTop:      Space[5],
    paddingBottom:   Space[8],
  },
  pickerTitle: {
    fontFamily:    FontFamily.sans,
    fontSize:      13,
    fontWeight:    '600',
    color:         Colors.ink3,
    letterSpacing: 0.3,
    marginBottom:  Space[2],
    paddingHorizontal: Space.screenH,
  },
  pickerRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   Space[4],
    paddingHorizontal: Space.screenH,
    gap:               Space[3],
  },
  pickerRowSelected: {
    backgroundColor: Colors.surfaceSoft,
  },
  pickerDialCode: {
    fontSize:      14,
    fontWeight:    '500',
    color:         Colors.ink1,
    letterSpacing: 0.4,
    width:         44,
  },
  pickerCountryName: {
    ...Type.body,
    flex:  1,
    color: Colors.ink2,
  },

  // ── Password strength ─────────────────────────────────────────────────────────
  strengthRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
    marginTop:     Space[2],
  },
  strengthSegment: {
    flex:             1,
    height:           3,
    borderRadius:     2,
    backgroundColor:  Colors.surfaceDeep,
  },
  strengthWeak: {
    backgroundColor: Colors.danger,
  },
  strengthFair: {
    backgroundColor: Colors.warning,
  },
  strengthStrong: {
    backgroundColor: Colors.success,
  },
  strengthLabel: {
    ...Type.label,
    fontSize:  10,
    color:     Colors.ink4,
    width:     40,
    textAlign: 'right',
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
  legalText: {
    ...Type.caption,
    color:     Colors.ink4,
    textAlign: 'center',
    marginTop: Space[3],
  },
  legalLink: {
    ...Type.caption,
    color:               Colors.ink2,
    textDecorationLine:  'underline',
  },
});

export default RegisterScreen;
