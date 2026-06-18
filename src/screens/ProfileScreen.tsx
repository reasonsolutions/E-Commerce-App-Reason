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
  PrimaryButton,
} from '../components/ui';
import { ErrorState } from '../components/system/ErrorState';
import { getDeliveryAddresses } from '../api/address';
import { getWishlist } from '../api/wishlist';
import { postOrderHistory } from '../api/order';
import { STORAGE_KEYS } from '../config/storageKeys';
import { BRAND } from '../config/brand';
import type { LoggedInCustomerInterface } from '../api/interfaces';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useAppToast } from '../hooks/useAppToast';

const APP_VERSION = '1.0.0';

type ProfileScreenProps = {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
    reset: (state: { index: number; routes: { name: string }[] }) => void;
  };
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const parts    = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <View style={avatarStyles.circle}>
      <Text style={avatarStyles.text}>{initials}</Text>
    </View>
  );
};

const avatarStyles = StyleSheet.create({
  circle: {
    width:           76,
    height:          76,
    borderRadius:    38,
    backgroundColor: '#EDE9E4',
    alignItems:      'center',
    justifyContent:  'center',
  },
  text: {
    fontFamily:    FontFamily.serif,
    fontSize:      26,
    fontWeight:    '400',
    color:         Colors.ink2,
    letterSpacing: 0.5,
  },
});

// ── Stat pill row ─────────────────────────────────────────────────────────────
const StatRow: React.FC<{
  orderCount:    number | null;
  wishlistCount: number | null;
  addressCount:  number | null;
  loading:       boolean;
  onOrders:      () => void;
  onWishlist:    () => void;
  onAddresses:   () => void;
}> = ({ orderCount, wishlistCount, addressCount, loading, onOrders, onWishlist, onAddresses }) => {
  const haptic = useHaptic();
  const items = [
    { count: orderCount,    label: 'Orders',    icon: 'cube-outline',     onPress: onOrders },
    { count: wishlistCount, label: 'Wishlist',  icon: 'heart-outline',    onPress: onWishlist },
    { count: addressCount,  label: 'Addresses', icon: 'location-outline', onPress: onAddresses },
  ];
  return (
    <View style={statStyles.row}>
      {items.map((item, idx) => (
        <TouchableOpacity
          key={idx}
          style={statStyles.cell}
          onPress={() => { haptic.light(); item.onPress(); }}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Icon name={item.icon} size={16} color={Colors.ink4} style={statStyles.cellIcon} />
          {loading ? (
            <Skeleton height={18} width={32} radius={Radius.xs} />
          ) : (
            <Text style={statStyles.cellValue}>{item.count !== null ? item.count : '0'}</Text>
          )}
          <Text style={statStyles.cellLabel} numberOfLines={1}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const statStyles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    backgroundColor: '#FFFFFF',
    borderRadius:    16,
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     'rgba(0,0,0,0.07)',
    overflow:        'hidden',
    shadowColor:     '#000000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.02,
    shadowRadius:    3,
    elevation:       1,
  },
  cell: {
    flex:            1,
    alignItems:      'center',
    paddingVertical: Space[4],
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#EEEAE5',
    gap:             3,
  },
  cellIcon: {
    marginBottom: 2,
  },
  cellValue: {
    fontFamily:    FontFamily.serif,
    fontSize:      20,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.3,
    lineHeight:    22,
  },
  cellLabel: {
    ...Type.caption,
    fontSize: 11,
    color:    Colors.ink4,
  },
});

// ── Menu row ──────────────────────────────────────────────────────────────────
const MenuRow: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
  showDivider?: boolean;
  danger?: boolean;
}> = ({ icon, label, onPress, showDivider = true, danger = false }) => {
  const haptic = useHaptic();
  return (
    <TouchableOpacity
      onPress={() => { haptic.light(); onPress(); }}
      activeOpacity={0.65}
      style={[rowStyles.row, showDivider && rowStyles.border]}
    >
      <View style={[rowStyles.iconWrap, danger && rowStyles.iconWrapDanger]}>
        <Icon name={icon} size={17} color={danger ? Colors.danger : Colors.ink3} />
      </View>
      <Text style={[rowStyles.label, danger && rowStyles.labelDanger]}>{label}</Text>
      {!danger && <Icon name="chevron-forward" size={14} color={Colors.ink5} />}
    </TouchableOpacity>
  );
};

const rowStyles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: Space[4],
    gap:             Space[3],
    minHeight:       52,
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEAE5',
  },
  iconWrap: {
    width:           34,
    height:          34,
    borderRadius:    10,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  iconWrapDanger: {
    backgroundColor: 'rgba(185,28,28,0.06)',
  },
  label: {
    flex:       1,
    fontSize:   15,
    fontWeight: '500',
    color:      Colors.ink1,
    lineHeight: 20,
  },
  labelDanger: {
    color: Colors.danger,
  },
});

const GUEST_BENEFITS = [
  'Order tracking',
  'Easy returns',
  'Saved addresses',
  'Wishlist',
  'Faster checkout',
  'Exclusive offers',
];

// ── Logged-out view ───────────────────────────────────────────────────────────
const LoggedOutView: React.FC<{
  onSignIn: () => void;
  onRegister: () => void;
}> = ({ onSignIn, onRegister }) => (
  <View style={loggedOutStyles.root}>
    <View style={loggedOutStyles.iconCircle}>
      <Icon name="person-outline" size={26} color={Colors.accent} />
    </View>
    <Text style={loggedOutStyles.title}>Your account</Text>
    <Text style={loggedOutStyles.body}>
      Sign in to track orders, save favourites, manage addresses and enjoy a faster checkout.
    </Text>
    <View style={loggedOutStyles.ctaWrap}>
      <PrimaryButton label="Sign In" onPress={onSignIn} />
    </View>
    <TouchableOpacity
      onPress={onRegister}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={loggedOutStyles.secondaryWrap}
    >
      <Text style={loggedOutStyles.registerText}>Create Account →</Text>
    </TouchableOpacity>

    <View style={loggedOutStyles.divider} />

    <View style={loggedOutStyles.benefitsRow}>
      {GUEST_BENEFITS.map(b => (
        <View key={b} style={loggedOutStyles.chip}>
          <Icon name="checkmark" size={10} color={Colors.accent} />
          <Text style={loggedOutStyles.chipText}>{b}</Text>
        </View>
      ))}
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
    width:           88,
    height:          88,
    borderRadius:    44,
    backgroundColor: 'rgba(178, 90, 61, 0.08)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Space[5],
  },
  title: {
    fontFamily:    FontFamily.serif,
    fontSize:      26,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.5,
    lineHeight:    26 * 1.1,
    marginBottom:  Space[2],
    textAlign:     'center',
  },
  body: {
    ...Type.caption,
    color:      Colors.ink3,
    textAlign:  'center',
    maxWidth:   280,
    lineHeight: 13 * 1.6,
  },
  ctaWrap: {
    width:     '100%',
    marginTop: Space[6],
  },
  secondaryWrap: {
    marginTop: Space[4],
  },
  registerText: {
    ...Type.caption,
    color:      Colors.ink1,
    fontWeight: '500',
  },
  divider: {
    width:           '100%',
    height:          StyleSheet.hairlineWidth,
    backgroundColor: '#EEEAE5',
    marginTop:       Space[6],
    marginBottom:    Space[5],
  },
  benefitsRow: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            Space[2],
    justifyContent: 'center',
  },
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingVertical:   5,
    paddingHorizontal: Space[3],
    backgroundColor:   Colors.surfaceSoft,
    borderRadius:      Radius.pill,
  },
  chipText: {
    fontFamily:    FontFamily.sans,
    fontSize:      11,
    fontWeight:    '400',
    color:         Colors.ink3,
    letterSpacing: 0.1,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────
const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const toast  = useAppToast();
  const { setCartCount } = useCart();

  const heroAnim  = useEntrance(0);
  const statsAnim = useEntrance(80);
  const menuAnim  = useEntrance(160);

  const [session,         setSession]         = useState<LoggedInCustomerInterface | null>(null);
  const [sessionLoading,  setSessionLoading]  = useState(true);
  const [sessionError,    setSessionError]    = useState(false);
  const [addressCount,    setAddressCount]    = useState<number | null>(null);
  const [orderCount,      setOrderCount]      = useState<number | null>(null);
  const [wishlistCount,   setWishlistCount]   = useState<number | null>(null);
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
        const code = parsed.CustomerProfileCode;

        getDeliveryAddresses(code)
          .then(res => {
            if (cancelled) return;
            if (res.statusCode === 1) setAddressCount((res.result || []).length);
          })
          .catch(() => {});

        postOrderHistory(code, 1, {})
          .then(res => {
            if (cancelled) return;
            setOrderCount(res.items.length);
          })
          .catch(() => {});

        getWishlist(code)
          .then((res: any) => {
            if (cancelled) return;
            if (res?.statusCode === 1) setWishlistCount((res.result || []).length);
          })
          .catch(() => {});
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

  // ── Error ───────────────────────────────────────────────────────────────────
  if (sessionError) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F5F2" />
        <View style={[styles.simpleHeader, { paddingTop: insets.top + Space[2] }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="chevron-back" size={24} color={Colors.ink1} />
          </TouchableOpacity>
        </View>
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
        <StatusBar barStyle="dark-content" backgroundColor="#F8F5F2" />
        <View style={[styles.simpleHeader, { paddingTop: insets.top + Space[2] }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="chevron-back" size={24} color={Colors.ink1} />
          </TouchableOpacity>
        </View>
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

  const displayName   = session?.CustomerName || '—';
  const displayEmail  = session?.EmailID      || null;
  const displayMobile = session?.MobileNumber !== undefined ? String(session.MobileNumber) : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F5F2" />

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
          title="Sign out?"
          body="You'll need to sign in again to access your orders and wishlist."
          confirmLabel="Sign out"
          destructive
        />
      )}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <Animated.View style={heroAnim}>
          <View style={[styles.heroNav, { paddingTop: insets.top + Space[2] }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="chevron-back" size={24} color={Colors.ink1} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroBody}>
            {/* Avatar + edit row */}
            <View style={styles.heroAvatarRow}>
              {sessionLoading ? (
                <View style={[avatarStyles.circle, { backgroundColor: Colors.surfaceDeep }]} />
              ) : (
                <Avatar name={displayName} />
              )}
              <TouchableOpacity
                onPress={() => { haptic.light(); setEditVisible(true); }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={!session}
                style={styles.manageBtn}
              >
                <Text style={styles.manageBtnText}>Manage Account</Text>
              </TouchableOpacity>
            </View>

            {/* Identity */}
            <View style={styles.heroIdentity}>
              {sessionLoading ? (
                <>
                  <Skeleton height={26} width={160} radius={Radius.xs} />
                  <Skeleton height={10} width={90}  radius={Radius.xs} style={{ marginTop: Space[2] }} />
                  <Skeleton height={10} width={130} radius={Radius.xs} style={{ marginTop: Space[1] }} />
                </>
              ) : (
                <>
                  <Text style={styles.heroName}>{displayName}</Text>
                  <View style={styles.memberBadge}>
                    <Text style={styles.memberBadgeText}>◆ {BRAND.memberLabel}</Text>
                  </View>
                  {displayMobile
                    ? <Text style={styles.heroContact}>{displayMobile}</Text>
                    : null}
                  {displayEmail
                    ? <Text style={styles.heroContact}>{displayEmail}</Text>
                    : null}
                </>
              )}
            </View>
          </View>

          {/* Divider between hero and cards */}
          <View style={styles.heroDivider} />
        </Animated.View>

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, statsAnim]}>
          <StatRow
            orderCount={orderCount}
            wishlistCount={wishlistCount}
            addressCount={addressCount}
            loading={sessionLoading}
            onOrders={() => navigation.navigate('Orders')}
            onWishlist={() => navigation.navigate('Wishlist')}
            onAddresses={() => navigation.navigate('AddressManagement')}
          />
        </Animated.View>

        {/* ── Menus ────────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, menuAnim]}>

          <View style={styles.menuCard}>
            <Text style={styles.menuLabel}>ACCOUNT</Text>
            <MenuRow
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => { haptic.light(); setPasswordVisible(true); }}
              showDivider={false}
            />
          </View>

          <View style={[styles.menuCard, { marginTop: Space[3] }]}>
            <Text style={styles.menuLabel}>SUPPORT</Text>
            <MenuRow
              icon="help-circle-outline"
              label="Help Center"
              onPress={() => {}}
            />
            <MenuRow
              icon="mail-outline"
              label="Contact Us"
              onPress={() => {}}
              showDivider={false}
            />
          </View>

          <View style={[styles.menuCard, { marginTop: Space[3], paddingTop: 0, paddingBottom: 0 }]}>
            <MenuRow
              icon="log-out-outline"
              label="Sign out"
              onPress={() => { haptic.light(); setLogoutVisible(true); }}
              showDivider={false}
              danger
            />
          </View>

          <Text style={styles.version}>Version {APP_VERSION}</Text>
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
    backgroundColor: '#F8F5F2',
  },
  simpleHeader: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[3],
    backgroundColor:   '#F8F5F2',
  },
  scroll: {
    flex: 1,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroNav: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
    backgroundColor:   '#F8F5F2',
  },
  heroBody: {
    backgroundColor:   '#F8F5F2',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[8],
  },
  heroAvatarRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Space[4],
  },
  manageBtn: {
    paddingVertical:   6,
    paddingHorizontal: Space[3],
    borderRadius:      Radius.pill,
    borderWidth:       StyleSheet.hairlineWidth,
    borderColor:       Colors.rule,
    backgroundColor:   Colors.surfaceSoft,
  },
  manageBtnText: {
    fontFamily:    FontFamily.mono,
    fontSize:      10,
    letterSpacing: 0.5,
    color:         Colors.ink3,
    textTransform: 'uppercase',
  },
  heroIdentity: {
    gap: 4,
  },
  heroName: {
    fontFamily:    FontFamily.serif,
    fontSize:      26,
    fontWeight:    '400',
    letterSpacing: -0.5,
    color:         Colors.ink1,
    lineHeight:    30,
  },
  memberBadge: {
    alignSelf:         'flex-start',
    paddingVertical:   2,
    paddingHorizontal: 6,
    borderRadius:      3,
    backgroundColor:   'rgba(178, 90, 61, 0.07)',
    marginTop:         4,
    marginBottom:      4,
  },
  memberBadgeText: {
    fontFamily:    FontFamily.mono,
    fontSize:      8,
    letterSpacing: 1.0,
    color:         Colors.accent,
    textTransform: 'uppercase',
  },
  heroContact: {
    ...Type.caption,
    color:      Colors.ink4,
    lineHeight: 18,
  },
  heroDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom:    Space[5],
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: Space.screenH,
    marginBottom:      Space[3],
  },

  // ── Menu card ─────────────────────────────────────────────────────────────
  menuCard: {
    backgroundColor:   '#FFFFFF',
    borderRadius:      16,
    borderWidth:       StyleSheet.hairlineWidth,
    borderColor:       '#EEEAE5',
    paddingHorizontal: Space[4],
    paddingTop:        Space[3],
    paddingBottom:     Space[1],
    shadowColor:       '#000000',
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.02,
    shadowRadius:      3,
    elevation:         1,
  },
  menuLabel: {
    fontFamily:    FontFamily.mono,
    fontSize:      9,
    letterSpacing: 1.4,
    color:         Colors.ink4,
    textTransform: 'uppercase',
    marginBottom:  Space[1],
  },

  // ── Version ───────────────────────────────────────────────────────────────
  version: {
    ...Type.caption,
    color:     Colors.ink5,
    textAlign: 'center',
    marginTop: Space[5],
  },
});

export default ProfileScreen;
