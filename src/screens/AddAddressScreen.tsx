import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FloatingLabelInput, ErrorBanner } from '../components/ui';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import {
  postCreateDeliveryAddress,
  postUpdateDeliveryAddress,
  getDeliveryAddresses,
} from '../api/address';
import { STORAGE_KEYS, scopedKey } from '../config/storageKeys';
import { AddressLabel } from '../config/enum_files/AddressLabel';
import { COUNTRY_OPTIONS, type CountryOption } from '../config/countries';
import type { DeliveryAddress } from './AddressScreen';

type Props = {
  navigation: {
    goBack: () => void;
    pop: (count: number) => void;
    canGoBack: () => boolean;
    navigate: (screen: string, params?: Record<string, any>) => void;
    getState: () => { index: number } | undefined;
  };
  route: {
    params?: {
      editAddress?: DeliveryAddress;
      from?: 'checkout';
    };
  };
};

const EMPTY_FORM = {
  CustomerName: '', MobileNumber: '', Address: '',
  StreetName: '', City: '', Landmark: '', Zipcode: '',
};
const EMPTY_ERRORS = {
  CustomerName: '', MobileNumber: '', Address: '',
  StreetName: '', City: '', Landmark: '', Zipcode: '',
};

const LABEL_TEXT: Record<AddressLabel, string> = {
  [AddressLabel.Home]:  'HOME',
  [AddressLabel.Work]:  'WORK',
  [AddressLabel.Other]: 'OTHER',
};
const LABEL_OPTIONS = [AddressLabel.Home, AddressLabel.Work, AddressLabel.Other];

// Dedicated add/edit-address form, reached from DeliverToRow's "Add a new
// address" entry and from AddressManagementScreen's list (add + per-row
// edit). Edit mode is driven by route.params.editAddress.
const AddAddressScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const editAddress = route.params?.editAddress ?? null;
  const isFromCheckout = route.params?.from === 'checkout';

  const [form, setForm]                 = useState(
    editAddress
      ? {
          CustomerName: editAddress.CustomerName,
          MobileNumber: String(editAddress.MobileNumber),
          Address:      editAddress.Address    ?? '',
          StreetName:   editAddress.StreetName ?? '',
          City:         editAddress.City       ?? '',
          Landmark:     editAddress.Landmark   ?? '',
          Zipcode:      editAddress.Zipcode    ?? '',
        }
      : EMPTY_FORM,
  );
  const [formErrors, setFormErrors]     = useState(EMPTY_ERRORS);
  const [addressLabel, setAddressLabel] = useState<AddressLabel | null>(editAddress?.AddressLabel ?? null);
  const [country, setCountry]           = useState<CountryOption>(
    COUNTRY_OPTIONS.find(c => c.code === editAddress?.CountryCode) ?? COUNTRY_OPTIONS[0],
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState<string | null>(null);

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const REQUIRED_FIELDS: (keyof typeof EMPTY_ERRORS)[] = [
    'CustomerName', 'MobileNumber', 'Address', 'StreetName', 'City', 'Zipcode',
  ];
  const REQUIRED_MESSAGE = 'This field is required';

  const validateForm = (): boolean => {
    const errors = { ...EMPTY_ERRORS };
    REQUIRED_FIELDS.forEach(name => {
      errors[name] = form[name].trim() ? '' : REQUIRED_MESSAGE;
    });
    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  // Per-field validation on blur, so a mandatory field left empty is flagged
  // immediately rather than only on Save.
  const validateFieldOnBlur = (name: keyof typeof EMPTY_ERRORS) => {
    if (!REQUIRED_FIELDS.includes(name)) return;
    setFormErrors(prev => ({
      ...prev,
      [name]: form[name].trim() ? '' : REQUIRED_MESSAGE,
    }));
  };

  // Guards goBack/pop against a stack shorter than expected (e.g. a dev
  // Fast Refresh mid-flow) — falls back to MainTabs instead of the
  // unhandled GO_BACK console error / stuck screen. canGoBack() alone only
  // confirms >=1 screen behind us, not >=popCount, so check index depth too.
  const safeGoBack = (popCount = 1) => {
    const depth = navigation.getState()?.index ?? 0;
    if (navigation.canGoBack() && depth >= popCount) {
      popCount > 1 ? navigation.pop(popCount) : navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const handleSave = async () => {
    if (!validateForm() || submitting) return;
    setFormError(null);

    const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
    const profileCode: number | null = userRaw ? JSON.parse(userRaw)?.CustomerProfileCode ?? null : null;
    if (!profileCode) {
      setFormError('Session expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      if (editAddress) {
        const response = await postUpdateDeliveryAddress({
          OrderDeliveryAddressCode: editAddress.OrderDeliveryAddressCode,
          CustomerProfileCode:      profileCode,
          CustomerName:             form.CustomerName.trim(),
          MobileNumber:             Number(form.MobileNumber.trim()),
          Address:                  form.Address.trim(),
          StreetName:               form.StreetName.trim(),
          City:                     form.City.trim(),
          Landmark:                 form.Landmark.trim(),
          Zipcode:                  Number(form.Zipcode.trim()),
          IsPrimary:                0,
          CountryCode:              country.code,
          AddressLabel:             addressLabel ?? undefined,
        });
        if (response.statusCode === 1) {
          safeGoBack();
        } else {
          setFormError(response.userMessage || 'Failed to update address.');
        }
        return;
      }

      const response = await postCreateDeliveryAddress({
        CustomerName:        form.CustomerName.trim(),
        MobileNumber:        form.MobileNumber.trim(),
        Address:             form.Address.trim(),
        StreetName:          form.StreetName.trim(),
        City:                form.City.trim(),
        Landmark:            form.Landmark.trim(),
        Zipcode:             form.Zipcode.trim(),
        IsPrimary:           '0',
        CustomerProfileCode: profileCode,
        CountryCode:         country.code,
        AddressLabel:        addressLabel ?? undefined,
      });

      if (response.statusCode === 1) {
        // postCreateDeliveryAddress's own response carries no address data
        // (just { result: true }) — fetch the reliable GET and find the new
        // address by matching the fields just submitted.
        const listRes = await getDeliveryAddresses(profileCode).catch(() => null);
        const list: DeliveryAddress[] =
          listRes?.statusCode === 1 && Array.isArray(listRes.result) ? listRes.result : [];
        const match = list.find(
          a => a.CustomerName === form.CustomerName.trim() && a.Zipcode === form.Zipcode.trim(),
        );
        if (match) {
          await AsyncStorage.setItem(
            scopedKey('selectedDeliveryAddress', profileCode),
            String(match.OrderDeliveryAddressCode),
          );
        }
        // Coming from checkout with no address yet (list was empty pre-save):
        // skip back past AddressManagement straight to Checkout, mirroring
        // the "set as primary" auto-return in AddressManagementScreen.
        if (isFromCheckout && list.length <= 1) {
          safeGoBack(2);
        } else {
          safeGoBack();
        }
      } else {
        setFormError(response.userMessage || 'Failed to save address.');
      }
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + Space[3] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Icon name="chevron-back" size={22} color={Colors.ink1} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editAddress ? 'Edit Address' : 'Add Address'}</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.headerDivider} />

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
                    item.code === country.code && styles.pickerRowSelected,
                  ]}
                  onPress={() => {
                    setCountry(item);
                    setPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerDialCode}>{item.dialCode}</Text>
                  <Text style={styles.pickerCountryName}>{item.label}</Text>
                  {item.code === country.code && (
                    <Icon name="checkmark" size={16} color={Colors.brandNavy} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Space[8] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.labelPickerRow}>
            {LABEL_OPTIONS.map(opt => {
              const selected = addressLabel === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setAddressLabel(opt)}
                  style={[styles.labelPill, selected && styles.labelPillSelected]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.labelPillText, selected && styles.labelPillTextSelected]}>
                    {LABEL_TEXT[opt]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.formFields}>
            <FloatingLabelInput
              label="Full name"
              value={form.CustomerName}
              onChangeText={t => handleChange('CustomerName', t)}
              onBlur={() => validateFieldOnBlur('CustomerName')}
              error={formErrors.CustomerName || null}
              autoCapitalize="words"
              returnKeyType="next"
              required
            />
            <View style={styles.mobileRow}>
              <TouchableOpacity
                style={styles.countryPrefix}
                onPress={() => setPickerVisible(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Country code ${country.dialCode}. Tap to change.`}
              >
                <Text style={styles.countryPrefixText}>{country.dialCode}</Text>
                <Icon name="chevron-down" size={12} color={Colors.ink4} style={styles.chevron} />
              </TouchableOpacity>
              <View style={styles.mobileInput}>
                <FloatingLabelInput
                  label="Mobile number"
                  value={form.MobileNumber}
                  onChangeText={t => handleChange('MobileNumber', t)}
                  onBlur={() => validateFieldOnBlur('MobileNumber')}
                  error={formErrors.MobileNumber || null}
                  keyboardType="numeric"
                  returnKeyType="next"
                  required
                />
              </View>
            </View>
            <FloatingLabelInput
              label="Address"
              value={form.Address}
              onChangeText={t => handleChange('Address', t)}
              onBlur={() => validateFieldOnBlur('Address')}
              error={formErrors.Address || null}
              autoCapitalize="sentences"
              returnKeyType="next"
              required
            />
            <FloatingLabelInput
              label="Street name"
              value={form.StreetName}
              onChangeText={t => handleChange('StreetName', t)}
              onBlur={() => validateFieldOnBlur('StreetName')}
              error={formErrors.StreetName || null}
              autoCapitalize="sentences"
              returnKeyType="next"
              required
            />
            <FloatingLabelInput
              label="City"
              value={form.City}
              onChangeText={t => handleChange('City', t)}
              onBlur={() => validateFieldOnBlur('City')}
              error={formErrors.City || null}
              autoCapitalize="words"
              returnKeyType="next"
              required
            />
            <FloatingLabelInput
              label="Landmark (optional)"
              value={form.Landmark}
              onChangeText={t => handleChange('Landmark', t)}
              autoCapitalize="sentences"
              returnKeyType="next"
            />
            <FloatingLabelInput
              label="Zipcode"
              value={form.Zipcode}
              onChangeText={t => handleChange('Zipcode', t)}
              onBlur={() => validateFieldOnBlur('Zipcode')}
              error={formErrors.Zipcode || null}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleSave}
              required
            />
          </View>

          {formError ? (
            <ErrorBanner body={formError} onRetry={() => setFormError(null)} />
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={submitting}
            activeOpacity={0.82}
          >
            <Text style={styles.saveBtnText}>
              {submitting
                ? (editAddress ? 'Updating…' : 'Saving…')
                : (editAddress ? 'Update Address' : 'Save Address')}
            </Text>
          </TouchableOpacity>
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
  flex: { flex: 1 },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[4],
    backgroundColor:   Colors.surface,
  },
  backBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     -Space[2],
  },
  headerTitle: {
    flex:          1,
    fontFamily:    FontFamily.sans,
    fontSize:      18,
    fontWeight:    '600',
    color:         Colors.ink1,
    letterSpacing: -0.1,
    textAlign:     'center',
  },
  headerRight: { width: 36 },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  scrollContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[6],
  },
  labelPickerRow: {
    flexDirection: 'row',
    gap:           Space[2],
    marginBottom:  Space[5],
  },
  labelPill: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingVertical:   Space[2] + 2,
    borderRadius:      Radius.pill,
    borderWidth:       1.5,
    borderColor:       Colors.rule,
    backgroundColor:   Colors.surface,
  },
  labelPillSelected: {
    backgroundColor: Colors.brandNavy,
    borderColor:     Colors.brandNavy,
  },
  labelPillText: {
    ...Type.label,
    color: Colors.ink1,
  },
  labelPillTextSelected: {
    color: '#FFFFFF',
  },
  formFields: {
    gap:          Space[6],
    marginBottom: Space[5],
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

  // ── Country picker modal ─────────────────────────────────────────────────────
  modalBackdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent:  'flex-end',
  },
  pickerSheet: {
    backgroundColor:      Colors.surface,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    paddingTop:    Space[5],
    paddingBottom: Space[8],
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
  saveBtn: {
    backgroundColor: Colors.brandNavy,
    borderRadius:    Radius.pill,
    paddingVertical: Space[3] + 2,
    alignItems:      'center',
    marginTop:       Space[3],
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: {
    ...Type.bodyStrong,
    color: '#FFFFFF',
  },
});

export default AddAddressScreen;
