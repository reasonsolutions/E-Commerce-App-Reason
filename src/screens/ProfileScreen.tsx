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
} from '../components/ui';
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

// ── Avatar initials circle ────────────────────────────────────────────────────
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
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: Colors.surfaceDeep,
    alignItems:      'center',
    justifyContent:  'center',
  },
  text: {
    fontFamily:    FontFamily.serif,
    fontSize:      18,
    fontWeight:    '400',
    color:         Colors.ink3,
    letterSpacing: 0.5,
  },
});

// ── Menu row ──────────────────────────────────────────────────────────────────
const MenuRow: React.FC<{
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
  isLast?: boolean;
}> = ({ icon, label, sub, onPress, isLast }) => {
  const haptic = useHaptic();
  return (
    <TouchableOpacity
      onPress={() => { haptic.light(); onPress(); }}
      activeOpacity={0.7}
      style={[menuRowStyles.row, !isLast && menuRowStyles.border]}
    >
      <View style={menuRowStyles.iconWrap}>
        <Icon name={icon} size={20} color={Colors.ink2} />
      </View>
      <View style={menuRowStyles.textWrap}>
        <Text style={menuRowStyles.label}>{label}</Text>
        <Text style={menuRowStyles.sub}>{sub}</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={Colors.ink4} />
    </TouchableOpacity>
  );
};

const menuRowStyles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   Space[4],
    gap:               Space[4],
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  iconWrap: {
    width:  28,
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    gap:  2,
  },
  label: {
    fontFamily:    FontFamily.sans,
    fontSize:      15,
    fontWeight:    '500',
    color:         Colors.ink1,
    letterSpacing: 0,
  },
  sub: {
    ...Type.caption,
    color: Colors.ink4,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────
const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const toast  = useAppToast();
  const { setCartCount } = useCart();

  const cardAnim    = useEntrance(60);
  const menuAnim    = useEntrance(140);
  const logoutAnim  = useEntrance(220);

  const [session,       setSession]       = useState<LoggedInCustomerInterface | null>(null);
  const [addressCount,  setAddressCount]  = useState<number>(0);
  const [editVisible,   setEditVisible]   = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);

  useFocusEffect(useCallback(() => {
    let cancelled = false;

    const load = async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      if (cancelled || !raw) return;
      let parsed: LoggedInCustomerInterface;
      try { parsed = JSON.parse(raw); } catch { return; }
      if (!cancelled) setSession(parsed);

      if (!parsed.CustomerProfileCode) return;
      try {
        const res = await getDeliveryAddresses(parsed.CustomerProfileCode);
        if (cancelled) return;
        if (res.statusCode === 1) {
          const list: DeliveryAddress[] = res.result || [];
          setAddressCount(list.length);
        }
      } catch {}
    };

    load();
    return () => { cancelled = true; };
  }, []));

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

  const displayName   = session?.CustomerName  || '—';
  const displayEmail  = session?.EmailID       || '—';
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

      {/* ── Inline light header ───────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Space[3] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-back" size={22} color={Colors.ink1} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => { haptic.light(); setEditVisible(true); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={!session}
        >
          <Icon name="create-outline" size={22} color={session ? Colors.ink1 : Colors.ink5} />
        </TouchableOpacity>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Space[8] + 60 },
        ]}
      >
        {/* ── Profile identity ─────────────────────────────────────────────── */}
        <Animated.View style={[styles.profileCard, cardAnim]}>
          {session ? (
            <Avatar name={displayName} />
          ) : (
            <View style={[avatarStyles.circle, { backgroundColor: Colors.surfaceSoft }]} />
          )}
          <View style={styles.profileInfo}>
            {session ? (
              <>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileMeta}>
                  {displayMobile ?? displayEmail}
                </Text>
              </>
            ) : (
              <>
                <Skeleton height={16} width={160} radius={Radius.xs} />
                <Skeleton height={11} width={120} radius={Radius.xs} style={{ marginTop: Space[2] }} />
              </>
            )}
          </View>
        </Animated.View>

        {/* ── Menu list ────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.menuCard, menuAnim]}>
          <MenuRow
            icon="heart-outline"
            label="My Wishlist"
            sub="View saved products"
            onPress={() => navigation.navigate('Wishlist')}
          />
          <MenuRow
            icon="cube-outline"
            label="Orders"
            sub="Track and reorder"
            onPress={() => navigation.navigate('Orders')}
          />
          <MenuRow
            icon="location-outline"
            label="Addresses"
            sub={addressCount > 0 ? `${addressCount} saved address${addressCount !== 1 ? 'es' : ''}` : 'Manage delivery addresses'}
            onPress={() => navigation.navigate('AddressManagement')}
          />
          <MenuRow
            icon="mail-outline"
            label="Email"
            sub={displayEmail}
            onPress={() => { haptic.light(); setEditVisible(true); }}
            isLast
          />
        </Animated.View>

        {/* ── Log out ──────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.logoutBlock, logoutAnim]}>
          <TouchableOpacity
            onPress={() => { haptic.warning(); setLogoutVisible(true); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.logoutText}>Logout</Text>
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

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[3],
    backgroundColor:   Colors.surface,
  },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[6],
  },

  // ── Profile identity (flat — sits directly on surface) ───────────────────────
  profileCard: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[4],
    paddingBottom: Space[6],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
    marginBottom:  Space[2],
  },
  profileInfo: {
    flex: 1,
    gap:  3,
  },
  profileName: {
    fontFamily:    FontFamily.serif,
    fontSize:      24,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.5,
    lineHeight:    26,
  },
  profileMeta: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    color:         Colors.ink4,
    letterSpacing: 0.2,
  },

  // ── Menu list (flat — no card border) ────────────────────────────────────────
  menuCard: {
    paddingTop: Space[2],
  },

  // ── Logout ────────────────────────────────────────────────────────────────────
  logoutBlock: {
    marginTop:    Space[10],
    alignItems:   'flex-start',
  },
  logoutText: {
    fontFamily:  FontFamily.sans,
    fontSize:    15,
    fontWeight:  '600',
    color:       Colors.danger,
  },
});

export default ProfileScreen;
