import React from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native';
import WebView from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { paymentEndpoints } from '../api/endpoints';
import { placeOrder } from '../api/order';
import { useCart } from '../context/CartContext';
import { PlaceOrderInterface, SavedCartItemInterface } from '../api/interfaces';
import { getOrgIdForInventory } from '../api/product';
import { STORAGE_KEYS } from '../config/storageKeys';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveryAddress {
  OrderDeliveryAddressCode: number;
  CustomerName: string;
  Address: string | null;
  StreetName: string | null;
  City: string | null;
}

type PaymentScreenProps = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, any>) => void;
  };
  route: {
    params: {
      profileCode: number;
      cartItems: SavedCartItemInterface[];
      selectedAddress: DeliveryAddress;
      orderTotal: number;
      walletStats?: { Code: number };
    };
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MIPS_BASE_URL = 'https://maupost.mauritiuspost.mu:8087/api/';
const INITIAL_DELAY = 15000;
const POLL_INTERVAL = 5000;
const MAX_ATTEMPTS  = 60;

const formatTime = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const EcomPaymentScreen: React.FC<PaymentScreenProps> = ({ route, navigation }) => {
  const { profileCode, cartItems, selectedAddress, orderTotal } = route.params;
  const insets = useSafeAreaInsets();

  const { setCartCount } = useCart();

  // ── State ──────────────────────────────────────────────────────────────────
  const [mipsUrl,    setMipsUrl]    = React.useState('');
  const [requestId,  setRequestId]  = React.useState('');
  const [orderId,    setOrderId]    = React.useState('');
  const [seconds,    setSeconds]    = React.useState(300);
  const [count,      setCount]      = React.useState(0);
  const [attemptInfo, setAttemptInfo] = React.useState('');
  const [loadError,  setLoadError]  = React.useState<string | null>(null);
  const [mipsToken,  setMipsToken]  = React.useState('');

  // ── Refs ───────────────────────────────────────────────────────────────────
  const successRef          = React.useRef(false);
  const innerApiInitiated   = React.useRef(false);
  const countdownRef        = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Step 1 — Fetch MIPS token, then load payment zone on mount ────────────
  React.useEffect(() => {
    const init = async () => {
      try {
        // Fetch MIPS authentication token
        const tokenRes = await axios.post(`${MIPS_BASE_URL}token/create`, {
          Login:       'mu@postglobal',
          Password:    '#mu@76*3',
          MachineName: 'ecom',
        });
        const mipsAuthToken: string = tokenRes.data?.result ?? '';
        if (!mipsAuthToken) {
          setLoadError('Failed to authenticate with payment gateway. Please try again.');
          return;
        }
        setMipsToken(mipsAuthToken);

        // Re-read orderId from storage (set before navigating here)
        const storedOrderId = await AsyncStorage.getItem(STORAGE_KEYS.orderId);
        if (!storedOrderId) {
          setLoadError('Could not retrieve order reference. Please go back and try again.');
          return;
        }
        setOrderId(storedOrderId);

        // Build the appData payload — mirrors the placeOrder structure from AddressScreen
        const orgMap = new Map<string, SavedCartItemInterface[]>();
        for (const item of cartItems) {
          const orgId = item.OrganisationId || getOrgIdForInventory(item.InventoryId);
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
            Taxes: (item.PriceDetails?.Taxes ?? []).map(t => ({
              TaxId:   t.TaxId,
              TaxName: '',
              TaxType: t.TaxType,
              TaxRate: t.TaxRate,
              Reason:  '',
            })),
          })),
        }));

        const appData = {
          transType: 100, // e-commerce order payment
          transData: {
            isRetry:                   false,
            transUID:                  storedOrderId,
            CustomerProfileCode:       profileCode,
            OrderDeliveryAddressCode:  selectedAddress.OrderDeliveryAddressCode,
            CartMasterCode:            cartItems[0].CartMasterCode,
            TotalAmountBeforeDiscount: orderTotal,
            TotalAmountAfterDiscount:  orderTotal,
            OrderDetails:              orderDetails,
            PaymentDetails: {
              PaymentModes:   2, // card / online
              Remark:         'Online payment via MIPS',
              ModeOfPayments: [],
            },
          },
        };

        const response = await axios.post(
          `${MIPS_BASE_URL}${paymentEndpoints.loadPaymentZone}`,
          {
            orderID:             storedOrderId,
            orderAmount:         parseFloat(String(orderTotal)).toFixed(2),
            orderDesc:           'E-Commerce Order Payment',
            touchPoint:          'native_app',
            channel:             1,
            customerProfileCode: 136636, //profileCode
            appData,
          },
          {
            headers: {
              user:     'mplpgPay',
              password: '#mpl&2384kewrf',
              token:    mipsAuthToken,
            },
          },
        );

        const result = response.data;
        if (result?.result?.mipsUrl && result?.result?.requestId) {
          setMipsUrl(result.result.mipsUrl);
          setRequestId(result.result.requestId);
        } else {
          setLoadError(result?.userMessage ?? 'Failed to initialise payment. Please go back and try again.');
        }
      } catch (err: any) {
        console.error('MIPS load payment zone error:', err);
        setLoadError(err?.response?.data?.userMessage ?? 'Failed to initialise payment. Please go back and try again.');
      }
    };

    init();
  }, []);

  // ── Step 2 — 5-minute countdown (starts once requestId + orderId are ready) ─
  React.useEffect(() => {
    if (!requestId || !orderId) return;
    if (successRef.current) return;

    countdownRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          Alert.alert(
            'Payment window expired',
            'The 5-minute payment window has expired. Please go back and try again.',
            [{
              text: 'OK',
              onPress: () => {
                successRef.current = true;
                navigation.goBack();
              },
            }],
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [requestId, orderId]);

  // ── Step 3 — Poll for payment status ──────────────────────────────────────
  useFocusEffect(
    React.useCallback(() => {
      if (!requestId || !orderId) return;
      if (successRef.current) return;

      let interval: ReturnType<typeof setInterval> | null = null;
      let localCount = 0;

      const fetchStatus = async () => {
        if (successRef.current) {
          if (interval) clearInterval(interval);
          return;
        }

        if (localCount >= MAX_ATTEMPTS) {
          if (interval) clearInterval(interval);
          if (countdownRef.current) clearInterval(countdownRef.current);
          Alert.alert(
            'Payment could not be confirmed',
            'Maximum polling attempts reached. Please check your transaction history.',
            [{
              text: 'OK',
              onPress: () => {
                successRef.current = true;
                navigation.goBack();
              },
            }],
          );
          return;
        }

        localCount += 1;
        setCount(localCount);

        try {
          const currentOrderId = await AsyncStorage.getItem(STORAGE_KEYS.orderId);

          const statusResponse = await axios.post(
            `${MIPS_BASE_URL}${paymentEndpoints.getPaymentStatus}`,
            {
              OrderId:   currentOrderId,
              RequestId: requestId,
              Channel:   1,
              CallerUrl: '',
            },
            {
              headers: {
                user:     'mplpgPay',
                password: '#mpl&2384kewrf',
                token:    mipsToken,
              },
            },
          );

          const dets = statusResponse.data;

          // Normalise casing
          dets.StatusCode = dets.StatusCode ?? dets.statusCode ?? 0;

          // Normalise user message
          const rawMsg    = dets.UserMessage || dets.userMessage || '';
          const cleanMsg  = rawMsg.replace(/<\/?b>/g, '').trim();
          if (cleanMsg) setAttemptInfo(cleanMsg);

          // Parse result — may be a JSON string or a pre-parsed object
          let paymentDetails: Record<string, any> | null = null;
          const rawResult = dets.result || dets.Result;
          if (rawResult != null) {
            if (typeof rawResult === 'string') {
              try { paymentDetails = JSON.parse(rawResult); } catch { /* ignore */ }
            } else if (typeof rawResult === 'object') {
              paymentDetails = rawResult;
            }
          }

          // ── StatusCode 3 = still pending — keep polling ──────────────────
          if (dets.StatusCode === 3 || paymentDetails == null) return;

          // ── StatusCode 1 = payment confirmed ──────────────────────────────
          if (dets.StatusCode === 1) {
            if (innerApiInitiated.current) return;
            innerApiInitiated.current = true;

            if (interval) clearInterval(interval);
            if (countdownRef.current) clearInterval(countdownRef.current);

            await finaliseOrder(currentOrderId!, paymentDetails);
            return;
          }

          // ── StatusCode 0 / 2 = cancelled / failed ─────────────────────────
          if (dets.StatusCode === 0 || dets.StatusCode === 2) {
            if (interval) clearInterval(interval);
            if (countdownRef.current) clearInterval(countdownRef.current);
            successRef.current = true;

            Alert.alert(
              'Payment not completed',
              paymentDetails?.remarks || cleanMsg || 'Your payment was not completed.',
              [{
                text: 'OK',
                onPress: () => navigation.goBack(),
              }],
            );
          }
        } catch (err: any) {
          console.error('Poll status error:', err);
          const errMsg = err?.response?.data?.userMessage || err?.message || '';
          setAttemptInfo(errMsg.replace(/<\/?b>/g, '').trim());
        }
      };

      // Wait INITIAL_DELAY, then poll every POLL_INTERVAL
      const initialTimeout = setTimeout(() => {
        fetchStatus();
        interval = setInterval(fetchStatus, POLL_INTERVAL);
      }, INITIAL_DELAY);

      return () => {
        clearTimeout(initialTimeout);
        if (interval) clearInterval(interval);
      };
    }, [requestId, orderId]),
  );

  // ── Step 4 — Finalise order once payment is confirmed ─────────────────────
  const finaliseOrder = async (
    currentOrderId: string,
    paymentDetails: Record<string, any>,
  ) => {
    try {
      const orgMap = new Map<string, SavedCartItemInterface[]>();
      for (const item of cartItems) {
        const orgId = item.OrganisationId || getOrgIdForInventory(item.InventoryId);
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
          Taxes: (item.PriceDetails?.Taxes ?? []).map(t => ({
            TaxId:   t.TaxId,
            TaxName: '',
            TaxType: t.TaxType,
            TaxRate: t.TaxRate,
            Reason:  '',
          })),
        })),
      }));

      // Build payment mode from MIPS response — card vs mobile money
      const isCard = paymentDetails.mipsPmtType === 'card';
      const modeOfPayments = isCard
        ? [{
            Cards: {
              Number:             paymentDetails.cardNo ?? '',
              AuthorizationCode:  paymentDetails.authCode ?? '',
              CardAmount:         orderTotal,
              CardProcessingCode: paymentDetails.pgPmtMode ?? '',
            },
          }]
        : [{
            CashOnDelivery: {
              ExpectedAmount:      orderTotal,
              CurrencyCode:        'MUR',
              CollectionReference: currentOrderId,
            },
          }];

      const payload: PlaceOrderInterface = {
        CustomerProfileCode:       profileCode,
        OrderDeliveryAddressCode:  selectedAddress.OrderDeliveryAddressCode,
        CartMasterCode:            cartItems[0].CartMasterCode,
        TotalAmountBeforeDiscount: orderTotal,
        TotalAmountAfterDiscount:  orderTotal,
        OrderDetails:              orderDetails,
        PaymentDetails: {
          PaymentModes:   2, //isCard ? 3:16,
          Remark:         isCard ? 'Card payment via MIPS' : 'Mobile money payment via MIPS',
          IsPaid:         true,
          ModeOfPayments: modeOfPayments,
        },
      };

      const response = await placeOrder(payload);

      if (response?.statusCode !== 1) {
        successRef.current = true;
        Alert.alert(
          'Order could not be placed',
          response?.userMessage ?? 'Payment was received but we could not place your order. Please contact support.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }

      setCartCount(0);
      successRef.current = true;

      navigation.navigate('OrderSuccess', {
        orderNumber:    response.result?.OrderNumber ?? '',
        itemCount:      cartItems.length,
        orderTotal,
        orderCurrency:  'MUR',
        orderTimestamp: response.result?.CreatedDate ?? null,
        orderStatus:    response.result?.OrderStatus ?? null,
        deliveryAddress: {
          street: [selectedAddress.Address, selectedAddress.StreetName].filter(Boolean).join(', '),
          city:   selectedAddress.City ?? '',
        },
        cartItems: cartItems.map((item: SavedCartItemInterface) => ({
          name:     item.Name,
          quantity: item.Quantity,
          price:    item.Price,
          image:    item.Images?.split(/[,;]/).filter(Boolean)[0] ?? '',
        })),
      });
    } catch (err: any) {
      console.error('finaliseOrder error:', err);
      successRef.current = true;
      Alert.alert(
        'Order error',
        err?.response?.data?.userMessage ?? 'Payment was received but we could not place your order. Please contact support.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    }
  };

  // ── Render — loading state before MIPS URL is ready ───────────────────────
  if (loadError) {
    return (
      <View style={[styles.centred, { paddingTop: insets.top || (StatusBar.currentHeight ?? 0) }]}>
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    );
  }

  if (!mipsUrl) {
    return (
      <View style={[styles.centred, { paddingTop: insets.top || (StatusBar.currentHeight ?? 0) }]}>
        <Text style={styles.loadingText}>Preparing payment…</Text>
      </View>
    );
  }

  // ── Render — WebView + status strip ───────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top || (StatusBar.currentHeight ?? 0) }]}>
      <StatusBar barStyle="dark-content" />

      {/* Status strip */}
      <View style={styles.strip}>
        <Text style={styles.stripTimer}>Time remaining: {formatTime(seconds)}</Text>
        <Text style={styles.stripNote}>
          Do not press the back button or close this screen.
        </Text>
        {count > 0 ? (
          <Text style={styles.stripAttempt}>{`Checking payment… attempt ${count}/${MAX_ATTEMPTS}`}</Text>
        ) : null}
        {attemptInfo ? (
          <Text style={styles.stripAttemptInfo}>{attemptInfo}</Text>
        ) : null}
      </View>

      {/* MIPS WebView */}
      <WebView
        source={{ uri: mipsUrl }}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        cacheEnabled={false}
        incognito
        originWhitelist={['*']}
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        startInLoadingState
        style={styles.webview}
        onHttpError={e => console.warn('WebView HTTP error:', e.nativeEvent.statusCode)}
        renderError={errorName => (
          <View style={styles.centred}>
            <Text style={styles.errorText}>Payment page failed to load ({errorName}).</Text>
          </View>
        )}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#FFFFFF',
  },
  centred: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        24,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize:   16,
    color:      '#555',
    textAlign:  'center',
  },
  errorText: {
    fontSize:   15,
    color:      '#D32F2F',
    textAlign:  'center',
    lineHeight: 22,
  },
  // ── Status strip ────────────────────────────────────────────────────────────
  strip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DEDEDE',
    gap:               4,
  },
  stripTimer: {
    fontSize:   14,
    fontWeight: '700',
    color:      '#1A237E',
  },
  stripNote: {
    fontSize:  12,
    color:     '#555',
    lineHeight: 17,
  },
  stripAttempt: {
    fontSize:  11,
    color:     '#888',
  },
  stripAttemptInfo: {
    fontSize:   11,
    color:      '#444',
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
});

export default EcomPaymentScreen;