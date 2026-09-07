import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ErrorBanner } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { getDeliveryAddresses } from '../api/address';
import { userFacingMessage } from '../api/apiError';
import { placeOrder } from '../api/order';
import { getSavedCartItems } from '../api/cart';
import { useCart } from '../context/CartContext';
import { PlaceOrderInterface, SavedCartSummaryInterface } from '../api/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { AddressLabel } from '../config/enum_files/AddressLabel';
import { dialCodeForCountry } from '../config/countries';
import { PaymentModes } from '../config/enum_files/PaymentModes';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { paymentModeLabel } from '../utils/paymentMode';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';

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
  DeletedDate?: string | null;
  AddressLabel?: AddressLabel | null;
  CountryCode: number | null;
}

type CheckoutScreenProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

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
        style={[styles.placeOrderBtn, disabled && styles.placeOrderBtnDisabled]}
        onPress={() => { if (!disabled) { haptic.success(); onPress(); } }}
        activeOpacity={1}
        disabled={disabled}
      >
        <Text style={styles.placeOrderBtnText}>
          {submitting ? 'Placing order…' : 'Place Order'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { setCartCount } = useCart();

  const { loading: fetchLoading, isError: fetchError, run: runAddressFetch } =
    useAsyncState<DeliveryAddress[]>([]);
  const { data: cartSummary, loading: cartLoading, run: runCartFetch } =
    useAsyncState<SavedCartSummaryInterface | null>(null);

  const [summary, setSummary] = useState<SavedCartSummaryInterface | null>(null);
  const [primaryAddress, setPrimaryAddress] = useState<DeliveryAddress | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'card' | 'cod'>('card');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

  const footerAnim = useEntrance(120);

  const fetchAddresses = useCallback(
    (cancelled?: { current: boolean }) =>
      runAddressFetch(async () => {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (!userData) return [];
        const user = JSON.parse(userData);
        const response = await getDeliveryAddresses(user.CustomerProfileCode);
        if (response.statusCode === 1) {
          const list: DeliveryAddress[] = response.result || [];
          const primary = list.find(a => a.IsPrimary) || list[0] || null;
          setPrimaryAddress(primary);
          return list;
        }
        return [];
      }, cancelled),
    [runAddressFetch],
  );

  const fetchCart = useCallback(
    (cancelled?: { current: boolean }) =>
      runCartFetch(async () => {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (!userData) return null;
        const user = JSON.parse(userData);
        const response = await getSavedCartItems(user.CustomerProfileCode);
        if (response.statusCode === 1 && response.result) {
          return response.result;
        }
        return null;
      }, cancelled),
    [runCartFetch],
  );

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      fetchAddresses(cancelled);
      fetchCart(cancelled);
      return () => { cancelled.current = true; };
    }, [fetchAddresses, fetchCart]),
  );

  React.useEffect(() => {
    if (cartSummary) {
      setSummary(cartSummary);
    }
  }, [cartSummary]);

  const placeOrderHandler = async () => {
    if (orderSubmitting || !summary || !primaryAddress) return;
    setOrderError(null);
    setOrderSubmitting(true);

    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      if (!userData) {
        setOrderError('Session expired. Please log in again.');
        return;
      }

      const user = JSON.parse(userData);

      // For card payments, navigate to payment screen instead
      if (selectedPayment === 'card') {
        const transactionId = `TXN-${summary.Items?.[0]?.CartMasterCode || Date.now()}-${Date.now()}`;
        await AsyncStorage.setItem(STORAGE_KEYS.orderId, transactionId);
        setOrderSubmitting(false);
        navigation.navigate('EcomPayment', {
          profileCode: user.CustomerProfileCode,
          cartItems: summary.Items || [],
          selectedAddress: primaryAddress,
          orderTotal: summary.AmountToBePaid,
        });
        return;
      }

      // COD — place order directly
      const currencyCode = 'MUR'; // TODO: make dynamic from config if needed
      const payload: PlaceOrderInterface = {
        CustomerProfileCode: user.CustomerProfileCode,
        OrderDeliveryAddressCode: primaryAddress.OrderDeliveryAddressCode,
        CartMasterCode: summary.Items?.[0]?.CartMasterCode,
        AmountPaid: summary.AmountToBePaid,
        PaymentDetails: {
          PaymentModes: PaymentModes.CashOnDelivery,
          Remark: selectedPayment === 'cod' ? 'Cash on delivery' : 'Card payment',
          IsPaid: false,
          ModeOfPayments: [{
            CashOnDelivery: {
              ExpectedAmount: summary.AmountToBePaid,
              CurrencyCode: currencyCode,
              CollectionReference: `COD-${summary.Items?.[0]?.CartMasterCode || 'cart'}-${Date.now()}`,
            },
          }],
        },
      };

      const response = await placeOrder(payload);
      if (response.statusCode === 1 && response.result) {
        setCartCount(0);
        const result = response.result;
        navigation.replace('OrderSuccess', {
          orderNumber: result?.OrderNumber ?? '',
          itemCount: summary.Items?.length,
          orderTotal: result?.PaymentAmount ?? summary.AmountToBePaid,
          totalSaved: result?.TotalSaved ?? 0,
          orderCurrency: currencyCode,
          orderTimestamp: result?.CreatedDate ?? null,
          paymentMethod: paymentModeLabel(result?.PaymentMode),
          deliveryAddress: {
            street: [primaryAddress?.Address, primaryAddress?.StreetName].filter(Boolean).join(', '),
            city: primaryAddress?.City ?? '',
          },
          cartItems: (result?.SubOrders ?? []).flatMap(sub =>
            (sub.ItemDetails ?? []).map(item => ({
              name: item.ItemName,
              quantity: item.Quantity,
              price: item.Amount,
              comparePrice: item.Amount + item.Discount,
              image: resolveImageUrl(item.Images),
            })),
          ),
        });
      } else {
        setOrderError(response.userMessage || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      setOrderError(userFacingMessage(err));
    } finally {
      setOrderSubmitting(false);
    }
  };

  const itemCount = summary?.Items?.length || 0;
  const totalItems = summary?.Items?.reduce((sum, item) => sum + item.Quantity, 0) || 0;

  if (fetchError) {
    return (
      <ErrorState
        title="Couldn't load checkout."
        message="Check your connection and try again."
        onRetry={() => fetchAddresses()}
        retryLoading={fetchLoading}
      />
    );
  }

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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 240 }}
      >
        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>DELIVERING TO</Text>
          {primaryAddress ? (
            <>
              <TouchableOpacity
                style={styles.addressCard}
                onPress={() => navigation.navigate('AddressManagement', { from: 'checkout' })}
                activeOpacity={0.7}
              >
                <View style={styles.addressContent}>
                  <Text style={styles.addressName}>{primaryAddress.CustomerName}</Text>
                  <Text style={styles.addressText}>
                    {primaryAddress.Address}{primaryAddress.Address && primaryAddress.City ? '\n' : ''}{primaryAddress.City}
                  </Text>
                  {primaryAddress.MobileNumber && (
                    <View style={styles.addressMobileRow}>
                      <Icon name="call-outline" size={11} color={Colors.ink4} />
                      <Text style={styles.addressMobile}>
                        {dialCodeForCountry(primaryAddress.CountryCode ?? undefined)} {primaryAddress.MobileNumber}
                      </Text>
                    </View>
                  )}
                </View>
                <Icon name="chevron-forward" size={20} color={Colors.ink3} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddressManagement', { from: 'checkout' })}
                activeOpacity={0.7}
              >
                <Text style={styles.changeAddressLink}>Change delivery address</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.addressCard}
              onPress={() => navigation.navigate('AddressManagement', { from: 'checkout' })}
              activeOpacity={0.7}
            >
              <View style={styles.addressContent}>
                <Text style={styles.addressName}>Add a delivery address</Text>
                <Text style={styles.addressText}>Required to place your order</Text>
              </View>
              <Icon name="add-circle-outline" size={22} color={Colors.ink3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Payment Method Section */}
        <View style={styles.paymentMethodsSection}>
          <Text style={styles.sectionEyebrow}>PAYMENT METHOD</Text>
          {(['card', 'cod'] as const).map(method => (
            <TouchableOpacity
              key={method}
              style={[
                styles.paymentMethodCard,
                selectedPayment === method && styles.paymentMethodCardSelected,
              ]}
              onPress={() => setSelectedPayment(method)}
              activeOpacity={0.98}
            >
              <View
                style={[
                  styles.paymentIconTile,
                  selectedPayment === method && styles.paymentIconTileSelected,
                ]}
              >
                {method === 'card' ? (
                  <Icon name="card-outline" size={20} color={selectedPayment === method ? Colors.surface : Colors.ink1} />
                ) : (
                  <Icon name="cash-outline" size={20} color={selectedPayment === method ? Colors.surface : Colors.ink1} />
                )}
              </View>
              <View style={styles.paymentMethodContent}>
                <Text style={styles.paymentMethodLabel}>
                  {method === 'card' ? 'Card / Online' : 'Cash on Delivery'}
                </Text>
                <Text style={styles.paymentMethodSub}>
                  {method === 'card' ? 'Visa, Mastercard, wallets' : 'Pay when it arrives'}
                </Text>
              </View>
              <View
                style={[
                  styles.paymentRadio,
                  selectedPayment === method && styles.paymentRadioSelected,
                ]}
              >
                {selectedPayment === method && <View style={styles.paymentRadioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary Section */}
        {summary && (
          <View style={styles.section}>
            <View style={styles.summaryHeader}>
              <Text style={styles.sectionEyebrow}>ORDER SUMMARY</Text>
              <View style={styles.summaryHeaderActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Cart')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editBagText}>Edit Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSummaryOpen(!summaryOpen)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toggleSummaryText}>
                    {summaryOpen ? 'Hide' : `View (${itemCount})`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {summaryOpen && summary.Items && summary.Items.length > 0 && (
              <View style={styles.itemsListCard}>
                {summary.Items.map((item, index) => (
                  <React.Fragment key={item.InventoryId}>
                    {index > 0 && <View style={styles.itemDivider} />}
                    <View style={styles.itemRow}>
                      <Image
                        source={{ uri: resolveImageUrl(item.Images) }}
                        style={styles.itemImage}
                      />
                      <View style={styles.itemContent}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.Name}
                        </Text>
                        <Text style={styles.itemVariant}>
                          Qty {item.Quantity}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        Rs {(item.PriceDetails?.Price || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}

            <View style={styles.priceBreakdownCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>MRP</Text>
                <Text style={[styles.priceValue, summary.TotalSaved > 0 && styles.mrpValueStruck]}>
                  Rs {summary.ItemsTotal.toLocaleString('en-IN')}
                </Text>
              </View>

              {summary.TotalSaved > 0 && (
                <View style={styles.savingsRow}>
                  <Text style={styles.savingsLabel}>You save</Text>
                  <Text style={styles.savingsValue}>
                    Rs {summary.TotalSaved.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery</Text>
                <Text style={[styles.priceValue, summary.TotalShippingCharge === 0 && styles.freeShipping]}>
                  {summary.TotalShippingCharge === 0 ? 'Free' : `Rs ${summary.TotalShippingCharge.toLocaleString('en-IN')}`}
                </Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total</Text>
                <View style={styles.totalAmountValueWrap}>
                  <Text style={styles.priceValue}>
                    Rs {summary.AmountToBePaid.toLocaleString('en-IN')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTaxBreakdown(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.inclTaxesText}>incl. taxes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Trust Row */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Icon name="checkmark-circle-outline" size={14} color={Colors.ink3} />
            <Text style={styles.trustText}>Secure Checkout</Text>
          </View>
          <View style={styles.trustItem}>
            <Icon name="checkmark-circle-outline" size={14} color={Colors.ink3} />
            <Text style={styles.trustText}>Easy Returns</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <Animated.View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + Space[4] },
          footerAnim,
        ]}
      >
        {summary && (
          <>
            <View style={styles.payableSection}>
              <View>
                <Text style={styles.payableLabel}>PAYABLE NOW</Text>
                <TouchableOpacity
                  onPress={() => setSummaryOpen(!summaryOpen)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.itemCountLink}>{totalItems} items</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.payableAmount}>
                Rs {summary.AmountToBePaid.toLocaleString('en-IN')}
              </Text>
            </View>
          </>
        )}

        {orderError && (
          <ErrorBanner
            title="Order Error"
            body={orderError}
            onRetry={() => setOrderError(null)}
          />
        )}

        <PlaceOrderButton
          onPress={placeOrderHandler}
          submitting={orderSubmitting}
          disabled={!primaryAddress || orderSubmitting}
        />
      </Animated.View>

      {/* ── Tax Breakdown Sheet ────────────────────────────────────────── */}
      {showTaxBreakdown && summary && (
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            onPress={() => setShowTaxBreakdown(false)}
            activeOpacity={1}
          />
          <View style={[styles.taxSheet, { paddingBottom: insets.bottom + Space[4] }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Price Breakdown</Text>
              <TouchableOpacity
                onPress={() => setShowTaxBreakdown(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={24} color={Colors.ink1} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
              {/* Total Amount */}
              <View style={styles.breakdownRowTotal}>
                <Text style={styles.breakdownLabelTotal}>Total Amount (incl. taxes)</Text>
                <Text style={styles.breakdownValueTotal}>
                  Rs {summary.AmountToBePaid.toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Tax Breakdown Section */}
              {summary?.TaxBreakdown && summary.TaxBreakdown.length > 0 && (
                <>
                  <View style={styles.taxSectionDivider} />
                  <Text style={styles.taxSectionTitle}>Tax Breakdown</Text>
                  {summary.TaxBreakdown.map((tax, index) => (
                    <View key={`${tax.TaxId}-${tax.TaxRate}-${index}`} style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>
                        {tax.TaxName ?? `Tax (${tax.TaxRate}%)`}
                      </Text>
                      <Text style={styles.breakdownValue}>
                        Rs {tax.TaxAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, styles.totalTaxLabel]}>Total Tax</Text>
                    <Text style={[styles.breakdownValue, styles.totalTaxValue]}>
                      Rs {summary.TaxBreakdown.reduce((sum, tax) => sum + tax.TaxAmount, 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.screenH,
    paddingBottom: 18,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(28, 24, 18, 0.08)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: Colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Space[2],
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.serif,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.ink1,
    textAlign: 'center',
    letterSpacing: 0.01,
  },
  headerRight: {
    width: 38,
  },

  // ── Content
  content: {
    flex: 1,
  },

  // ── Section
  section: {
    paddingHorizontal: Space.screenH,
    paddingVertical: Space[5],
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.7,
    color: Colors.ink3,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space[3],
  },
  summaryHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[4],
  },
  editBagText: {
    fontSize: 13.5,
    color: Colors.ink3,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  toggleSummaryText: {
    fontSize: 13.5,
    color: Colors.ink1,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // ── Address
  addressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceSoft,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.rule,
    padding: Space[5],
    marginVertical: Space[3],
    gap: Space[3],
  },
  addressContent: {
    flex: 1,
  },
  addressName: {
    fontFamily: FontFamily.serif,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.ink1,
    marginBottom: Space[1],
  },
  addressText: {
    fontSize: 14,
    color: Colors.ink3,
    lineHeight: 21,
    marginTop: 2,
  },
  addressMobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  addressMobile: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.ink4,
    letterSpacing: 0.2,
  },
  changeAddressLink: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.brandNavy,
    textDecorationLine: 'underline',
    paddingTop: 14,
  },

  // ── Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(28, 24, 18, 0.08)',
    marginHorizontal: Space.screenH,
    marginVertical: 26,
  },

  // ── Items List
  itemsListCard: {
    backgroundColor: Colors.surfaceSoft,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.rule,
    marginBottom: Space[3],
    overflow: 'hidden',
    gap: 14,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceSoft,
    borderRadius: 14,
  },
  itemImage: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: Colors.surfaceDeep,
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    gap: Space[1],
  },
  itemName: {
    fontSize: 14,
    color: Colors.ink1,
    fontWeight: '600',
    lineHeight: 18.2,
  },
  itemVariant: {
    fontSize: 12,
    color: Colors.ink3,
    marginTop: 3,
  },
  itemPrice: {
    fontSize: 14.5,
    color: Colors.ink1,
    fontWeight: '600',
    flexShrink: 0,
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── Price Breakdown
  priceBreakdownCard: {
    backgroundColor: Colors.surfaceSoft,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.rule,
    padding: Space[5],
    gap: 13,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14.5,
    color: Colors.ink3,
  },
  priceValue: {
    fontSize: 14.5,
    color: Colors.ink1,
    fontWeight: '600',
  },
  mrpValueStruck: {
    color: Colors.ink4,
    textDecorationLine: 'line-through',
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsLabel: {
    ...Type.caption,
    color: '#226B3C',
    fontWeight: '500',
  },
  savingsValue: {
    ...Type.caption,
    color: '#226B3C',
    fontWeight: '600',
  },
  freeShipping: {
    color: '#226B3C',
  },
  totalAmountValueWrap: {
    alignItems: 'flex-end',
    gap: 0,
  },
  inclTaxesText: {
    ...Type.caption,
    color: Colors.brandNavy,
    textDecorationLine: 'underline',
    fontSize: 12,
  },

  // ── Tax Breakdown Sheet
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  taxSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingTop: Space[4],
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  sheetTitle: {
    fontFamily: FontFamily.serif,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ink1,
  },
  sheetContent: {
    paddingHorizontal: Space.screenH,
    paddingVertical: Space[4],
  },
  breakdownRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space[3],
    paddingBottom: Space[3],
  },
  breakdownLabelTotal: {
    fontFamily: FontFamily.serif,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ink1,
  },
  breakdownValueTotal: {
    fontFamily: FontFamily.serif,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink1,
  },
  taxSectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginBottom: Space[3],
  },
  taxSectionTitle: {
    ...Type.label,
    color: Colors.ink4,
    marginBottom: Space[2],
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Space[2],
  },
  breakdownLabel: {
    fontSize: 14,
    color: Colors.ink3,
    flex: 1,
  },
  breakdownValue: {
    fontSize: 14,
    color: Colors.ink1,
    fontWeight: '600',
  },
  totalTaxLabel: {
    fontWeight: '700',
  },
  totalTaxValue: {
    fontWeight: '700',
  },

  // ── Trust Row
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    paddingVertical: Space[4],
    marginHorizontal: Space.screenH,
    marginVertical: Space[4],
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  trustText: {
    fontSize: 12.5,
    color: Colors.ink3,
    fontWeight: '600',
  },

  // ── Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(28, 24, 18, 0.1)',
    paddingHorizontal: Space.screenH,
    paddingTop: 16,
    gap: 10,
  },

  // ── Payable Section
  payableSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  payableLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.32,
    color: Colors.ink3,
    textTransform: 'uppercase',
  },
  itemCountLink: {
    fontSize: 13,
    color: Colors.ink1,
    fontWeight: '600',
    textDecorationLine: 'underline',
    paddingTop: Space[1],
  },
  payableAmount: {
    fontFamily: FontFamily.serif,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.ink1,
    letterSpacing: 0.01,
  },

  // ── Payment Section
  paymentMethodsSection: {
    paddingHorizontal: Space.screenH,
    paddingVertical: Space[5],
    gap: Space[3],
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[3],
    paddingVertical: Space[4],
    paddingHorizontal: Space[4],
    backgroundColor: 'transparent',
    borderRadius: Radius.lg,
    borderWidth: 1.4,
    borderColor: 'rgba(28, 24, 18, 0.16)',
  },
  paymentMethodCardSelected: {
    backgroundColor: Colors.surfaceSoft,
    borderColor: Colors.ink1,
  },
  paymentIconTile: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  paymentIconTileSelected: {
    backgroundColor: Colors.ink1,
  },
  paymentMethodContent: {
    flex: 1,
    gap: Space[1],
  },
  paymentMethodLabel: {
    fontSize: 15.5,
    fontWeight: '600',
    color: Colors.ink1,
  },
  paymentMethodSub: {
    fontSize: 12.5,
    color: Colors.ink3,
    marginTop: Space[1],
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[3],
    paddingVertical: Space[3],
  },
  paymentRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.6,
    borderColor: 'rgba(28, 24, 18, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  paymentRadioSelected: {
    borderColor: Colors.ink1,
  },
  paymentRadioInner: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: Colors.ink1,
  },
  paymentMethodText: {
    ...Type.caption,
    color: Colors.ink2,
    fontWeight: '500',
    flex: 1,
  },

  // ── Place Order Button
  placeOrderBtn: {
    backgroundColor: Colors.ink1,
    borderRadius: 999,
    paddingVertical: 17,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderBtnDisabled: {
    opacity: 0.35,
  },
  placeOrderBtnText: {
    fontFamily: FontFamily.serif,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
    letterSpacing: 0.01,
  },
});

export default CheckoutScreen;
