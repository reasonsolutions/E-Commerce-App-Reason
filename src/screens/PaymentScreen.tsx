import React from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import WebView from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

import { paymentEndpoints } from '../api/endpoints';
import { placeOrder } from '../api/order';
import { useCart } from '../context/CartContext';
import { PlaceOrderInterface, SavedCartItemInterface } from '../api/interfaces';
import { STORAGE_KEYS } from '../config/storageKeys';
import { PaymentModes } from '../config/enum_files/PaymentModes';
import { Colors, Space } from '../theme';
import { FontFamily } from '../theme/fonts';
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
    replace: (screen: string, params?: Record<string, any>) => void;
    pop: (count: number) => void;
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
const MAX_ATTEMPTS = 60;

// ─── Screen ───────────────────────────────────────────────────────────────────

const EcomPaymentScreen: React.FC<PaymentScreenProps> = ({
  route,
  navigation,
}) => {
  const { profileCode, cartItems, selectedAddress, orderTotal } = route.params;
  const insets = useSafeAreaInsets();

  const { setCartCount } = useCart();

  // ── State ──────────────────────────────────────────────────────────────────
  const [mipsUrl, setMipsUrl] = React.useState('');
  const [requestId, setRequestId] = React.useState('');
  const [orderId, setOrderId] = React.useState('');
  const [seconds, setSeconds] = React.useState(300);
  const [count, setCount] = React.useState(0);
  const [attemptInfo, setAttemptInfo] = React.useState('');
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [mipsToken, setMipsToken] = React.useState('');

  // ── Refs ───────────────────────────────────────────────────────────────────
  const successRef = React.useRef(false);
  const innerApiInitiated = React.useRef(false);
  const countdownRef = React.useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // ── Back navigation — always confirm, payment may be mid-flight ───────────
  const handleBack = () => {
    Alert.alert(
      'Leave payment?',
      'Your payment may be in progress. If you leave now, it may not complete.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            successRef.current = true;
            if (countdownRef.current) clearInterval(countdownRef.current);
            navigation.goBack();
          },
        },
      ],
    );
  };

  // ── Step 1 — Fetch MIPS token, then load payment zone on mount ────────────
  React.useEffect(() => {
    const init = async () => {
      try {
        // Fetch MIPS authentication token
        const tokenRes = await axios.post(`${MIPS_BASE_URL}token/create`, {
          Login: 'mu@postglobal',
          Password: '#mu@76*3',
          MachineName: 'ecom',
        });
        const mipsAuthToken: string = tokenRes.data?.result ?? '';
        if (!mipsAuthToken) {
          setLoadError(
            'Failed to authenticate with payment gateway. Please try again.',
          );
          return;
        }
        setMipsToken(mipsAuthToken);

        // Re-read orderId from storage (set before navigating here)
        const storedOrderId = await AsyncStorage.getItem(STORAGE_KEYS.orderId);
        if (!storedOrderId) {
          setLoadError(
            'Could not retrieve order reference. Please go back and try again.',
          );
          return;
        }
        setOrderId(storedOrderId);

        // Build the appData payload — mirrors the placeOrder structure from AddressScreen
        const appData = {
          transType: 100, // e-commerce order payment
          transData: {
            isRetry: false,
            transUID: storedOrderId,
            CustomerProfileCode: profileCode,
            OrderDeliveryAddressCode: selectedAddress.OrderDeliveryAddressCode,
            CartMasterCode: cartItems[0].CartMasterCode,
            AmountPaid: orderTotal,
            PaymentDetails: {
              PaymentModes: 2, // card / online
              Remark: 'Online payment via MIPS',
              ModeOfPayments: [],
            },
          },
        };

        const response = await axios.post(
          `${MIPS_BASE_URL}${paymentEndpoints.loadPaymentZone}`,
          {
            orderID: storedOrderId,
            orderAmount: parseFloat(String(orderTotal)).toFixed(2),
            orderDesc: 'E-Commerce Order Payment',
            touchPoint: 'native_app',
            channel: 1,
            customerProfileCode: 136636, //profileCode
            appData,
          },
          {
            headers: {
              user: 'mplpgPay',
              password: '#mpl&2384kewrf',
              token: mipsAuthToken,
            },
          },
        );

        const result = response.data;
        if (result?.result?.mipsUrl && result?.result?.requestId) {
          setMipsUrl(result.result.mipsUrl);
          setRequestId(result.result.requestId);
        } else {
          setLoadError(
            result?.userMessage ??
              'Failed to initialise payment. Please go back and try again.',
          );
        }
      } catch (err: any) {
        console.error('MIPS load payment zone error:', err);
        setLoadError(
          err?.response?.data?.userMessage ??
            'Failed to initialise payment. Please go back and try again.',
        );
      }
    };

    init();
  }, []);

  // ── Step 2 — 5-minute countdown (starts once requestId + orderId are ready) ─
  // Runs continuously regardless of focus — this tracks the real MIPS payment
  // session lifetime, which keeps expiring whether or not the user is looking
  // at this screen. Only the status polling below pauses on blur.
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
            [
              {
                text: 'OK',
                onPress: () => {
                  successRef.current = true;
                  navigation.goBack();
                },
              },
            ],
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
            [
              {
                text: 'OK',
                onPress: () => {
                  successRef.current = true;
                  navigation.goBack();
                },
              },
            ],
          );
          return;
        }

        localCount += 1;
        setCount(localCount);

        try {
          const currentOrderId = await AsyncStorage.getItem(
            STORAGE_KEYS.orderId,
          );

          const statusResponse = await axios.post(
            `${MIPS_BASE_URL}${paymentEndpoints.getPaymentStatus}`,
            {
              OrderId: currentOrderId,
              RequestId: requestId,
              Channel: 1,
              CallerUrl: '',
            },
            {
              headers: {
                user: 'mplpgPay',
                password: '#mpl&2384kewrf',
                token: mipsToken,
              },
            },
          );

          const dets = statusResponse.data;

          // Normalise casing
          dets.StatusCode = dets.StatusCode ?? dets.statusCode ?? 0;

          // Normalise user message
          const rawMsg = dets.UserMessage || dets.userMessage || '';
          const cleanMsg = rawMsg.replace(/<\/?b>/g, '').trim();
          if (cleanMsg) setAttemptInfo(cleanMsg);

          // Parse result — may be a JSON string or a pre-parsed object
          let paymentDetails: Record<string, any> | null = null;
          const rawResult = dets.result || dets.Result;
          if (rawResult != null) {
            if (typeof rawResult === 'string') {
              try {
                paymentDetails = JSON.parse(rawResult);
              } catch {
                /* ignore */
              }
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
              paymentDetails?.remarks ||
                cleanMsg ||
                'Your payment was not completed.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ],
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
      // Build payment mode from MIPS response — card vs mobile money
      const isCard = paymentDetails.mipsPmtType === 'card';

      // Payment already succeeded at this point (StatusCode === 1) — if MIPS
      // omitted the card proof fields, don't silently place the order with
      // blank audit data. Stop and let the user contact support instead.
      if (isCard && (!paymentDetails.cardNo || !paymentDetails.authCode)) {
        successRef.current = true;
        Alert.alert(
          'Order could not be placed',
          'Payment was received but the confirmation was incomplete. Please contact support before retrying payment.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }

      const modeOfPayments = isCard
        ? [
            {
              Cards: {
                Number: paymentDetails.cardNo ?? '',
                AuthorizationCode: paymentDetails.authCode ?? '',
                CardAmount: orderTotal,
                CardProcessingCode: paymentDetails.pgPmtMode ?? '',
              },
            },
          ]
        : [
            {
              CashOnDelivery: {
                ExpectedAmount: orderTotal,
                CurrencyCode: 'MUR',
                CollectionReference: currentOrderId,
              },
            },
          ];

      const payload: PlaceOrderInterface = {
        CustomerProfileCode: profileCode,
        OrderDeliveryAddressCode: selectedAddress.OrderDeliveryAddressCode,
        CartMasterCode: cartItems[0].CartMasterCode,
        AmountPaid: orderTotal,
        PaymentDetails: {
          PaymentModes: isCard
            ? PaymentModes.Cards
            : PaymentModes.MobileMoneyCollections,
          Remark: isCard
            ? 'Card payment via MIPS'
            : 'Mobile money payment via MIPS',
          IsPaid: true,
          ModeOfPayments: modeOfPayments,
        },
      };

      const response = await placeOrder(payload);

      if (response?.statusCode !== 1) {
        successRef.current = true;
        Alert.alert(
          'Order could not be placed',
          response?.userMessage ??
            'Payment was received but we could not place your order. Please contact support.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }

      setCartCount(0);
      successRef.current = true;

      // Pop EcomPayment off first so the replace below removes Address too —
      // matches the COD path, which leaves Cart (not Address) under
      // OrderSuccess. Keeps swipe-back-past-OrderSuccess consistent between
      // both payment methods.
      navigation.pop(1);
      navigation.replace('OrderSuccess', {
        orderNumber: response.result?.OrderNumber ?? '',
        itemCount: cartItems.length,
        orderTotal: response.result?.PaymentAmount ?? orderTotal,
        orderCurrency: 'MUR',
        orderTimestamp: response.result?.CreatedDate ?? null,
        deliveryAddress: {
          street: [selectedAddress.Address, selectedAddress.StreetName]
            .filter(Boolean)
            .join(', '),
          city: selectedAddress.City ?? '',
        },
        cartItems: cartItems.map((item: SavedCartItemInterface) => ({
          name: item.Name,
          quantity: item.Quantity,
          price: item.PriceDetails?.Price ?? item.Price,
          image: item.Images?.split(/[,;]/).filter(Boolean)[0] ?? '',
        })),
      });
    } catch (err: any) {
      console.error('finaliseOrder error:', err);
      successRef.current = true;
      Alert.alert(
        'Order error',
        err?.response?.data?.userMessage ??
          'Payment was received but we could not place your order. Please contact support.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    }
  };

  // ── Header — back button, shown on every state ─────────────────────────────
  const header = (
    <>
      <View style={[styles.header, { paddingTop: insets.top + Space[3] }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="chevron-back" size={22} color={Colors.ink1} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.headerDivider} />
    </>
  );

  // ── Render — loading state before MIPS URL is ready ───────────────────────
  if (loadError) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {header}
        <View style={styles.centred}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      </View>
    );
  }

  if (!mipsUrl) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {header}
        <View style={styles.centred}>
          <Text style={styles.loadingText}>Preparing payment…</Text>
        </View>
      </View>
    );
  }

  // ── Render — WebView + status strip ───────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {header}

      {/* Status strip */}
      <View style={styles.strip}>
        <Text style={styles.stripTimer}>
          This payment session expires in 5 minutes.
        </Text>
        <Text style={styles.stripNote}>
          Do not press the back button or close this screen.
        </Text>
        {count > 0 ? (
          <Text
            style={styles.stripAttempt}
          >{`Checking payment… attempt ${count}/${MAX_ATTEMPTS}`}</Text>
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
        onHttpError={e =>
          console.warn('WebView HTTP error:', e.nativeEvent.statusCode)
        }
        renderError={errorName => (
          <View style={styles.centred}>
            <Text style={styles.errorText}>
              Payment page failed to load ({errorName}).
            </Text>
          </View>
        )}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#D32F2F',
    textAlign: 'center',
    lineHeight: 22,
  },
  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[4],
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Space[2],
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.ink1,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  headerRight: {
    width: 36,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  // ── Status strip ────────────────────────────────────────────────────────────
  strip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DEDEDE',
    gap: 4,
  },
  stripTimer: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A237E',
  },
  stripNote: {
    fontSize: 12,
    color: '#555',
    lineHeight: 17,
  },
  stripAttempt: {
    fontSize: 11,
    color: '#888',
  },
  stripAttemptInfo: {
    fontSize: 11,
    color: '#444',
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
});

export default EcomPaymentScreen;
