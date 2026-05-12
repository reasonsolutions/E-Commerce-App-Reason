import React, { useEffect, useRef, useState } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavBar } from '../components/ui';
import { Colors, Space, Radius, Shadow, FontSize, FontWeight } from '../theme';

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

function useEntrance(delay = 0) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 480, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);
  return { opacity, transform: [{ translateY }] };
}

// ── Section group ────────────────────────────────────────────────────────────
const Section: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={sectionStyles.card}>{children}</View>
);

const SectionRow: React.FC<{
  label: string;
  value?: string;
  icon?: string;
  onPress?: () => void;
  last?: boolean;
  destructive?: boolean;
}> = ({ label, value, icon, onPress, last, destructive }) => (
  <TouchableOpacity
    style={[sectionStyles.row, !last && sectionStyles.rowBorder]}
    onPress={onPress}
    activeOpacity={onPress ? 0.72 : 1}
    disabled={!onPress}
  >
    <Text style={[sectionStyles.label, destructive && sectionStyles.labelDestructive]}>
      {label}
    </Text>
    <View style={sectionStyles.rowRight}>
      {value ? <Text style={sectionStyles.value} numberOfLines={1}>{value}</Text> : null}
      {icon ? <Icon name={icon} size={16} color={destructive ? Colors.danger : Colors.ink4} /> : null}
    </View>
  </TouchableOpacity>
);

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Space[4],
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Space[4],
    minHeight: 52,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.line,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[2],
    flex: 1,
    justifyContent: 'flex-end',
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.ink1,
    flexShrink: 0,
  },
  labelDestructive: {
    color: Colors.danger,
  },
  value: {
    fontSize: FontSize.base,
    color: Colors.ink3,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: Space[4],
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────
const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);

  const infoAnim    = useEntrance(80);
  const detailAnim  = useEntrance(160);
  const actionsAnim = useEntrance(240);

  useEffect(() => {
    const fetchProfile = async () => {
      const userData = await AsyncStorage.getItem('userData');
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
    await AsyncStorage.removeItem('userData');
    navigation.navigate('Login');
  };

  const displayName = profile?.CustomerName || '—';
  const displayEmail = profile?.EmailID || '—';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Dark editorial header */}
      <View style={[styles.header, { paddingTop: insets.top + Space[3] }]}>
        <Text style={styles.eyebrow}>MY ACCOUNT</Text>
        <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.email} numberOfLines={1}>{displayEmail}</Text>
      </View>

      {/* Tonal bridge */}
      <LinearGradient
        colors={['#0A0A0A', Colors.surfaceAlt]}
        style={styles.bridge}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Space[8] + 60 },
        ]}
      >
        {/* Account info */}
        <Animated.View style={[styles.sectionWrap, infoAnim]}>
          <Text style={styles.sectionLabel}>Account</Text>
          <Section>
            <SectionRow
              label="Name"
              value={displayName}
            />
            <SectionRow
              label="Mobile"
              value={profile?.MobileNumber ? String(profile.MobileNumber) : '—'}
            />
            <SectionRow
              label="Email"
              value={displayEmail}
              last
            />
          </Section>
        </Animated.View>

        {/* Address */}
        <Animated.View style={[styles.sectionWrap, detailAnim]}>
          <Text style={styles.sectionLabel}>Address</Text>
          <Section>
            <SectionRow
              label="Street"
              value={profile?.Address || profile?.StreetName || '—'}
            />
            <SectionRow
              label="City"
              value={profile?.CityName || '—'}
            />
            <SectionRow
              label="Postcode"
              value={profile?.Zipcode ? String(profile.Zipcode) : '—'}
              last
            />
          </Section>
        </Animated.View>

        {/* Navigation shortcuts */}
        <Animated.View style={[styles.sectionWrap, actionsAnim]}>
          <Text style={styles.sectionLabel}>Activity</Text>
          <Section>
            <SectionRow
              label="Order History"
              icon="chevron-forward"
              onPress={() => navigation.navigate('Orders')}
            />
            <SectionRow
              label="Saved Items"
              icon="chevron-forward"
              onPress={() => navigation.navigate('Wishlist')}
              last
            />
          </Section>
        </Animated.View>

        {/* Logout */}
        <Animated.View style={[styles.sectionWrap, actionsAnim]}>
          <Section>
            <SectionRow
              label="Log out"
              icon="log-out-outline"
              onPress={handleLogout}
              destructive
              last
            />
          </Section>
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
    backgroundColor: Colors.surfaceAlt,
  },

  // ── Header ──
  header: {
    backgroundColor: '#0A0A0A',
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[6],
    gap: 3,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 1.4,
    marginBottom: Space[1],
  },
  displayName: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: FontSize['2xl'] * 1.15,
  },
  email: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.1,
  },

  // ── Bridge ──
  bridge: {
    height: 48,
    marginTop: -1,
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
    marginTop: -Space[3],
  },
  scrollContent: {
    paddingHorizontal: Space.screenH,
    gap: Space[4],
    paddingTop: Space[2],
  },

  // ── Section group ──
  sectionWrap: {
    gap: Space[2],
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.ink4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: Space[1],
  },
});

export default ProfileScreen;
