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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHaptic } from '../../hooks/useHaptic';
import type { LoggedInCustomerInterface } from '../../api/interfaces';

interface EditProfileSheetProps {
  session: LoggedInCustomerInterface;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: LoggedInCustomerInterface) => void;
}

// ── Flat underline field — label above, value below, hairline bottom border ──
const Field: React.FC<{
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  returnKeyType?: 'next' | 'done';
  editable?: boolean;
  onSubmitEditing?: () => void;
  nextRef?: React.RefObject<TextInput | null>;
}> = ({ label, value, onChangeText, keyboardType = 'default', autoCapitalize = 'sentences', returnKeyType = 'next', editable = true, onSubmitEditing, nextRef }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        returnKeyType={returnKeyType}
        onSubmitEditing={nextRef ? () => nextRef.current?.focus() : onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={editable}
        style={[fieldStyles.input, !editable && fieldStyles.inputDisabled]}
        placeholderTextColor={Colors.ink4}
        autoCorrect={false}
      />
      <View style={[fieldStyles.underline, focused && fieldStyles.underlineFocused]} />
    </View>
  );
};

const fieldStyles = StyleSheet.create({
  wrap: {
    paddingTop:    Space[4],
    marginBottom:  Space[2],
  },
  label: {
    fontFamily:    FontFamily.mono,
    fontSize:      10,
    fontWeight:    '400',
    color:         Colors.ink4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom:  Space[2],
  },
  input: {
    fontFamily:    FontFamily.sans,
    fontSize:      16,
    fontWeight:    '400',
    color:         Colors.ink1,
    paddingVertical: Space[2],
    paddingHorizontal: 0,
  },
  inputDisabled: {
    color: Colors.ink4,
  },
  underline: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginTop:       Space[1],
  },
  underlineFocused: {
    height:          1,
    backgroundColor: Colors.ink2,
  },
});

export const EditProfileSheet: React.FC<EditProfileSheetProps> = ({
  session,
  isOpen,
  onClose,
  onSaved,
}) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const [name,      setName]      = useState(session.CustomerName ?? '');
  const [email,     setEmail]     = useState(session.EmailID ?? '');
  const [mobile,    setMobile]    = useState(
    session.MobileNumber !== undefined ? String(session.MobileNumber) : '',
  );
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const emailRef  = useRef<TextInput>(null);
  const mobileRef = useRef<TextInput>(null);

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
    if (saving) return;
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
  }, [saving, name, email, mobile, session, haptic, onSaved]);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <View style={[styles.root, { paddingTop: insets.top }]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="arrow-back" size={22} color={Colors.ink1} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Details</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.headerDivider} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Space[6] }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {saveError ? (
              <ErrorBanner body={saveError} onRetry={() => setSaveError(null)} />
            ) : null}

            <Field
              label="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
              nextRef={emailRef}
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              nextRef={mobileRef}
            />
            <Field
              label="Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            >
              <Text style={styles.saveBtnText}>{saving ? '···' : 'Save changes'}</Text>
            </TouchableOpacity>
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
    paddingTop:        Space[4],
    gap:               Space[2],
  },
  saveBtn: {
    marginTop:       Space[8],
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    paddingVertical: Space[4],
    alignItems:      'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    ...Type.bodyStrong,
    color: '#FFFFFF',
  },
});
