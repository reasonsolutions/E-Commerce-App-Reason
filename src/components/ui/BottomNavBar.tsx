import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { FontFamily } from '../../theme/fonts';
import { useHaptic } from '../../hooks/useHaptic';
import { isLoggedIn } from '../../utils/auth';
import { LoginPromptSheet, type LoginPromptContext } from './LoginPromptSheet';

export type NavTab = 'Home' | 'Orders' | 'Wishlist' | 'Cart' | 'Profile';

const PROTECTED_TABS: NavTab[] = ['Orders', 'Wishlist'];

interface BottomNavBarProps {
  activeTab: NavTab;
  onNavigate: (route: NavTab) => void;
  onNavigateToAuth?: (screen: 'Login' | 'Register') => void;
  cartCount?: number;
}

interface TabDef {
  route: NavTab;
  label: string;
  activeIcon: string;
  inactiveIcon: string;
}

const TABS: TabDef[] = [
  { route: 'Home',     label: 'Home',    activeIcon: 'home',          inactiveIcon: 'home-outline' },
  { route: 'Orders',   label: 'Orders',  activeIcon: 'receipt',       inactiveIcon: 'receipt-outline' },
  { route: 'Wishlist', label: 'Wishlist',activeIcon: 'heart',         inactiveIcon: 'heart-outline' },
  { route: 'Cart',     label: 'Cart',    activeIcon: 'bag',           inactiveIcon: 'bag-outline' },
  { route: 'Profile',  label: 'Profile', activeIcon: 'person-circle', inactiveIcon: 'person-circle-outline' },
];

const NavItem: React.FC<{
  tab: TabDef;
  isActive: boolean;
  onPress: () => void;
  cartCount?: number;
}> = ({ tab, isActive, onPress, cartCount }) => {
  const haptic = useHaptic();
  const iconColor = isActive ? Colors.accent : Colors.ink4;

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={() => { haptic.light(); onPress(); }}
      activeOpacity={0.65}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <View style={styles.iconWrap}>
        <Icon name={isActive ? tab.activeIcon : tab.inactiveIcon} size={22} color={iconColor} />
        {tab.route === 'Cart' && cartCount != null && cartCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
};

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onNavigate,
  onNavigateToAuth,
  cartCount,
}) => {
  const insets = useSafeAreaInsets();
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptContext, setPromptContext] = useState<LoginPromptContext>('general');

  const handleTabPress = useCallback(async (route: NavTab) => {
    if (route === activeTab) return;
    if (PROTECTED_TABS.includes(route)) {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        const ctx: LoginPromptContext =
          route === 'Orders'   ? 'orders' :
          route === 'Wishlist' ? 'wishlist' :
          route === 'Profile'  ? 'profile' : 'general';
        setPromptContext(ctx);
        setShowPrompt(true);
        return;
      }
    }
    onNavigate(route);
  }, [activeTab, onNavigate]);

  return (
    <>
      <View
        style={[styles.container, { paddingBottom: Math.max(insets.bottom, Space[2]) }]}
        pointerEvents={showPrompt ? 'none' : 'auto'}
      >
        {TABS.map((tab) => (
          <NavItem
            key={tab.route}
            tab={tab}
            isActive={tab.route === activeTab}
            onPress={() => handleTabPress(tab.route)}
            cartCount={cartCount}
          />
        ))}
      </View>

      <Modal
        visible={showPrompt}
        transparent
        animationType="none"
        onRequestClose={() => setShowPrompt(false)}
        statusBarTranslucent
      >
        <View style={styles.modalWrap} pointerEvents="box-none">
          <LoginPromptSheet
            context={promptContext}
            onClose={() => setShowPrompt(false)}
            onSignIn={() => { setShowPrompt(false); onNavigateToAuth?.('Login'); }}
            onRegister={() => { setShowPrompt(false); onNavigateToAuth?.('Register'); }}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalWrap: {
    flex: 1,
  },
  container: {
    flexDirection:   'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Space[1],
    borderTopWidth:  StyleSheet.hairlineWidth,
    borderTopColor:  Colors.rule,
  },
  tab: {
    flex:          1,
    alignItems:    'center',
    paddingTop:    Space[3],
    paddingBottom: Space[2],
    gap:           5,
  },
  iconWrap: {
    position:        'relative',
    alignItems:      'center',
    justifyContent:  'center',
  },
  badge: {
    position:          'absolute',
    top:               -3,
    right:             -8,
    backgroundColor:   Colors.accent,
    borderRadius:      Radius.pill,
    minWidth:          16,
    height:            16,
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: 3,
    borderWidth:       1.5,
    borderColor:       Colors.surface,
  },
  badgeText: {
    color:      '#FFFFFF',
    fontSize:   9,
    fontFamily: FontFamily.sans,
    fontWeight: '700',
    lineHeight: 11,
  },
  label: {
    fontFamily:    FontFamily.sans,
    fontSize:      10,
    fontWeight:    '400',
    color:         Colors.ink4,
    letterSpacing: 0.2,
  },
  labelActive: {
    color:      Colors.accent,
    fontWeight: '500',
  },
});
