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
import { changePassword } from '../../api/auth';
import { userFacingMessage } from '../../api/apiError';
import { useHaptic } from '../../hooks/useHaptic';

interface ChangePasswordSheetProps {
  customerProfileCode: number;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const Field: React.FC<{
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  nextRef?: React.RefObject<TextInput | null>;
}> = ({ label, value, onChangeText, returnKeyType = 'next', onSubmitEditing, nextRef }) => {
  const [focused, setFocused] = useState(false);
  const [secure,  setSecure]  = useState(true);
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.row}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          returnKeyType={returnKeyType}
          onSubmitEditing={nextRef ? () => nextRef.current?.focus() : onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={fieldStyles.input}
          placeholderTextColor={Colors.ink4}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={() => setSecure(s => !s)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name={secure ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.ink4} />
        </TouchableOpacity>
      </View>
      <View style={[fieldStyles.underline, focused && fieldStyles.underlineFocused]} />
    </View>
  );
};

const fieldStyles = StyleSheet.create({
  wrap: {
    paddingTop:   Space[4],
    marginBottom: Space[2],
  },
  label: {
    ...Type.label,
    fontSize:      10,
    color:         Colors.ink4,
    letterSpacing: 1.2,
    marginBottom:  Space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  input: {
    flex:              1,
    fontFamily:        FontFamily.sans,
    fontSize:          16,
    fontWeight:        '400',
    color:             Colors.ink1,
    paddingVertical:   Space[2],
    paddingHorizontal: 0,
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

export const ChangePasswordSheet: React.FC<ChangePasswordSheetProps> = ({
  customerProfileCode,
  isOpen,
  onClose,
  onSaved,
}) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const newPasswordRef     = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isOpen) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaveError(null);
      setSaving(false);
    }
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaveError(null);

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setSaveError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSaveError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setSaveError('New password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      const res = await changePassword({
        CustomerProfileCode: customerProfileCode,
        OldPassword:         oldPassword.trim(),
        NewPassword:         newPassword.trim(),
      });

      if (res?.statusCode !== 1) {
        setSaveError(res?.userMessage || 'Failed to change password. Please try again.');
        setSaving(false);
        return;
      }

      haptic.success();
      setSaving(false);
      onSaved();
    } catch (err) {
      setSaveError(userFacingMessage(err));
      setSaving(false);
    }
  }, [saving, oldPassword, newPassword, confirmPassword, customerProfileCode, haptic, onSaved]);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <View style={[styles.root, { paddingTop: insets.top }]}>

        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="arrow-back" size={22} color={Colors.ink1} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
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
              label="Current Password"
              value={oldPassword}
              onChangeText={setOldPassword}
              returnKeyType="next"
              nextRef={newPasswordRef}
            />
            <Field
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              returnKeyType="next"
              nextRef={confirmPasswordRef}
            />
            <Field
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            >
              <Text style={styles.saveBtnText}>{saving ? '···' : 'Update password'}</Text>
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
