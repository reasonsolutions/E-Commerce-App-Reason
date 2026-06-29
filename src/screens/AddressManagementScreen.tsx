import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { EmptyState, FloatingLabelInput, ErrorBanner, ConfirmSheet } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import {
  getDeliveryAddresses,
  postCreateDeliveryAddress,
  postUpdateDeliveryAddress,
  postDeleteDeliveryAddress,
} from '../api/address';
import { userFacingMessage } from '../api/apiError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { useAppToast } from '../hooks/useAppToast';
import { DeliveryAddress } from './AddressScreen';

type Props = {
  navigation: {
    goBack: () => void;
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

// ── Single address row ────────────────────────────────────────────────────────
const AddressRow: React.FC<{
  item: DeliveryAddress;
  onEdit: () => void;
  onDelete: () => void;
  isLast: boolean;
  delay: number;
}> = ({ item, onEdit, onDelete, isLast, delay }) => {
  const haptic   = useHaptic();
  const entrance = useEntrance(delay);
  const { animatedStyle: pressStyle, handlers } = useTactile();

  return (
    <Animated.View style={styles.rowWrap}>
      <Animated.View style={[entrance, pressStyle]}>
        <TouchableOpacity
          {...handlers}
          style={styles.addressRow}
          activeOpacity={1}
          onPress={() => { haptic.light(); onEdit(); }}
        >
          <View style={[styles.primaryDot, item.IsPrimary && styles.primaryDotActive]} />

          <View style={styles.addressContent}>
            <View style={styles.nameRow}>
              <Text style={styles.addressName}>{item.CustomerName}</Text>
              {item.IsPrimary ? (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                </View>
              ) : null}
            </View>
            {(item.Address || item.StreetName) ? (
              <Text style={styles.addressLine}>
                {[item.Address, item.StreetName].filter(Boolean).join(', ')}
              </Text>
            ) : null}
            {(item.City || item.Zipcode) ? (
              <Text style={styles.addressLine}>
                {[item.City, item.Zipcode].filter(Boolean).join(' — ')}
              </Text>
            ) : null}
            {item.Landmark ? (
              <Text style={styles.addressLineMuted}>{item.Landmark}</Text>
            ) : null}
            <Text style={styles.addressMobile}>{String(item.MobileNumber)}</Text>
          </View>

          <View style={styles.addressActions}>
            <TouchableOpacity
              onPress={() => { haptic.light(); onEdit(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}
            >
              <Icon name="pencil-outline" size={16} color={Colors.ink3} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { haptic.warning(); onDelete(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}
            >
              <Icon name="trash-outline" size={16} color={Colors.ink4} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
      {!isLast && <View style={styles.rowDivider} />}
    </Animated.View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
const AddressManagementScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { data: addresses, loading: fetchLoading, isError: fetchError, error: fetchErrorMsg, run } =
    useAsyncState<DeliveryAddress[]>([]);

  const [profileCode, setProfileCode]   = useState<number | null>(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]     = useState(EMPTY_ERRORS);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState<string | null>(null);
  const [editingCode, setEditingCode]   = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const toast = useAppToast();

  const fetchAddresses = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (!userData) return [];
        const user = JSON.parse(userData);
        setProfileCode(user.CustomerProfileCode);
        const response = await getDeliveryAddresses(user.CustomerProfileCode);
        return response.statusCode === 1 ? (response.result as DeliveryAddress[]) : [];
      }, cancelled),
    [run],
  );

  useEffect(() => {
    const cancelled = { current: false };
    fetchAddresses(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchAddresses]);

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors = {
      CustomerName: form.CustomerName.trim() ? '' : 'Name is required',
      MobileNumber: form.MobileNumber.trim() ? '' : 'Mobile number is required',
      Address:      form.Address.trim()      ? '' : 'Address is required',
      StreetName:   form.StreetName.trim()   ? '' : 'Street name is required',
      City:         form.City.trim()         ? '' : 'City is required',
      Landmark:     '',
      Zipcode:      form.Zipcode.trim()      ? '' : 'Zipcode is required',
    };
    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const startEdit = (item: DeliveryAddress) => {
    setEditingCode(item.OrderDeliveryAddressCode);
    setForm({
      CustomerName: item.CustomerName,
      MobileNumber: String(item.MobileNumber),
      Address:      item.Address      ?? '',
      StreetName:   item.StreetName   ?? '',
      City:         item.City         ?? '',
      Landmark:     item.Landmark     ?? '',
      Zipcode:      item.Zipcode      ?? '',
    });
    setFormErrors(EMPTY_ERRORS);
    setFormError(null);
  };

  const cancelEdit = () => {
    setEditingCode(null);
    setForm(EMPTY_FORM);
    setFormErrors(EMPTY_ERRORS);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!validateForm() || !profileCode) return;
    setFormError(null);
    setSubmitting(true);
    try {
      if (editingCode !== null) {
        const response = await postUpdateDeliveryAddress({
          OrderDeliveryAddressCode: editingCode,
          CustomerProfileCode:      profileCode,
          CustomerName:             form.CustomerName.trim(),
          MobileNumber:             Number(form.MobileNumber.trim()),
          Address:                  form.Address.trim(),
          StreetName:               form.StreetName.trim(),
          City:                     form.City.trim(),
          Landmark:                 form.Landmark.trim(),
          Zipcode:                  Number(form.Zipcode.trim()),
          IsPrimary:                0,
        });
        if (response.statusCode === 1) {
          run(async () => response.result as DeliveryAddress[]);
          cancelEdit();
        } else {
          setFormError(response.userMessage || 'Failed to update address.');
        }
      } else {
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
        });
        if (response.statusCode === 1) {
          run(async () => response.result as DeliveryAddress[]);
          cancelEdit();
        } else {
          setFormError(response.userMessage || 'Failed to save address.');
        }
      }
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (code: number) => setDeleteTarget(code);

  const confirmDelete = async () => {
    const code = deleteTarget;
    if (code === null) return;
    setDeleteTarget(null);
    try {
      const response = await postDeleteDeliveryAddress(code);
      if (response.statusCode === 1) {
        run(async () => response.result as DeliveryAddress[]);
        if (editingCode === code) cancelEdit();
      } else {
        toast.error({ title: 'Could not delete address', description: response.userMessage || undefined });
      }
    } catch (err) {
      toast.error({ title: 'Could not delete address', description: userFacingMessage(err) });
    }
  };

  const addressList = addresses ?? [];

  const FormSection = (
    <View style={styles.formSection}>
      <View style={styles.formHeader}>
        <Text style={styles.sectionEyebrow}>
          {editingCode !== null ? 'EDIT ADDRESS' : 'ADD NEW ADDRESS'}
        </Text>
        {editingCode !== null ? (
          <TouchableOpacity onPress={cancelEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.formFields}>
        <FloatingLabelInput
          label="Full name"
          value={form.CustomerName}
          onChangeText={t => handleChange('CustomerName', t)}
          error={formErrors.CustomerName || null}
          autoCapitalize="words"
          returnKeyType="next"
        />
        <FloatingLabelInput
          label="Mobile number"
          value={form.MobileNumber}
          onChangeText={t => handleChange('MobileNumber', t)}
          error={formErrors.MobileNumber || null}
          keyboardType="numeric"
          returnKeyType="next"
        />
        <FloatingLabelInput
          label="Address"
          value={form.Address}
          onChangeText={t => handleChange('Address', t)}
          error={formErrors.Address || null}
          autoCapitalize="sentences"
          returnKeyType="next"
        />
        <FloatingLabelInput
          label="Street name"
          value={form.StreetName}
          onChangeText={t => handleChange('StreetName', t)}
          error={formErrors.StreetName || null}
          autoCapitalize="sentences"
          returnKeyType="next"
        />
        <FloatingLabelInput
          label="City"
          value={form.City}
          onChangeText={t => handleChange('City', t)}
          error={formErrors.City || null}
          autoCapitalize="words"
          returnKeyType="next"
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
          error={formErrors.Zipcode || null}
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={handleSave}
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
            ? editingCode !== null ? 'Updating…' : 'Saving…'
            : editingCode !== null ? 'Update Address' : 'Save Address'}
        </Text>
      </TouchableOpacity>
    </View>
  );

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
        <Text style={styles.headerTitle}>Addresses</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.headerDivider} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        {fetchError ? (
          <ErrorState
            title="Couldn't load addresses"
            message={fetchErrorMsg ?? 'Tap retry to try again.'}
            onRetry={() => fetchAddresses()}
            retryLoading={fetchLoading}
          />
        ) : (
          <FlatList
            data={addressList}
            keyExtractor={item => String(item.OrderDeliveryAddressCode)}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + Space[8] },
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !fetchLoading ? (
                <EmptyState
                  icon={<Icon name="location-outline" size={26} color={Colors.ink4} />}
                  title="No saved addresses."
                  body="Add a delivery address below."
                />
              ) : null
            }
            renderItem={({ item, index }) => (
              <AddressRow
                item={item}
                onEdit={() => startEdit(item)}
                onDelete={() => requestDelete(item.OrderDeliveryAddressCode)}
                isLast={index === addressList.length - 1}
                delay={Math.min(index * 50, 200)}
              />
            )}
            ListFooterComponent={FormSection}
          />
        )}
      </KeyboardAvoidingView>

      {deleteTarget !== null && (
        <ConfirmSheet
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Delete address?"
          body="This address will be removed from your saved addresses."
          confirmLabel="Delete"
          destructive
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex: { flex: 1 },

  // ── Header ───────────────────────────────────────────────────────────────────
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
    flex:        1,
    fontFamily:  FontFamily.sans,
    fontSize:    18,
    fontWeight:  '600',
    color:       Colors.ink1,
    letterSpacing: -0.1,
  },
  headerRight: { width: 36 },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── List ─────────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
  },
  rowWrap: {},
  addressRow: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    paddingVertical: Space[4],
    gap:             Space[3],
  },
  primaryDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
    marginTop:    6,
    flexShrink:   0,
    backgroundColor: 'transparent',
  },
  primaryDotActive: {
    backgroundColor: Colors.accent,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
    flexWrap:      'wrap',
  },
  addressContent: {
    flex: 1,
    gap:  3,
  },
  addressName: {
    ...Type.body,
    color: Colors.ink1,
  },
  addressLine: {
    ...Type.caption,
    color:      Colors.ink3,
    lineHeight: 13 * 1.5,
  },
  addressLineMuted: {
    ...Type.caption,
    color:      Colors.ink4,
    lineHeight: 13 * 1.5,
  },
  addressMobile: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    color:         Colors.ink4,
    letterSpacing: 0.2,
    marginTop:     2,
  },
  primaryBadge: {
    backgroundColor: Colors.accent,
    borderRadius:    Radius.xs,
    paddingHorizontal: 5,
    paddingVertical:   2,
  },
  primaryBadgeText: {
    fontFamily:    FontFamily.mono,
    fontSize:      9,
    color:         '#FFFFFF',
    letterSpacing: 0.4,
  },
  addressActions: {
    flexDirection: 'column',
    gap:           Space[3],
    flexShrink:    0,
    paddingTop:    2,
  },
  actionBtn: {
    padding: 2,
  },
  rowDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginLeft:      Space[2] + 6,
  },

  // ── Form ─────────────────────────────────────────────────────────────────────
  formSection: {
    marginTop:      Space[8],
    paddingTop:     Space[6],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.rule,
  },
  formHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Space[3],
  },
  sectionEyebrow: {
    ...Type.label,
    color: Colors.ink4,
  },
  cancelText: {
    ...Type.caption,
    color: Colors.accent,
  },
  formFields: {
    gap:          Space[6],
    marginBottom: Space[5],
  },
  saveBtn: {
    borderWidth:     1.5,
    borderColor:     Colors.ink1,
    borderRadius:    Radius.pill,
    paddingVertical: Space[3] + 2,
    alignItems:      'center',
    marginTop:       Space[3],
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: {
    ...Type.bodyStrong,
    color: Colors.ink1,
  },
});

export default AddressManagementScreen;
