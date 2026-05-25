import React, { useEffect, useState } from 'react';
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
import Icon from 'react-native-vector-icons/Ionicons';
import { clearSession } from '../utils/auth';
import { BottomNavBar } from '../components/ui';
import { getDeliveryAddresses } from '../api/address';
import { DeliveryAddress } from './AddressScreen';
import { Colors, Space } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { useSession } from '../hooks/useSession';

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

// ── Screen ────────────────────────────────────────────────────────────────────
const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets  = useSafeAreaInsets();
  const session = useSession();

  const headerAnim   = useEntrance(0);
  const infoAnim     = useEntrance(80);
  const addressAnim  = useEntrance(160);
  const activityAnim = useEntrance(240);
  const logoutAnim   = useEntrance(300);

  const [primaryAddress, setPrimaryAddress] = useState<DeliveryAddress | null>(null);

  useEffect(() => {
    if (!session?.CustomerProfileCode) return;
    getDeliveryAddresses(session.CustomerProfileCode).then(res => {
      if (res.statusCode !== 1) return;
      const list: DeliveryAddress[] = res.result || [];
      const primary = list.find(a => a.IsPrimary) ?? list[0] ?? null;
      setPrimaryAddress(primary);
    }).catch(() => {});
  }, [session?.CustomerProfileCode]);

  const handleLogout = async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const displayName  = session?.CustomerName || '—';
  const displayEmail = session?.EmailID      || '—';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />

      {/* Dark editorial header — identity, not decoration */}
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
          <SectionLabel>ACCOUNT</SectionLabel>
          <ProfileRow label="Name"   value={displayName} />
          <ProfileRow
            label="Mobile"
            value={session?.MobileNumber !== undefined ? String(session.MobileNumber) : '—'}
          />
          <ProfileRow label="Email"  value={displayEmail} isLast />
        </Animated.View>

        {/* Address */}
        <Animated.View style={[styles.sectionBlock, addressAnim]}>
          <SectionLabel>ADDRESS</SectionLabel>
          {primaryAddress ? (
            <>
              <ProfileRow label="Name"   value={primaryAddress.CustomerName} />
              <ProfileRow label="Street" value={[primaryAddress.Address, primaryAddress.StreetName].filter(Boolean).join(', ') || '—'} />
              <ProfileRow label="City"   value={[primaryAddress.City, primaryAddress.Zipcode].filter(Boolean).join(' — ') || '—'} />
              {primaryAddress.Landmark ? (
                <ProfileRow label="Landmark" value={primaryAddress.Landmark} />
              ) : null}
              <ProfileRow label="Mobile" value={String(primaryAddress.MobileNumber)} isLast={false} />
            </>
          ) : (
            <ProfileRow label="No address saved." isLast={false} />
          )}
          <ProfileRow
            label="Manage addresses"
            icon="chevron-forward"
            onPress={() => navigation.navigate('AddressManagement')}
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

        {/* Log out — separated by extra vertical space to signal destructive zone */}
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
    marginTop:    Space[8],
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
    paddingTop:   Space[2],
  },
});

export default ProfileScreen;
