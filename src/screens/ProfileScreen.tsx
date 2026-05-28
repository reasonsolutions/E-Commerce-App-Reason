import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { clearSession } from '../utils/auth';
import { BottomNavBar, Skeleton, FloatingLabelInput, PrimaryButton } from '../components/ui';
import { ErrorBanner } from '../components/ui';
import { getDeliveryAddresses } from '../api/address';
import { postUpdateCustomer } from '../api/auth';
import { DeliveryAddress } from './AddressScreen';
import { STORAGE_KEYS } from '../config/storageKeys';
import type { LoggedInCustomerInterface } from '../api/interfaces';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';

type ProfileScreenProps = {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
    reset: (state: { index: number; routes: { name: string }[] }) => void;
  };
};

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ children: string }> = ({ children }) => (
  <Text style={sectionStyles.sectionLabel}>{children}</Text>
);

// ── Single profile row ────────────────────────────────────────────────────────
const ProfileRow: React.FC<{
  label: string;
  value?: string;
  icon?: string;
  onPress?: () => void;
  isLast?: boolean;
  destructive?: boolean;
}> = ({ label, value, icon, onPress, isLast, destructive }) => {
  const haptic = useHaptic();
  const { animatedStyle, handlers } = useTactile();

  const handlePress = () => {
    if (!onPress) return;
    if (destructive) {
      haptic.warning();
    } else {
      haptic.light();
    }
    onPress();
  };

  const rowContent = (
    <View style={[sectionStyles.row, !isLast && sectionStyles.rowDivider]}>
      <Text style={[sectionStyles.rowLabel, destructive && sectionStyles.rowLabelDestructive]}>
        {label}
      </Text>
      <View style={sectionStyles.rowRight}>
        {value ? (
          <Text style={sectionStyles.rowValue} numberOfLines={1}>{value}</Text>
        ) : null}
        {icon ? (
          <Icon
            name={icon}
            size={15}
            color={destructive ? Colors.danger : Colors.ink4}
          />
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return rowContent;

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        {...handlers}
        onPress={handlePress}
        activeOpacity={1}
      >
        {rowContent}
      </TouchableOpacity>
    </Animated.View>
  );
};

const sectionStyles = StyleSheet.create({
  sectionLabel: {
    ...Type.label,
    color:             Colors.ink4,
    marginBottom:      Space[2],
    paddingHorizontal: 1,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: Space[4],
    minHeight: 50,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  rowRight: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Space[2],
    flex:           1,
    justifyContent: 'flex-end',
  },
  rowLabel: {
    ...Type.body,
    flexShrink: 0,
  },
  rowLabelDestructive: {
    color: Colors.danger,
  },
  rowValue: {
    ...Type.caption,
    textAlign:   'right',
    flexShrink:  1,
    marginLeft:  Space[4],
  },
});

// ── Edit modal ────────────────────────────────────────────────────────────────
const EditProfileModal: React.FC<{
  session: LoggedInCustomerInterface;
  visible: boolean;
  onClose: () => void;
  onSaved: (updated: LoggedInCustomerInterface) => void;
}> = ({ session, visible, onClose, onSaved }) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const [name,     setName]     = useState(session.CustomerName  ?? '');
  const [email,    setEmail]    = useState(session.EmailID       ?? '');
  const [mobile,   setMobile]   = useState(session.MobileNumber !== undefined ? String(session.MobileNumber) : '');
  const [saving,   setSaving]   = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset fields whenever modal opens
  useEffect(() => {
    if (visible) {
      setName(session.CustomerName ?? '');
      setEmail(session.EmailID ?? '');
      setMobile(session.MobileNumber !== undefined ? String(session.MobileNumber) : '');
      setSaveError(null);
    }
  }, [visible, session]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaveError(null);

    if (!name.trim() || !email.trim() || !mobile.trim()) {
      setSaveError('Name, email and mobile are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await postUpdateCustomer({
        CustomerProfileCode: session.CustomerProfileCode,
        CustomerName:        name.trim(),
        EmailID:             email.trim(),
        MobileNumber:        mobile.trim(),
        CountryCode:         230,
      });

      if (res?.statusCode !== 1) {
        setSaveError(res?.userMessage || 'Update failed. Please try again.');
        setSaving(false);
        return;
      }

      const updated: LoggedInCustomerInterface = {
        ...session,
        CustomerName:  name.trim(),
        EmailID:       email.trim(),
        MobileNumber:  Number(mobile.trim()),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.userData, JSON.stringify(updated));
      haptic.success();
      setSaving(false);
      onSaved(updated);
    } catch (err: any) {
      setSaveError(err?.message ?? 'Something went wrong.');
      setSaving(false);
    }
  }, [saving, name, email, mobile, session, haptic, onSaved]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[editStyles.root, { paddingTop: insets.top + Space[2] }]}>
        {/* Sheet header */}
        <View style={editStyles.sheetHeader}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={22} color={Colors.ink2} />
          </TouchableOpacity>
          <Text style={editStyles.sheetTitle}>Edit Profile</Text>
          <View style={{ width: 22 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={editStyles.fields}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {saveError ? (
              <ErrorBanner title="Update failed" body={saveError} onRetry={handleSave} />
            ) : null}

            <FloatingLabelInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
              activeColor={Colors.ink1}
            />
            <FloatingLabelInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              activeColor={Colors.ink1}
            />
            <FloatingLabelInput
              label="Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={handleSave}
              activeColor={Colors.ink1}
            />
            <View style={editStyles.ctaWrap}>
              <PrimaryButton
                label={saving ? '···' : 'Save changes'}
                onPress={handleSave}
                isDisabled={saving}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const editStyles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  sheetHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  sheetTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      17,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.2,
  },
  fields: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[8],
    paddingBottom:     Space[8],
    gap:               Space[8],
  },
  ctaWrap: {
    marginTop: Space[4],
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────
const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const headerAnim   = useEntrance(0);
  const infoAnim     = useEntrance(80);
  const addressAnim  = useEntrance(160);
  const activityAnim = useEntrance(240);
  const logoutAnim   = useEntrance(300);

  const [session, setSession]           = useState<LoggedInCustomerInterface | null>(null);
  const [primaryAddress, setPrimaryAddress] = useState<DeliveryAddress | null>(null);
  const [editVisible, setEditVisible]   = useState(false);

  // Re-read session on every focus so in-app edits and external changes are reflected
  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem(STORAGE_KEYS.userData).then(raw => {
      if (!raw) return;
      try { setSession(JSON.parse(raw)); } catch {}
    });
  }, []));

  useEffect(() => {
    if (!session?.CustomerProfileCode) return;
    getDeliveryAddresses(session.CustomerProfileCode).then(res => {
      if (res.statusCode !== 1) return;
      const list: DeliveryAddress[] = res.result || [];
      setPrimaryAddress(list.find(a => a.IsPrimary) ?? list[0] ?? null);
    }).catch(() => {});
  }, [session?.CustomerProfileCode]);

  const handleSaved = useCallback((updated: LoggedInCustomerInterface) => {
    setSession(updated);
    setEditVisible(false);
  }, []);

  const handleLogout = () => {
    haptic.warning();
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ],
      { cancelable: true },
    );
  };

  const displayName  = session?.CustomerName || '—';
  const displayEmail = session?.EmailID      || '—';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />

      {session && (
        <EditProfileModal
          session={session}
          visible={editVisible}
          onClose={() => setEditVisible(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Dark editorial header */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + Space[2] }, headerAnim]}
      >
        <Text style={styles.eyebrow}>MY ACCOUNT</Text>
        <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.displayEmail} numberOfLines={1}>{displayEmail}</Text>
        <View style={styles.headerSeam} />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Space[8] + 60 },
        ]}
      >
        {/* Account */}
        <Animated.View style={infoAnim}>
          <View style={styles.sectionHeader}>
            <Text style={[sectionStyles.sectionLabel, { marginBottom: 0 }]}>ACCOUNT</Text>
            {session ? (
              <TouchableOpacity
                onPress={() => { haptic.light(); setEditVisible(true); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {!session ? (
            <View style={styles.skeletonBlock}>
              <Skeleton height={12} width="40%" radius={Radius.xs} />
              <Skeleton height={12} width="60%" radius={Radius.xs} />
              <Skeleton height={12} width="50%" radius={Radius.xs} />
            </View>
          ) : (
            <>
              <ProfileRow label="Name"   value={displayName} />
              <ProfileRow
                label="Mobile"
                value={session.MobileNumber !== undefined ? String(session.MobileNumber) : '—'}
              />
              <ProfileRow label="Email"  value={displayEmail} isLast />
            </>
          )}
        </Animated.View>

        {/* Address */}
        <Animated.View style={[styles.sectionBlock, addressAnim]}>
          <SectionLabel>ADDRESS</SectionLabel>
          {primaryAddress ? (
            <View style={styles.addressBlock}>
              <Text style={styles.addressName}>{primaryAddress.CustomerName}</Text>
              <Text style={styles.addressLine}>
                {[primaryAddress.Address, primaryAddress.StreetName].filter(Boolean).join(', ')}
              </Text>
              {primaryAddress.Landmark ? (
                <Text style={styles.addressLine}>{primaryAddress.Landmark}</Text>
              ) : null}
              <Text style={styles.addressLine}>
                {[primaryAddress.City, primaryAddress.Zipcode].filter(Boolean).join(' · ')}
              </Text>
              <Text style={styles.addressMobile}>{String(primaryAddress.MobileNumber)}</Text>
            </View>
          ) : (
            <View style={styles.addressEmpty}>
              <Text style={styles.addressEmptyText}>No address saved.</Text>
            </View>
          )}
          <View style={styles.divider} />
          <ProfileRow
            label="Manage addresses"
            icon="chevron-forward"
            onPress={() => navigation.navigate('Address')}
            isLast
          />
        </Animated.View>

        {/* Activity */}
        <Animated.View style={[styles.sectionBlock, activityAnim]}>
          <SectionLabel>ACTIVITY</SectionLabel>
          <ProfileRow
            label="Order History"
            icon="chevron-forward"
            onPress={() => navigation.navigate('Orders')}
          />
          <ProfileRow
            label="Saved Items"
            icon="chevron-forward"
            onPress={() => navigation.navigate('Wishlist')}
            isLast
          />
        </Animated.View>

        {/* Log out */}
        <Animated.View style={[styles.logoutBlock, logoutAnim]}>
          <ProfileRow
            label="Log out"
            icon="log-out-outline"
            onPress={handleLogout}
            destructive
            isLast
          />
        </Animated.View>
      </ScrollView>

      <BottomNavBar
        activeTab="Profile"
        onNavigate={(route) => navigation.navigate(route)}
      />
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
    backgroundColor:   Colors.ink1,
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[5],
    gap:               4,
  },
  eyebrow: {
    ...Type.label,
    color:        'rgba(255,255,255,0.30)',
    marginBottom: Space[1],
  },
  displayName: {
    fontFamily:    FontFamily.serif,
    fontSize:      26,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight:    26 * 1.1,
  },
  displayEmail: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    color:         'rgba(255,255,255,0.38)',
    letterSpacing: 0.2,
    marginTop:     2,
  },
  headerSeam: {
    height:           StyleSheet.hairlineWidth,
    backgroundColor:  'rgba(255,255,255,0.06)',
    marginTop:        Space[4],
    marginHorizontal: -Space.screenH,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
  },

  // ── Section spacing ───────────────────────────────────────────────────────────
  sectionBlock: {
    marginTop: Space[6],
  },
  logoutBlock: {
    marginTop:       Space[8],
    borderTopWidth:  StyleSheet.hairlineWidth,
    borderTopColor:  Colors.rule,
    paddingTop:      Space[2],
  },

  // ── Address block ─────────────────────────────────────────────────────────────
  addressBlock: {
    paddingVertical: Space[4],
    gap:             4,
  },
  addressName: {
    fontFamily:    FontFamily.serif,
    fontSize:      15,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.1,
    marginBottom:  2,
  },
  addressLine: {
    ...Type.caption,
    color:      Colors.ink2,
    lineHeight: 18,
  },
  addressMobile: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    color:         Colors.ink4,
    letterSpacing: 0.2,
    marginTop:     4,
  },
  addressEmpty: {
    paddingVertical: Space[4],
  },
  addressEmptyText: {
    ...Type.caption,
    color: Colors.ink4,
  },
  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  skeletonBlock: {
    paddingVertical: Space[4],
    gap:             Space[3],
  },

  // ── Account section header row ────────────────────────────────────────────────
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'space-between',
    marginBottom:   Space[2],
  },
  editLink: {
    ...Type.caption,
    color: Colors.ink3,
  },
});

export default ProfileScreen;
