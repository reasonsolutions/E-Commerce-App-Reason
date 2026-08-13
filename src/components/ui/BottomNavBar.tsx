import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { Motion } from '../../theme/motion';
import { Type } from '../../theme/typography';
import { useHaptic } from '../../hooks/useHaptic';
import { isLoggedIn } from '../../utils/auth';
import { LoginPromptSheet, type LoginPromptContext } from './LoginPromptSheet';
import { useCart } from '../../context/CartContext';

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
  { route: 'Cart',     label: 'Cart',    activeIcon: 'cart',          inactiveIcon: 'cart-outline' },
  { route: 'Profile',  label: 'Profile', activeIcon: 'person-circle', inactiveIcon: 'person-circle-outline' },
];

const NavItem: React.FC<{
  tab: TabDef;
  isActive: boolean;
  onPress: () => void;
  cartCount?: number;
}> = ({ tab, isActive, onPress, cartCount }) => {
  const haptic = useHaptic();
  const iconColor = isActive ? Colors.brandNavy : Colors.ink4;
  const badgeScale = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(cartCount);

  useEffect(() => {
    if (tab.route === 'Cart' && cartCount != null && cartCount > (prevCount.current ?? 0)) {
      Animated.sequence([
        Animated.spring(badgeScale, { toValue: Motion.badgePopScale, ...Motion.spring.snap }),
        Animated.spring(badgeScale, { toValue: 1,                    ...Motion.spring.settle }),
      ]).start();
    }
    prevCount.current = cartCount;
  }, [cartCount, badgeScale, tab.route]);

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
      <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
        <Icon name={isActive ? tab.activeIcon : tab.inactiveIcon} size={20} color={iconColor} />
        {tab.route === 'Cart' && cartCount != null && cartCount > 0 && (
          <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
            <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
          </Animated.View>
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

      {showPrompt && (
        <LoginPromptSheet
          context={promptContext}
          onClose={() => setShowPrompt(false)}
          onSignIn={() => { setShowPrompt(false); onNavigateToAuth?.('Login'); }}
          onRegister={() => { setShowPrompt(false); onNavigateToAuth?.('Register'); }}
        />
      )}
    </>
  );
};

// ── Tab Navigator adapter ─────────────────────────────────────────────────────
// Used as the `tabBar` prop on the BottomTabNavigator in AppNavigator.
// Reads activeTab from navigator state and cart count from context — screens
// no longer need to pass these as props.

interface TabBarAdapterProps {
  state: { index: number; routes: { name: string }[] };
  navigation: {
    navigate: (name: string) => void;
    getParent: () => { navigate: (name: string) => void } | undefined;
  };
}

export const TabBar: React.FC<TabBarAdapterProps> = ({ state, navigation }) => {
  const { cartCount } = useCart();
  const activeTab = state.routes[state.index].name as NavTab;

  return (
    <BottomNavBar
      activeTab={activeTab}
      onNavigate={(route) => navigation.navigate(route)}
      onNavigateToAuth={(screen) => navigation.getParent()?.navigate(screen)}
      cartCount={cartCount > 0 ? cartCount : undefined}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    backgroundColor:   Colors.surface,
    paddingHorizontal: Space[1],
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
  },
  tab: {
    flex:          1,
    alignItems:    'center',
    paddingTop:    10,
    paddingBottom: Space[2],
    gap:           3,
  },
  iconWrap: {
    position:       'relative',
    alignItems:     'center',
    justifyContent: 'center',
    width:          40,
    height:         26,
    borderRadius:   13,
  },
  iconWrapActive: {
    backgroundColor: Colors.brandNavyTint,
  },
  badge: {
    position:          'absolute',
    top:               -3,
    right:             2,
    backgroundColor:   Colors.brandNavy,
    borderRadius:      Radius.pill,
    minWidth:          15,
    height:            15,
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: 3,
    borderWidth:       1.5,
    borderColor:       Colors.surface,
  },
  badgeText: {
    color:      '#FFFFFF',
    fontSize:   8.5,
    fontWeight: '700',
    lineHeight: 11,
  },
  label: {
    ...Type.label,
    fontSize:      11,
    color:         Colors.ink4,
    letterSpacing: 0.8,
  },
  labelActive: {
    color: Colors.brandNavy,
  },
});
