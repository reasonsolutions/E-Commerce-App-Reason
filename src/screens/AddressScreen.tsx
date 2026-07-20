import React, { useCallback, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { EmptyState, FloatingLabelInput, ErrorBanner, Skeleton, TrustLine } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { getDeliveryAddresses, postCreateDeliveryAddress } from '../api/address';
import { userFacingMessage } from '../api/apiError';
import { placeOrder } from '../api/order';
import { useCart } from '../context/CartContext';
import { SavedCartItemInterface, PlaceOrderInterface } from '../api/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { getOrgIdForInventory } from '../api/product';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { PaymentModes } from '../config/enum_files/PaymentModes';
import { AddressLabel } from '../config/enum_files/AddressLabel';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { Motion } from '../theme/motion';

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
  AddressLabel?: AddressLabel | null;
}

type AddressScreenProps = {
  navigation: {
    goBack: () => void;
    navigate: {
      (screen: string): void;
      (screen: string, params: Record<string, any>): void;
    };
    replace: {
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

const LABEL_ICON: Record<AddressLabel, string> = {
  [AddressLabel.Home]:  'home-outline',
  [AddressLabel.Work]:  'briefcase-outline',
  [AddressLabel.Other]: 'location-outline',
};
const LABEL_TEXT: Record<AddressLabel, string> = {
  [AddressLabel.Home]:  'HOME',
  [AddressLabel.Work]:  'WORK',
  [AddressLabel.Other]: 'OTHER',
};
const LABEL_OPTIONS = [AddressLabel.Home, AddressLabel.Work, AddressLabel.Other];

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
            {item.AddressLabel ? (
              <View style={styles.labelChip}>
                <Icon name={LABEL_ICON[item.AddressLabel]} size={11} color={Colors.brandNavy} />
                <Text style={styles.labelChipText}>{LABEL_TEXT[item.AddressLabel]}</Text>
              </View>
            ) : null}
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

  const { setCartCount } = useCart();
  const { data: addresses, loading: fetchLoading, isError: fetchError, error: fetchErrorMsg, run } =
    useAsyncState<DeliveryAddress[]>([]);

  const [selectedAddressCode, setSelectedAddressCode] = useState<number | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState(EMPTY_ERRORS);
  const [addressLabel, setAddressLabel] = useState<AddressLabel | null>(null);
  const [profileCode, setProfileCode] = useState<number | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError]     = useState<string | null>(null);
  const [addError, setAddError]         = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'card' | 'cod'>('card');

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

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      fetchAddresses(cancelled);
      return () => { cancelled.current = true; };
    }, [fetchAddresses]),
  );

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
    setSavingAddress(true);
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
        AddressLabel:        addressLabel ?? undefined,
      });
      if (response.statusCode === 1) {
        const list: DeliveryAddress[] = response.result || [];
        run(async () => list);
        if (list.length > 0) {
          setSelectedAddressCode(list[list.length - 1].OrderDeliveryAddressCode);
        }
        setForm(EMPTY_FORM);
        setFormErrors(EMPTY_ERRORS);
        setAddressLabel(null);
      } else {
        setAddError('Failed to save address. Please try again.');
      }
    } catch {
      setAddError("Couldn't save your address. Tap retry to try again.");
    } finally {
      setSavingAddress(false);
    }
  };

  const buyProducts = async () => {
    if (orderSubmitting) return;
    setOrderError(null);

    if (!selectedAddressCode) {
      setOrderError('Please select a delivery address before continuing.');
      return;
    }

    const items = route.params?.cartItems;
    if (!items || items.length === 0) {
      setOrderError('Your cart is empty. Please add items before checking out.');
      return;
    }
    if (!items[0].CartMasterCode) {
      setOrderError('There was a problem with your cart. Please go back and try again.');
      return;
    }
    if (!profileCode) {
      setOrderError('Session expired. Please log in again.');
      return;
    }

    const total = items.reduce(
      (sum: number, item: SavedCartItemInterface) => sum + item.Price * item.Quantity,
      0,
    );

    const selectedAddr = (addresses ?? []).find(
      a => a.OrderDeliveryAddressCode === selectedAddressCode,
    );
    if (!selectedAddr) {
      setOrderError('Selected address could not be found. Please choose again.');
      return;
    }

    setOrderSubmitting(true);

    if (selectedPayment === 'card') {
      const transactionId = `TXN-${items[0].CartMasterCode}-${Date.now()}`;
      await AsyncStorage.setItem(STORAGE_KEYS.orderId, transactionId);
      setOrderSubmitting(false);
      navigation.navigate('EcomPayment', {
        profileCode,
        cartItems: items,
        selectedAddress: selectedAddr,
        orderTotal: total,
      });
      return;
    }

    // COD — place order directly
    try {
      const orgMap = new Map<string, SavedCartItemInterface[]>();
      for (const item of items) {
        const orgId = item.OrganisationId || getOrgIdForInventory(item.InventoryId);
        if (!orgMap.has(orgId)) orgMap.set(orgId, []);
        orgMap.get(orgId)!.push(item);
      }

      const orderDetails = Array.from(orgMap.entries()).map(([orgId, orgItems]) => ({
        OrganisationID: orgId,
        ItemDetails: orgItems.map((item: SavedCartItemInterface) => ({
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
          Taxes: (item.PriceDetails?.Taxes ?? []).map(t => ({
            TaxId:   t.TaxId,
            TaxName: '',
            TaxType: t.TaxType,
            TaxRate: t.TaxRate,
            Reason:  '',
          })),
        })),
      }));

      const payload: PlaceOrderInterface = {
        CustomerProfileCode:       profileCode,
        OrderDeliveryAddressCode:  selectedAddressCode,
        CartMasterCode:            items[0].CartMasterCode,
        TotalAmountBeforeDiscount: total,
        TotalAmountAfterDiscount:  total,
        OrderDetails:              orderDetails,
        PaymentDetails: {
          PaymentModes:   PaymentModes.CashOnDelivery,
          Remark:         'Cash on delivery',
          IsPaid:         false,
          ModeOfPayments: [{
            CashOnDelivery: {
              ExpectedAmount:      total,
              CurrencyCode:        'MUR',
              CollectionReference: `COD-${items[0].CartMasterCode}-${Date.now()}`,
            },
          }],
        },
      };

      const response = await placeOrder(payload);

      if (response?.statusCode !== 1) {
        setOrderError(response?.userMessage ?? 'Could not place your order. Please try again.');
        return;
      }

      setCartCount(0);
      const result = response.result;
      const firstStatus = result?.SubOrders?.[0]?.ItemDetails?.[0]?.OrderStatus ?? 1;
      navigation.replace('OrderSuccess', {
        orderNumber:              result?.OrderNumber ?? '',
        itemCount:                items.length,
        orderTotal:               result?.TotalAmountAfterDiscount ?? total,
        orderTotalBeforeDiscount: result?.TotalAmountBeforeDiscount ?? total,
        orderCurrency:            'MUR',
        orderTimestamp:           result?.CreatedDate ?? null,
        orderStatus:              firstStatus,
        paymentMethod:            result?.PaymentMethod ?? null,
        deliveryAddress: {
          street: [selectedAddr?.Address, selectedAddr?.StreetName].filter(Boolean).join(', '),
          city:   selectedAddr?.City ?? '',
        },
        cartItems: items.map((item: SavedCartItemInterface) => ({
          name:         item.Name,
          quantity:     item.Quantity,
          price:        item.Price,
          comparePrice: item.PriceDetails?.ComparePrice ?? 0,
          image:        resolveImageUrl(item.Images),
        })),
      });
    } catch (err) {
      setOrderError(userFacingMessage(err));
    } finally {
      setOrderSubmitting(false);
    }
  };

  const addressList = addresses ?? [];
  const showSkeleton = fetchLoading && addressList.length === 0;
  const showEmptyState = !fetchLoading && !fetchError && addressList.length === 0 && !showForm;

  // ── Address form — shown when user taps "Add Address" or has existing addresses ─
  const AddressForm = (
    <View style={styles.formSection}>
      <Text style={styles.sectionEyebrow}>ADD NEW ADDRESS</Text>
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
      <TouchableOpacity
        style={[styles.saveBtn, savingAddress && styles.saveBtnDisabled]}
        onPress={handleAddAddress}
        disabled={savingAddress}
        activeOpacity={0.82}
      >
        <Text style={styles.saveBtnText}>
          {savingAddress ? 'Saving…' : 'Save Address'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ── List sections ─────────────────────────────────────────────────────────
  const ListHeader = (
    <>
      <Text style={styles.sectionEyebrow}>DELIVERY TO</Text>
      {fetchError ? (
        <View style={styles.fetchErrorWrap}>
          <ErrorState
            title="Couldn't load addresses."
            message={fetchErrorMsg ?? 'Check your connection and try again.'}
            onRetry={() => fetchAddresses()}
            retryLoading={fetchLoading}
          />
        </View>
      ) : null}
      {/* Skeleton rows during initial fetch */}
      {showSkeleton ? (
        <View style={styles.skeletonWrap}>
          {[0, 1].map(i => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={20} height={20} radius={10} />
              <View style={styles.skeletonLines}>
                <Skeleton width="55%" height={11} />
                <Skeleton width="85%" height={9} style={styles.skeletonLine} />
                <Skeleton width="70%" height={9} style={styles.skeletonLine} />
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );

  const ListFooter = showEmptyState ? (
    // Empty state — form hidden, outline CTA reveals it
    <View style={styles.emptyStateWrap}>
      <EmptyState
        icon={<Icon name="location-outline" size={22} color={Colors.ink4} />}
        title="No delivery address."
        body="Add an address to continue to payment."
        trustLine={<TrustLine message="Your details are encrypted" />}
        action={
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => setShowForm(true)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Add address"
          >
            <Text style={styles.emptyAddBtnText}>Add Address</Text>
          </TouchableOpacity>
        }
      />
    </View>
  ) : showForm || addressList.length > 0 ? (
    AddressForm
  ) : null;

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
        <Text style={styles.headerTitle}>Delivery</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.headerDivider} />

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
          renderItem={({ item, index }) => (
            <AddressRow
              item={item}
              isSelected={selectedAddressCode === item.OrderDeliveryAddressCode}
              onPress={() => setSelectedAddressCode(item.OrderDeliveryAddressCode)}
              isLast={index === addressList.length - 1}
              delay={Motion.stagger.delay(index)}
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
          {/* Payment method picker */}
          <Text style={styles.paymentLabel}>PAYMENT METHOD</Text>
          <View style={styles.paymentRow}>
            {(['card', 'cod'] as const).map(method => (
              <TouchableOpacity
                key={method}
                style={[styles.paymentOption, selectedPayment === method && styles.paymentOptionSelected]}
                onPress={() => setSelectedPayment(method)}
                activeOpacity={0.8}
              >
                <View style={[styles.paymentRadio, selectedPayment === method && styles.paymentRadioSelected]} />
                <Text style={[styles.paymentOptionText, selectedPayment === method && styles.paymentOptionTextSelected]}>
                  {method === 'card' ? 'Card / Online' : 'Cash on Delivery'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {orderError ? (
            <ErrorBanner
              body={orderError ?? undefined}
              onRetry={() => setOrderError(null)}
            />
          ) : null}
          <PlaceOrderButton
            onPress={buyProducts}
            submitting={orderSubmitting}
            disabled={!selectedAddressCode || orderSubmitting}
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
  headerRight: {
    width: 36,
  },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  flex: {
    flex: 1,
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
    backgroundColor: Colors.brandNavy,
  },
  addressContent: {
    flex: 1,
    gap:  3,
  },
  labelChip: {
    flexDirection:     'row',
    alignItems:        'center',
    alignSelf:         'flex-start',
    gap:               5,
    backgroundColor:   Colors.brandNavyTint,
    borderRadius:      Radius.pill,
    paddingVertical:   3,
    paddingHorizontal: 8,
    marginBottom:      4,
  },
  labelChipText: {
    ...Type.label,
    fontSize:      10,
    color:         Colors.brandNavy,
    letterSpacing: 0.4,
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
    fontSize:      11,
    fontWeight:    '500',
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
    borderColor: Colors.brandNavy,
  },
  radioInner: {
    width:         9,
    height:        9,
    borderRadius:  5,
    backgroundColor: Colors.brandNavy,
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
  labelPickerRow: {
    flexDirection: 'row',
    gap:           Space[2],
    marginTop:     Space[3],
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
    gap: Space[6],
    marginBottom: Space[5],
  },
  // Secondary navy pill — lighter weight than Place Order CTA
  saveBtn: {
    borderWidth:      1.5,
    borderColor:      Colors.brandNavy,
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
    color: Colors.brandNavy,
  },

  // ── Payment method picker ─────────────────────────────────────────────────────
  paymentLabel: {
    ...Type.label,
    color:        Colors.ink4,
    marginBottom: Space[2],
  },
  paymentRow: {
    flexDirection: 'row',
    gap:           Space[3],
  },
  paymentOption: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Space[2],
    paddingVertical: Space[3],
    paddingHorizontal: Space[3],
    borderRadius:    Radius.sm,
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     Colors.rule,
    backgroundColor: Colors.surfaceSoft,
  },
  paymentOptionSelected: {
    borderColor:     Colors.brandNavy,
    backgroundColor: Colors.surface,
  },
  paymentRadio: {
    width:        14,
    height:       14,
    borderRadius: 7,
    borderWidth:  1.5,
    borderColor:  Colors.ink4,
    flexShrink:   0,
  },
  paymentRadioSelected: {
    borderColor:     Colors.brandNavy,
    backgroundColor: Colors.brandNavy,
  },
  paymentOptionText: {
    ...Type.caption,
    color: Colors.ink3,
    flex:  1,
  },
  paymentOptionTextSelected: {
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
    backgroundColor: Colors.brandNavy,
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

  // ── Address fetch skeleton ────────────────────────────────────────────────────
  skeletonWrap: {
    gap: Space[1],
    marginBottom: Space[2],
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[3],
    paddingVertical: Space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  skeletonLines: {
    flex: 1,
    gap:  Space[1],
  },
  skeletonLine: {
    marginTop: Space[1],
  },

  // ── Empty state (no addresses yet) ───────────────────────────────────────────
  emptyStateWrap: {
    marginTop: Space[4],
  },
  emptyAddBtn: {
    height:          44,
    borderWidth:     1.5,
    borderColor:     Colors.brandNavy,
    borderRadius:    Radius.pill,
    paddingHorizontal: Space[6],
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       Space[2],
  },
  emptyAddBtnText: {
    ...Type.bodyStrong,
    color: Colors.brandNavy,
  },
});

export default AddressScreen;
