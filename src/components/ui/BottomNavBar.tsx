import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, FontSize, FontWeight, Radius, Shadow } from '../../theme';
import { useHaptic } from '../../hooks/useHaptic';

export type NavTab = 'Home' | 'Orders' | 'Wishlist' | 'Cart' | 'Profile';

interface BottomNavBarProps {
  activeTab: NavTab;
  onNavigate: (route: NavTab) => void;
  cartCount?: number;
}

interface TabDef {
  route: NavTab;
  label: string;
  activeIcon: string;
  inactiveIcon: string;
}

const TABS: TabDef[] = [
  { route: 'Home',     label: 'Home',    activeIcon: 'home',            inactiveIcon: 'home-outline' },
  { route: 'Orders',   label: 'Orders',  activeIcon: 'receipt-outline', inactiveIcon: 'receipt-outline' },
  { route: 'Wishlist', label: 'Wishlist',activeIcon: 'heart',           inactiveIcon: 'heart-outline' },
  { route: 'Cart',     label: 'Cart',    activeIcon: 'bag',             inactiveIcon: 'bag-outline' },
  { route: 'Profile',  label: 'Profile', activeIcon: 'person',          inactiveIcon: 'person-outline' },
];

function useTabScale(isActive: boolean) {
  const scale = useRef(new Animated.Value(isActive ? 1.0 : 0.86)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: isActive ? 1.0 : 0.86,
      useNativeDriver: true,
      speed: 32,
      bounciness: 4,
    }).start();
  }, [isActive, scale]);
  return scale;
}

const NavItem: React.FC<{
  tab: TabDef;
  isActive: boolean;
  onPress: () => void;
  cartCount?: number;
}> = ({ tab, isActive, onPress, cartCount }) => {
  const scale = useTabScale(isActive);
  const haptic = useHaptic();
  const iconName  = isActive ? tab.activeIcon : tab.inactiveIcon;
  const iconColor = isActive ? Colors.ink1 : Colors.ink4;

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
      <View style={styles.iconArea}>
        {/* Top-edge indicator — visible only on active tab */}
        {isActive && <View style={styles.indicator} />}

        <Animated.View style={{ transform: [{ scale }] }}>
          <View style={styles.iconWrap}>
            <Icon name={iconName} size={22} color={iconColor} />
            {tab.route === 'Cart' && cartCount != null && cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Label — color-only state, no weight change to prevent layout shift */}
      <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
};

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onNavigate,
  cartCount,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, Space[2]) }]}>
      {TABS.map((tab) => (
        <NavItem
          key={tab.route}
          tab={tab}
          isActive={tab.route === activeTab}
          onPress={() => { if (tab.route !== activeTab) onNavigate(tab.route); }}
          cartCount={cartCount}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // Slightly warm white — less clinical than pure #FFF
    backgroundColor: 'rgba(252,252,250,0.97)',
    paddingTop: 0,
    paddingHorizontal: Space[1],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.rule,
    ...Shadow.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: Space[1],
  },
  iconArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Space[2],
    paddingBottom: 3,
    position: 'relative',
  },
  // 2px top-edge line in tab width — the active indicator
  indicator: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.ink1,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -8,
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(252,252,250,0.97)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    lineHeight: 11,
  },
  // Fixed weight — only color changes to prevent text width shift
  label: {
    fontSize: FontSize.xs,
    color: Colors.ink4,
    fontWeight: FontWeight.medium,
  },
  labelActive: {
    color: Colors.ink2,
  },
});
