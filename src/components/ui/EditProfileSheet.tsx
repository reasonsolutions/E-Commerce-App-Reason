import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { ErrorBanner } from './ErrorBanner';
import { postUpdateCustomer } from '../../api/auth';
import { STORAGE_KEYS } from '../../config/storageKeys';
import { BRAND } from '../../config/brand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHaptic } from '../../hooks/useHaptic';
import type { LoggedInCustomerInterface } from '../../api/interfaces';

const PAGE_BG  = '#F8F5F2';
const CARD_BG  = '#FFFFFF';
const BORDER   = '#EEEAE5';

interface EditProfileSheetProps {
  session: LoggedInCustomerInterface;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: LoggedInCustomerInterface) => void;
}

// ── Mini avatar ───────────────────────────────────────────────────────────────
const MiniAvatar: React.FC<{ name: string }> = ({ name }) => {
  const parts    = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <View style={avatarStyles.circle}>
      <Text style={avatarStyles.text}>{initials}</Text>
    </View>
  );
};

const avatarStyles = StyleSheet.create({
  circle: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: '#EDE9E4',
    alignItems:      'center',
    justifyContent:  'center',
  },
  text: {
    fontFamily:    FontFamily.serif,
    fontSize:      18,
    fontWeight:    '400',
    color:         Colors.ink2,
    letterSpacing: 0.5,
  },
});

// ── Card field ────────────────────────────────────────────────────────────────
const CardField: React.FC<{
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  returnKeyType?: 'next' | 'done';
  editable?: boolean;
  verified?: boolean;
  showDivider?: boolean;
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}> = ({
  label, value, onChangeText, keyboardType = 'default',
  autoCapitalize = 'sentences', returnKeyType = 'next',
  editable = true, verified = false, showDivider = true,
  onSubmitEditing, inputRef,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[fieldStyles.wrap, showDivider && fieldStyles.wrapDivider]}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.valueRow}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          style={[
            fieldStyles.input,
            !editable && fieldStyles.inputLocked,
            focused && fieldStyles.inputFocused,
          ]}
          placeholderTextColor={Colors.ink4}
          autoCorrect={false}
        />
        {verified && (
          <View style={fieldStyles.verifiedBadge}>
            <Icon name="checkmark-circle" size={13} color="#2E7D32" />
            <Text style={fieldStyles.verifiedText}>Verified</Text>
          </View>
        )}
        {!editable && !verified && (
          <Icon name="lock-closed-outline" size={13} color={Colors.ink5} />
        )}
      </View>
    </View>
  );
};

const fieldStyles = StyleSheet.create({
  wrap: {
    paddingVertical:   Space[4],
  },
  wrapDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  label: {
    fontFamily:    FontFamily.mono,
    fontSize:      9,
    letterSpacing: 1.1,
    color:         Colors.ink4,
    textTransform: 'uppercase',
    marginBottom:  Space[1],
  },
  valueRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
  },
  input: {
    flex:          1,
    fontFamily:    FontFamily.sans,
    fontSize:      16,
    fontWeight:    '400',
    color:         Colors.ink1,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  inputFocused: {
    color: Colors.ink1,
  },
  inputLocked: {
    color: Colors.ink4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           3,
  },
  verifiedText: {
    fontFamily:    FontFamily.mono,
    fontSize:      9,
    letterSpacing: 0.5,
    color:         '#2E7D32',
    textTransform: 'uppercase',
  },
});

// ── Sheet ─────────────────────────────────────────────────────────────────────
export const EditProfileSheet: React.FC<EditProfileSheetProps> = ({
  session,
  isOpen,
  onClose,
  onSaved,
}) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const originalName   = session.CustomerName ?? '';
  const originalEmail  = session.EmailID ?? '';
  const originalMobile = session.MobileNumber !== undefined ? String(session.MobileNumber) : '';

  const [name,      setName]      = useState(originalName);
  const [email,     setEmail]     = useState(originalEmail);
  const [mobile,    setMobile]    = useState(originalMobile);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const emailRef  = useRef<TextInput>(null);
  const mobileRef = useRef<TextInput>(null);

  const isDirty = name.trim() !== originalName || email.trim() !== originalEmail || mobile.trim() !== originalMobile;

  useEffect(() => {
    if (isOpen) {
      setName(session.CustomerName ?? '');
      setEmail(session.EmailID ?? '');
      setMobile(session.MobileNumber !== undefined ? String(session.MobileNumber) : '');
      setSaveError(null);
      setSaving(false);
    }
  }, [isOpen, session]);

  const handleSave = useCallback(async () => {
    if (saving || !isDirty) return;
    setSaveError(null);

    if (!name.trim() || !email.trim() || !mobile.trim()) {
      setSaveError('Name, email and mobile are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await postUpdateCustomer({
        CustomerProfileCode: session.CustomerProfileCode,
        CustomerName:        name.trim(),
        EmailID:             email.trim(),
        MobileNumber:        mobile.trim(),
        CountryCode:         230,
      });

      if (res?.statusCode !== 1) {
        setSaveError(res?.userMessage || 'Update failed. Please try again.');
        setSaving(false);
        return;
      }

      const updated: LoggedInCustomerInterface = {
        ...session,
        CustomerName: name.trim(),
        EmailID:      email.trim(),
        MobileNumber: Number(mobile.trim()),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.userData, JSON.stringify(updated));
      haptic.success();
      setSaving(false);
      onSaved(updated);
    } catch (err: any) {
      setSaveError(err?.message ?? 'Something went wrong.');
      setSaving(false);
    }
  }, [saving, isDirty, name, email, mobile, session, haptic, onSaved]);

  const displayName = name || originalName || '—';

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={CARD_BG} />
      <View style={[styles.root, { paddingTop: insets.top }]}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="chevron-back" size={24} color={Colors.ink1} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.headerDivider} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Mini hero ──────────────────────────────────────────────── */}
            <View style={styles.hero}>
              <MiniAvatar name={displayName} />
              <View style={styles.heroText}>
                <Text style={styles.heroName}>{displayName}</Text>
                <View style={styles.memberBadge}>
                  <Text style={styles.memberBadgeText}>◆ {BRAND.memberLabel}</Text>
                </View>
              </View>
            </View>

            {saveError ? (
              <View style={styles.errorWrap}>
                <ErrorBanner body={saveError} onRetry={() => setSaveError(null)} />
              </View>
            ) : null}

            {/* ── Fields card ────────────────────────────────────────────── */}
            <View style={styles.sectionLabel}>
              <Text style={styles.sectionLabelText}>PERSONAL INFORMATION</Text>
            </View>
            <View style={styles.card}>
              <CardField
                label="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                showDivider
              />
              <CardField
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                inputRef={emailRef}
                onSubmitEditing={() => mobileRef.current?.focus()}
                verified
                showDivider
              />
              <CardField
                label="Mobile Number"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                returnKeyType="done"
                inputRef={mobileRef}
                onSubmitEditing={handleSave}
                verified
                showDivider={false}
              />
            </View>

            {/* ── Save button ────────────────────────────────────────────── */}
            <View style={styles.ctaWrap}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || !isDirty}
                activeOpacity={0.85}
                style={[
                  styles.saveBtn,
                  (!isDirty || saving) && styles.saveBtnDisabled,
                ]}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? '···' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
              {!isDirty && (
                <Text style={styles.noChangesHint}>No changes to save</Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: PAGE_BG,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[4],
    backgroundColor:   CARD_BG,
  },
  headerTitle: {
    fontFamily:  FontFamily.sans,
    fontSize:    16,
    fontWeight:  '600',
    color:       Colors.ink1,
    letterSpacing: -0.1,
  },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
  },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: {
    paddingBottom: Space[10],
  },

  // ── Mini hero ──────────────────────────────────────────────────────────────
  hero: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[4],
    backgroundColor:   CARD_BG,
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[6],
    paddingBottom:     Space[6],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    marginBottom:      Space[5],
  },
  heroText: {
    gap: 4,
  },
  heroName: {
    fontFamily:    FontFamily.serif,
    fontSize:      20,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.3,
    lineHeight:    24,
  },
  memberBadge: {
    alignSelf:         'flex-start',
    paddingVertical:   2,
    paddingHorizontal: 6,
    borderRadius:      3,
    backgroundColor:   'rgba(178, 90, 61, 0.07)',
  },
  memberBadgeText: {
    fontFamily:    FontFamily.mono,
    fontSize:      8,
    letterSpacing: 1.0,
    color:         Colors.accent,
    textTransform: 'uppercase',
  },

  // ── Error ──────────────────────────────────────────────────────────────────
  errorWrap: {
    paddingHorizontal: Space.screenH,
    marginBottom:      Space[3],
  },

  // ── Section label ──────────────────────────────────────────────────────────
  sectionLabel: {
    paddingHorizontal: Space.screenH,
    marginBottom:      Space[2],
  },
  sectionLabelText: {
    fontFamily:    FontFamily.mono,
    fontSize:      9,
    letterSpacing: 1.4,
    color:         Colors.ink4,
    textTransform: 'uppercase',
  },

  // ── Fields card ────────────────────────────────────────────────────────────
  card: {
    backgroundColor:   CARD_BG,
    borderRadius:      16,
    borderWidth:       StyleSheet.hairlineWidth,
    borderColor:       BORDER,
    paddingHorizontal: Space[4],
    marginHorizontal:  Space.screenH,
    shadowColor:       '#000000',
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.02,
    shadowRadius:      3,
    elevation:         1,
  },

  // ── CTA ────────────────────────────────────────────────────────────────────
  ctaWrap: {
    paddingHorizontal: Space.screenH,
    marginTop:         Space[6],
    alignItems:        'center',
    gap:               Space[3],
  },
  saveBtn: {
    width:           '100%',
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    paddingVertical: Space[4],
    alignItems:      'center',
  },
  saveBtnDisabled: {
    backgroundColor: Colors.ink4,
    opacity:         0.45,
  },
  saveBtnText: {
    ...Type.bodyStrong,
    color: '#FFFFFF',
  },
  noChangesHint: {
    ...Type.caption,
    color: Colors.ink4,
  },
});
