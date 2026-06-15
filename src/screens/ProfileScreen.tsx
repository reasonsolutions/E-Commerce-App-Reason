import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { clearSession } from '../utils/auth';
import { useCart } from '../context/CartContext';
import {
  BottomNavBar,
  Skeleton,
  ConfirmSheet,
  EditProfileSheet,
  ChangePasswordSheet,
  ScreenHeader,
  PrimaryButton,
  TextLinkButton,
} from '../components/ui';
import { ErrorState } from '../components/system/ErrorState';
import { getDeliveryAddresses } from '../api/address';
import { DeliveryAddress } from './AddressScreen';
import { STORAGE_KEYS } from '../config/storageKeys';
import type { LoggedInCustomerInterface } from '../api/interfaces';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useAppToast } from '../hooks/useAppToast';

type ProfileScreenProps = {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
    reset: (state: { index: number; routes: { name: string }[] }) => void;
  };
};

// ── Menu row ──────────────────────────────────────────────────────────────────
const MenuRow: React.FC<{
  label: string;
  sub: string;
  onPress: () => void;
  showDivider?: boolean;
}> = ({ label, sub, onPress, showDivider = true }) => {
  const haptic = useHaptic();
  return (
    <TouchableOpacity
      onPress={() => { haptic.light(); onPress(); }}
      activeOpacity={0.7}
      style={[menuRowStyles.row, showDivider && menuRowStyles.border]}
    >
      <View style={menuRowStyles.textWrap}>
        <Text style={menuRowStyles.label}>{label}</Text>
        <Text style={menuRowStyles.sub}>{sub}</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={Colors.ink5} />
    </TouchableOpacity>
  );
};

const menuRowStyles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: Space[4],
    minHeight:       56,
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  textWrap: {
    flex: 1,
    gap:  3,
  },
  label: {
    fontSize:   15,
    fontWeight: '500',
    color:      Colors.ink1,
    lineHeight: 20,
  },
  sub: {
    ...Type.caption,
    color: Colors.ink4,
  },
});

// ── Logged-out view ───────────────────────────────────────────────────────────
const LoggedOutView: React.FC<{
  onSignIn: () => void;
  onRegister: () => void;
}> = ({ onSignIn, onRegister }) => (
  <View style={loggedOutStyles.root}>
    <View style={loggedOutStyles.iconCircle}>
      <Icon name="person-outline" size={22} color={Colors.ink3} />
    </View>
    <Text style={loggedOutStyles.title}>Your account</Text>
    <Text style={loggedOutStyles.body}>
      Sign in to manage your orders, addresses, and wishlist.
    </Text>
    <View style={loggedOutStyles.ctaWrap}>
      <PrimaryButton label="Sign In" onPress={onSignIn} />
    </View>
    <View style={loggedOutStyles.secondaryWrap}>
      <TextLinkButton label="Create an account" onPress={onRegister} />
    </View>
  </View>
);

const loggedOutStyles = StyleSheet.create({
  root: {
    flex:              1,
    alignItems:        'center',
    paddingTop:        Space[10],
    paddingHorizontal: Space.screenH,
  },
  iconCircle: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: Colors.surfaceDeep,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Space[4],
  },
  title: {
    ...Type.title,
    color:        Colors.ink1,
    marginBottom: Space[2],
    textAlign:    'center',
  },
  body: {
    ...Type.body,
    color:     Colors.ink3,
    textAlign: 'center',
    maxWidth:  280,
  },
  ctaWrap: {
    width:     '100%',
    marginTop: Space[6],
  },
  secondaryWrap: {
    marginTop: Space[4],
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────
const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const toast  = useAppToast();
  const { setCartCount } = useCart();

  const identityAnim = useEntrance(0);
  const shoppingAnim = useEntrance(80);
  const accountAnim  = useEntrance(160);
  const signOutAnim  = useEntrance(240);

  const [session,         setSession]         = useState<LoggedInCustomerInterface | null>(null);
  const [sessionLoading,  setSessionLoading]  = useState(true);
  const [sessionError,    setSessionError]    = useState(false);
  const [addressCount,    setAddressCount]    = useState<number>(0);
  const [editVisible,     setEditVisible]     = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [logoutVisible,   setLogoutVisible]   = useState(false);

  const loadProfile = useCallback(() => {
    let cancelled = false;

    setSessionLoading(true);
    setSessionError(false);

    AsyncStorage.getItem(STORAGE_KEYS.userData)
      .then(raw => {
        if (cancelled) return;
        const parsed: LoggedInCustomerInterface | null = raw ? JSON.parse(raw) : null;
        setSession(parsed);
        setSessionLoading(false);

        if (!parsed?.CustomerProfileCode) return;

        getDeliveryAddresses(parsed.CustomerProfileCode)
          .then(res => {
            if (cancelled) return;
            if (res.statusCode === 1) {
              const list: DeliveryAddress[] = res.result || [];
              setAddressCount(list.length);
            }
          })
          .catch(e => {
            console.error('[ProfileScreen] address fetch failed', e);
          });
      })
      .catch(() => {
        if (!cancelled) {
          setSessionError(true);
          setSessionLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  useFocusEffect(loadProfile);

  const handleSaved = useCallback((updated: LoggedInCustomerInterface) => {
    setSession(updated);
    setEditVisible(false);
    toast.success({ title: 'Profile updated' });
  }, [toast]);

  const confirmLogout = async () => {
    setLogoutVisible(false);
    await clearSession();
    setCartCount(0);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const addressSubtitle = addressCount > 0
    ? `${addressCount} saved address${addressCount !== 1 ? 'es' : ''}`
    : 'Manage delivery addresses';

  // ── Error ───────────────────────────────────────────────────────────────────
  if (sessionError) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
        <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />
        <ErrorState
          title="Couldn't load your profile"
          message="Check your connection and try again."
          onRetry={loadProfile}
        />
        <BottomNavBar
          activeTab="Profile"
          onNavigate={(route) => navigation.navigate(route)}
          onNavigateToAuth={(screen) => navigation.navigate(screen)}
        />
      </View>
    );
  }

  // ── Logged out ──────────────────────────────────────────────────────────────
  if (!sessionLoading && !session) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
        <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />
        <LoggedOutView
          onSignIn={() => navigation.navigate('Login')}
          onRegister={() => navigation.navigate('Register')}
        />
        <BottomNavBar
          activeTab="Profile"
          onNavigate={(route) => navigation.navigate(route)}
          onNavigateToAuth={(screen) => navigation.navigate(screen)}
        />
      </View>
    );
  }

  // ── Logged in / loading ─────────────────────────────────────────────────────
  const displayName   = session?.CustomerName || '—';
  const displayEmail  = session?.EmailID      || null;
  const displayMobile = session?.MobileNumber !== undefined ? String(session.MobileNumber) : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {session && (
        <EditProfileSheet
          session={session}
          isOpen={editVisible}
          onClose={() => setEditVisible(false)}
          onSaved={handleSaved}
        />
      )}

      {session && (
        <ChangePasswordSheet
          customerProfileCode={session.CustomerProfileCode}
          isOpen={passwordVisible}
          onClose={() => setPasswordVisible(false)}
          onSaved={() => {
            setPasswordVisible(false);
            toast.success({ title: 'Password updated' });
          }}
        />
      )}

      {logoutVisible && (
        <ConfirmSheet
          onClose={() => setLogoutVisible(false)}
          onConfirm={confirmLogout}
          title="Log out?"
          body="You'll need to sign in again to access your orders and wishlist."
          confirmLabel="Log out"
          destructive
        />
      )}

      <ScreenHeader
        title="Profile"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            onPress={() => { haptic.light(); setEditVisible(true); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={!session}
          >
            <Icon
              name="create-outline"
              size={22}
              color={session ? Colors.ink2 : Colors.ink5}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Space[8] + 60 },
        ]}
      >
        {/* ── Identity ─────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.identity, identityAnim]}>
          {sessionLoading ? (
            <>
              <Skeleton height={28} width={180} radius={Radius.xs} />
              <Skeleton height={11} width={110} radius={Radius.xs} style={{ marginTop: Space[3] }} />
              <Skeleton height={11} width={160} radius={Radius.xs} style={{ marginTop: Space[1] }} />
            </>
          ) : (
            <>
              <Text style={styles.identityName}>{displayName}</Text>
              {displayMobile
                ? <Text style={styles.identityMeta}>{displayMobile}</Text>
                : null}
              {displayEmail
                ? <Text style={styles.identityMeta}>{displayEmail}</Text>
                : null}
            </>
          )}
        </Animated.View>

        <View style={styles.divider} />

        {/* ── Shopping ─────────────────────────────────────────────────────── */}
        <Animated.View style={shoppingAnim}>
          <Text style={styles.sectionLabel}>Shopping</Text>
          <MenuRow
            label="My Wishlist"
            sub="View saved products"
            onPress={() => navigation.navigate('Wishlist')}
          />
          <MenuRow
            label="Orders"
            sub="Track and reorder"
            onPress={() => navigation.navigate('Orders')}
          />
          <MenuRow
            label="Addresses"
            sub={sessionLoading ? 'Manage delivery addresses' : addressSubtitle}
            onPress={() => navigation.navigate('AddressManagement')}
            showDivider={false}
          />
        </Animated.View>

        {/* ── Account ──────────────────────────────────────────────────────── */}
        <Animated.View style={accountAnim}>
          <Text style={[styles.sectionLabel, { marginTop: Space[5] }]}>Account</Text>
          <MenuRow
            label="Change Password"
            sub="Update your password"
            onPress={() => { haptic.light(); setPasswordVisible(true); }}
            showDivider={false}
          />
        </Animated.View>

        {/* ── Sign out ─────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.signOutBlock, signOutAnim]}>
          <TouchableOpacity
            onPress={() => { haptic.light(); setLogoutVisible(true); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <BottomNavBar
        activeTab="Profile"
        onNavigate={(route) => navigation.navigate(route)}
        onNavigateToAuth={(screen) => navigation.navigate(screen)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[6],
  },

  // ── Identity ──────────────────────────────────────────────────────────────
  identity: {
    paddingBottom: Space[6],
  },
  identityName: {
    fontFamily:    FontFamily.serif,
    fontSize:      28,
    fontWeight:    '400',
    letterSpacing: -0.5,
    color:         Colors.ink1,
    lineHeight:    32,
    marginBottom:  Space[1],
  },
  identityMeta: {
    ...Type.caption,
    color:      Colors.ink4,
    lineHeight: 20,
  },

  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginBottom:    Space[2],
  },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    ...Type.label,
    color:         Colors.ink4,
    paddingTop:    Space[4],
    paddingBottom: Space[1],
  },

  // ── Sign out ──────────────────────────────────────────────────────────────
  signOutBlock: {
    marginTop:     Space[8],
    alignItems:    'center',
    paddingBottom: Space[4],
  },
  signOutText: {
    ...Type.caption,
    color:               Colors.danger,
    textDecorationLine:  'underline',
    textDecorationColor: Colors.danger,
  },
});

export default ProfileScreen;
