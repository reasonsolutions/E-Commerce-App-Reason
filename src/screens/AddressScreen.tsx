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
import { EmptyState, FloatingLabelInput, ErrorBanner } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { getDeliveryAddresses, postCreateDeliveryAddress } from '../api/address';
import { placeOrder } from '../api/order';
import { PlaceOrderInterface, SavedCartItemInterface } from '../api/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';

export interface DeliveryAddress {
  OrderDeliveryAddressCode: number;
  CustomerName: string;
  MobileNumber: number | string;
  CustomerProfileCode: number;
  CreatedDate: string;
  UpdatedDate: string | null;
  Address: string | null;
  StreetName: string | null;
  City: string | null;
  Landmark: string | null;
  Zipcode: string | null;
  IsPrimary: boolean;
}

type AddressScreenProps = {
  navigation: {
    goBack: () => void;
    navigate: {
      (screen: string): void;
      (screen: string, params: Record<string, any>): void;
    };
  };
  route: {
    params?: {
      cartItems?: SavedCartItemInterface[];
    };
  };
};

const EMPTY_FORM = { CustomerName: '', MobileNumber: '', Address: '', StreetName: '', City: '', Landmark: '', Zipcode: '' };
const EMPTY_ERRORS = { CustomerName: '', MobileNumber: '', Address: '', StreetName: '', City: '', Landmark: '', Zipcode: '' };

// ── Single address row ────────────────────────────────────────────────────────
const AddressRow: React.FC<{
  item: DeliveryAddress;
  isSelected: boolean;
  onPress: () => void;
  isLast: boolean;
  delay: number;
}> = ({ item, isSelected, onPress, isLast, delay }) => {
  const haptic   = useHaptic();
  const entrance = useEntrance(delay);
  const { animatedStyle: pressStyle, handlers } = useTactile();

  return (
    <Animated.View style={entrance}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          {...handlers}
          style={styles.addressRow}
          activeOpacity={1}
          onPress={() => { haptic.light(); onPress(); }}
        >
          {/* Selected: 2px ink left rule; unselected: transparent */}
          <View style={[styles.addressLeftRule, isSelected && styles.addressLeftRuleActive]} />

          <View style={styles.addressContent}>
            <Text style={[styles.addressName, isSelected && styles.addressNameSelected]}>
              {item.CustomerName}
            </Text>
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

          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      </Animated.View>
      {!isLast && <View style={styles.rowDivider} />}
    </Animated.View>
  );
};

// ── Place Order CTA — with tactile ───────────────────────────────────────────
const PlaceOrderButton: React.FC<{
  onPress: () => void;
  submitting: boolean;
  disabled: boolean;
}> = ({ onPress, submitting, disabled }) => {
  const haptic = useHaptic();
  const { animatedStyle, handlers } = useTactile();

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        {...handlers}
        style={[styles.ctaBtn, disabled && styles.ctaBtnDisabled]}
        onPress={() => { if (!disabled) { haptic.success(); onPress(); } }}
        activeOpacity={1}
        disabled={disabled}
      >
        <Text style={styles.ctaBtnText}>
          {submitting ? 'Placing order…' : 'Place Order'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
const AddressScreen: React.FC<AddressScreenProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();

  const { data: addresses, loading: fetchLoading, isError: fetchError, error: fetchErrorMsg, run } =
    useAsyncState<DeliveryAddress[]>([]);

  const [selectedAddressCode, setSelectedAddressCode] = useState<number | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState(EMPTY_ERRORS);
  const [profileCode, setProfileCode] = useState<number | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [orderError, setOrderError]   = useState<string | null>(null);
  const [addError, setAddError]       = useState<string | null>(null);

  const headerAnim = useEntrance(0);
  const footerAnim = useEntrance(120);

  const fetchAddresses = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (!userData) return [];
        const user = JSON.parse(userData);
        setProfileCode(user.CustomerProfileCode);
        const response = await getDeliveryAddresses(user.CustomerProfileCode);
        if (response.statusCode === 1) {
          const list: DeliveryAddress[] = response.result || [];
          // Auto-select most recent on first load
          if (list.length > 0) {
            setSelectedAddressCode(prev =>
              prev === null ? list[list.length - 1].OrderDeliveryAddressCode : prev,
            );
          }
          return list;
        }
        return [];
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
    // Clear field error on edit
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

  const handleAddAddress = async () => {
    if (!validateForm() || !profileCode) return;
    setAddError(null);
    setSubmitting(true);
    try {
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
        const list: DeliveryAddress[] = response.result || [];
        run(async () => list);
        if (list.length > 0) {
          setSelectedAddressCode(list[list.length - 1].OrderDeliveryAddressCode);
        }
        setForm(EMPTY_FORM);
        setFormErrors(EMPTY_ERRORS);
      } else {
        setAddError('Failed to save address. Please try again.');
      }
    } catch {
      setAddError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const buyProducts = async () => {
    if (submitting) return;
    setOrderError(null);

    if (!selectedAddressCode) {
      setOrderError('Please select a delivery address before continuing.');
      return;
    }

    const cartItems = route.params?.cartItems;
    if (!cartItems || cartItems.length === 0) {
      setOrderError('Your cart is empty. Please add items before checking out.');
      return;
    }
    if (!cartItems[0].CartMasterCode) {
      setOrderError('There was a problem with your cart. Please go back and try again.');
      return;
    }
    if (!profileCode) {
      setOrderError('Session expired. Please log in again.');
      return;
    }

    const total = cartItems.reduce((sum: number, item: SavedCartItemInterface) => sum + item.Price * item.Quantity, 0);

    // Extract OrganisationID from image path: "MER_{OrgID}/Products/..."
    const getOrgId = (images: string): string => {
      const match = images?.split(';')[0]?.match(/^MER_([^/]+)\//);
      return match ? match[1] : 'NULL';
    };

    // Group items by their OrganisationID
    const orgMap = new Map<string, SavedCartItemInterface[]>();
    for (const item of cartItems) {
      const orgId = getOrgId(item.Images);
      if (!orgMap.has(orgId)) orgMap.set(orgId, []);
      orgMap.get(orgId)!.push(item);
    }

    const orderDetails = Array.from(orgMap.entries()).map(([orgId, items]) => ({
      OrganisationID: orgId,
      ItemDetails: items.map((item: SavedCartItemInterface) => ({
        InventoryId:        item.InventoryId,
        Quantity:           item.Quantity,
        Amount:             item.Price * item.Quantity,
        DeliveryCharges:    0,
        DeliveryChargesVAT: 0,
        ItemCharges:        0,
        ItemChargesVAT:     0,
        Discount:           0,
        VAT:                0,
        OrderStatus:        1,
      })),
    }));

    const payload: PlaceOrderInterface = {
      CustomerProfileCode:       profileCode,
      OrderDeliveryAddressCode:  selectedAddressCode,
      CartMasterCode:            cartItems[0].CartMasterCode,
      TotalAmountBeforeDiscount: total,
      TotalAmountAfterDiscount:  total,
      OrderDetails:              orderDetails,
      PaymentDetails: {
        PaymentModes:   1,
        Remark:         'Cash on delivery',
        ModeOfPayments: [
          {
            CashOnDelivery: {
              ExpectedAmount:      total,
              CurrencyCode:        'MUR',
              CollectionReference: `COD-${cartItems[0].CartMasterCode}`,
            },
          },
        ],
      },
    };

    setSubmitting(true);
    try {
      const response = await placeOrder(payload);
      console.log('[placeOrder] response:', JSON.stringify(response, null, 2));

      if (response?.statusCode !== 1) {
        setOrderError(response?.userMessage || 'Could not place your order. Please try again.');
        return;
      }
      navigation.navigate('OrderSuccess', { orderNumber: response.result?.OrderNumber ?? '' });
    } catch (err: any) {
      console.log('[placeOrder] error:', err);
      setOrderError('Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addressList = addresses ?? [];

  // ── List sections ─────────────────────────────────────────────────────────
  const ListHeader = (
    <>
      <Text style={styles.sectionEyebrow}>DELIVERY TO</Text>
      {fetchError ? (
        <View style={styles.fetchErrorWrap}>
          <ErrorState
            title="Couldn't load addresses"
            message={fetchErrorMsg ?? 'Something went wrong.'}
            onRetry={() => fetchAddresses()}
            retryLoading={fetchLoading}
          />
        </View>
      ) : null}
    </>
  );

  const ListFooter = (
    <View style={styles.formSection}>
      <Text style={styles.sectionEyebrow}>ADD NEW ADDRESS</Text>
      <View style={styles.formFields}>
        <FloatingLabelInput
          label="Full name"
          value={form.CustomerName}
          onChangeText={text => handleChange('CustomerName', text)}
          error={formErrors.CustomerName || null}
          autoCapitalize="words"
          returnKeyType="next"
        />
        <FloatingLabelInput
          label="Mobile number"
          value={form.MobileNumber}
          onChangeText={text => handleChange('MobileNumber', text)}
          error={formErrors.MobileNumber || null}
          keyboardType="numeric"
          returnKeyType="next"
        />
        <FloatingLabelInput
          label="Address"
          value={form.Address}
          onChangeText={text => handleChange('Address', text)}
          error={formErrors.Address || null}
          autoCapitalize="sentences"
          returnKeyType="next"
        />
        <FloatingLabelInput
          label="Street name"
          value={form.StreetName}
          onChangeText={text => handleChange('StreetName', text)}
          error={formErrors.StreetName || null}
          autoCapitalize="sentences"
          returnKeyType="next"
        />
        <FloatingLabelInput
          label="City"
          value={form.City}
          onChangeText={text => handleChange('City', text)}
          error={formErrors.City || null}
          autoCapitalize="words"
          returnKeyType="next"
        />
        <FloatingLabelInput
          label="Landmark (optional)"
          value={form.Landmark}
          onChangeText={text => handleChange('Landmark', text)}
          autoCapitalize="sentences"
          returnKeyType="next"
        />
        <FloatingLabelInput
          label="Zipcode"
          value={form.Zipcode}
          onChangeText={text => handleChange('Zipcode', text)}
          error={formErrors.Zipcode || null}
          keyboardType="numeric"
          returnKeyType="done"
        />
      </View>
      {addError ? (
        <ErrorBanner
          body={addError}
          onRetry={() => setAddError(null)}
        />
      ) : null}
      {/* Save address — secondary ink pill, not primary CTA weight */}
      <TouchableOpacity
        style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
        onPress={handleAddAddress}
        disabled={submitting}
        activeOpacity={0.82}
      >
        <Text style={styles.saveBtnText}>
          {submitting ? 'Saving…' : 'Save Address'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />

      {/* Dark editorial header */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + Space[2] }, headerAnim]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerEyebrow}>CHECKOUT</Text>
            <Text style={styles.headerTitle}>Delivery</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.headerSeam} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={fetchError ? [] : addressList}
          keyExtractor={item => String(item.OrderDeliveryAddressCode)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 96 + Space[4] },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            fetchError ? null : (
              <EmptyState
                icon={<Icon name="location-outline" size={26} color={Colors.ink4} />}
                title="No saved addresses."
                body="Add a delivery address below."
              />
            )
          }
          renderItem={({ item, index }) => (
            <AddressRow
              item={item}
              isSelected={selectedAddressCode === item.OrderDeliveryAddressCode}
              onPress={() => setSelectedAddressCode(item.OrderDeliveryAddressCode)}
              isLast={index === addressList.length - 1}
              delay={Math.min(index * 50, 200)}
            />
          )}
          ListFooterComponent={ListFooter}
        />

        {/* Anchored Place Order CTA */}
        <Animated.View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + Space[4] },
            footerAnim,
          ]}
        >
          {orderError ? (
            <ErrorBanner
              body={orderError ?? undefined}
              onRetry={() => setOrderError(null)}
            />
          ) : null}
          <PlaceOrderButton
            onPress={buyProducts}
            submitting={submitting}
            disabled={!selectedAddressCode || submitting}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex: {
    flex: 1,
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    backgroundColor:   Colors.ink1,
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  backBtn: {
    width:  36,
    height: 36,
    justifyContent: 'center',
    alignItems:     'center',
  },
  headerTitleBlock: {
    flex: 1,
    paddingHorizontal: Space[3],
    gap: 3,
  },
  headerEyebrow: {
    ...Type.label,
    color: 'rgba(255,255,255,0.30)',
  },
  headerTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      26,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight:    26 * 1.1,
  },
  headerRight: {
    width: 36,
  },
  headerSeam: {
    height:           StyleSheet.hairlineWidth,
    backgroundColor:  'rgba(255,255,255,0.06)',
    marginTop:        Space[4],
    marginHorizontal: -Space.screenH,
  },

  // ── List ──────────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
  },
  sectionEyebrow: {
    ...Type.label,
    color:        Colors.ink4,
    marginBottom: Space[3],
  },
  fetchErrorWrap: {
    marginBottom: Space[4],
  },

  // ── Address row — no card boxing, left rule selected state ────────────────────
  addressRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    paddingVertical: Space[4],
    gap:             Space[3],
  },
  addressLeftRule: {
    width:        2,
    alignSelf:    'stretch',
    borderRadius: 1,
    backgroundColor: 'transparent',
    flexShrink:   0,
  },
  addressLeftRuleActive: {
    backgroundColor: Colors.ink1,
  },
  addressContent: {
    flex: 1,
    gap:  3,
  },
  addressName: {
    ...Type.body,
    color: Colors.ink2,
  },
  addressNameSelected: {
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
  },
  addressRight: {
    flexDirection:  'column',
    alignItems:     'center',
    gap:            Space[2],
    flexShrink:     0,
  },
  deleteBtn: {
    padding: 2,
  },
  radioOuter: {
    width:         18,
    height:        18,
    borderRadius:  9,
    borderWidth:   1.5,
    borderColor:   Colors.ink5,
    alignItems:    'center',
    justifyContent: 'center',
    marginTop:     3,
    flexShrink:    0,
  },
  radioOuterSelected: {
    borderColor: Colors.ink1,
  },
  radioInner: {
    width:         9,
    height:        9,
    borderRadius:  5,
    backgroundColor: Colors.ink1,
  },
  rowDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginLeft:      Space[2] + 2, // indent past left rule
  },

  // ── Add address form ──────────────────────────────────────────────────────────
  formSection: {
    marginTop:  Space[8],
    paddingTop: Space[6],
    borderTopWidth:  StyleSheet.hairlineWidth,
    borderTopColor:  Colors.rule,
  },
  formFields: {
    gap: Space[6],
    marginBottom: Space[5],
  },
  // Secondary ink pill — lighter weight than Place Order CTA
  saveBtn: {
    borderWidth:      1.5,
    borderColor:      Colors.ink1,
    borderRadius:     Radius.pill,
    paddingVertical:  Space[3] + 2,
    alignItems:       'center',
    marginTop:        Space[3],
  },
  saveBtnDisabled: {
    opacity: 0.35,
  },
  saveBtnText: {
    ...Type.bodyStrong,
    color: Colors.ink1,
  },

  // ── Footer — anchored Place Order ─────────────────────────────────────────────
  footer: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[3],
    backgroundColor:   Colors.surface,
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
    gap:               Space[3],
  },
  ctaBtn: {
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    height:          52,
    alignItems:      'center',
    justifyContent:  'center',
  },
  ctaBtnDisabled: {
    opacity: 0.35,
  },
  ctaBtnText: {
    ...Type.bodyStrong,
    color: '#FFFFFF',
  },
});

export default AddressScreen;
