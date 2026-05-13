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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { BottomNavBar } from '../components/ui';
import { Colors, Space } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';

type Profile = {
  CustomerProfileCode: number;
  CustomerName: string;
  Address: string;
  StreetName: string;
  CityName: string;
  Zipcode: number;
  CountryCode: number;
  MobileNumber: number;
  EmailID: string;
  CartDetailsCount: number;
};

type ProfileScreenProps = {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
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
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);

  const headerAnim  = useEntrance(0);
  const infoAnim    = useEntrance(80);
  const addressAnim = useEntrance(160);
  const activityAnim = useEntrance(240);
  const logoutAnim  = useEntrance(300);

  useEffect(() => {
    const fetchProfile = async () => {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
      if (userData) {
        const parsed = JSON.parse(userData);
        setProfile({
          CustomerProfileCode: parsed.CustomerProfileCode,
          CustomerName:        parsed.CustomerName,
          Address:             parsed.Address,
          StreetName:          parsed.StreetName,
          CityName:            parsed.CityName,
          Zipcode:             parsed.Zipcode,
          CountryCode:         parsed.CountryCode,
          MobileNumber:        parsed.MobileNumber,
          EmailID:             parsed.EmailID,
          CartDetailsCount:    parsed.CartDetailsCount,
        });
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.userData);
    navigation.navigate('Login');
  };

  const displayName  = profile?.CustomerName || '—';
  const displayEmail = profile?.EmailID || '—';

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
            value={profile?.MobileNumber ? String(profile.MobileNumber) : '—'}
          />
          <ProfileRow label="Email"  value={displayEmail} isLast />
        </Animated.View>

        {/* Address */}
        <Animated.View style={[styles.sectionBlock, addressAnim]}>
          <SectionLabel>ADDRESS</SectionLabel>
          <ProfileRow
            label="Street"
            value={profile?.Address || profile?.StreetName || '—'}
          />
          <ProfileRow label="City"     value={profile?.CityName || '—'} />
          <ProfileRow
            label="Postcode"
            value={profile?.Zipcode ? String(profile.Zipcode) : '—'}
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
