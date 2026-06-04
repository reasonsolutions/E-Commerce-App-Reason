import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { ErrorBanner } from './ErrorBanner';
import { forgotPassword, verifyForgotPasswordOTP } from '../../api/auth';
import { useHaptic } from '../../hooks/useHaptic';

interface ForgotPasswordSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'email' | 'otp';

export const ForgotPasswordSheet: React.FC<ForgotPasswordSheetProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const [step,     setStep]     = useState<Step>('email');
  const [email,    setEmail]    = useState('');
  const [otp,      setOtp]      = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const otpRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('email');
      setEmail('');
      setOtp('');
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSendOTP = useCallback(async () => {
    if (loading) return;
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      if (res?.statusCode !== 1) {
        setError(res?.userMessage || 'Could not send OTP. Please try again.');
        setLoading(false);
        return;
      }
      haptic.success();
      setLoading(false);
      setStep('otp');
      setTimeout(() => otpRef.current?.focus(), 100);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
      setLoading(false);
    }
  }, [loading, email, haptic]);

  const handleVerifyOTP = useCallback(async () => {
    if (loading) return;
    setError(null);

    if (!otp.trim()) {
      setError('Please enter the OTP sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyForgotPasswordOTP(email.trim().toLowerCase(), otp.trim());
      if (res?.statusCode !== 1) {
        setError(res?.userMessage || 'Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }
      haptic.success();
      setLoading(false);
      onSuccess();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
      setLoading(false);
    }
  }, [loading, email, otp, haptic, onSuccess]);

  const handleBack = useCallback(() => {
    if (step === 'otp') {
      setStep('email');
      setOtp('');
      setError(null);
    } else {
      onClose();
    }
  }, [step, onClose]);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleBack}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <View style={[styles.root, { paddingTop: insets.top }]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="arrow-back" size={22} color={Colors.ink1} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.headerDivider} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space[6] }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error ? (
              <ErrorBanner body={error} onRetry={() => setError(null)} />
            ) : null}

            {step === 'email' ? (
              <>
                <Text style={styles.description}>
                  Enter your email address and we'll send you an OTP to reset your password.
                </Text>

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOTP}
                    style={styles.input}
                    placeholderTextColor={Colors.ink4}
                    placeholder="your@email.com"
                  />
                  <View style={styles.underline} />
                </View>

                <TouchableOpacity
                  onPress={handleSendOTP}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={[styles.btn, loading && styles.btnDisabled]}
                >
                  <Text style={styles.btnText}>{loading ? '···' : 'Send OTP'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.description}>
                  An OTP has been sent to{' '}
                  <Text style={styles.emailHighlight}>{email}</Text>
                  . Enter it below to verify.
                </Text>

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>One-Time Password</Text>
                  <TextInput
                    ref={otpRef}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOTP}
                    style={styles.input}
                    placeholderTextColor={Colors.ink4}
                    placeholder="Enter OTP"
                    maxLength={10}
                  />
                  <View style={styles.underline} />
                </View>

                <TouchableOpacity
                  onPress={handleVerifyOTP}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={[styles.btn, loading && styles.btnDisabled]}
                >
                  <Text style={styles.btnText}>{loading ? '···' : 'Verify OTP'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setStep('email'); setOtp(''); setError(null); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.resendWrap}
                >
                  <Text style={styles.resendText}>Didn't receive it? Re-enter email</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[4],
  },
  headerTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      18,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.2,
  },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  content: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[6],
    gap:               Space[4],
  },
  description: {
    ...Type.caption,
    color:      Colors.ink3,
    lineHeight: 13 * 1.6,
  },
  emailHighlight: {
    ...Type.caption,
    color:      Colors.ink1,
    fontWeight: '600',
  },

  // ── Field ──────────────────────────────────────────────────────────────────
  fieldWrap: {
    paddingTop:   Space[2],
    marginBottom: Space[2],
  },
  fieldLabel: {
    fontFamily:    FontFamily.mono,
    fontSize:      10,
    fontWeight:    '400',
    color:         Colors.ink4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom:  Space[2],
  },
  input: {
    fontFamily:      FontFamily.sans,
    fontSize:        16,
    fontWeight:      '400',
    color:           Colors.ink1,
    paddingVertical: Space[2],
    paddingHorizontal: 0,
  },
  underline: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginTop:       Space[1],
  },

  // ── Button ─────────────────────────────────────────────────────────────────
  btn: {
    marginTop:       Space[4],
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    paddingVertical: Space[4],
    alignItems:      'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    ...Type.bodyStrong,
    color: '#FFFFFF',
  },
  resendWrap: {
    marginTop:  Space[4],
    alignItems: 'center',
  },
  resendText: {
    ...Type.caption,
    color:              Colors.ink3,
    textDecorationLine: 'underline',
  },
});
