import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius, Motion } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { Shadow } from '../../theme/tokens';
import { useTactile } from '../../hooks/useTactile';

export type LoginPromptContext = 'orders' | 'wishlist' | 'profile' | 'checkout' | 'general';

interface LoginPromptSheetProps {
  onClose: () => void;
  onSignIn: () => void;
  onRegister: () => void;
  context?: LoginPromptContext;
}

const CONTEXT_MAP: Record<LoginPromptContext, { icon: string; title: string; body: string; benefits: string[] }> = {
  orders: {
    icon:     'receipt-outline',
    title:    'Orders',
    body:     'Track deliveries, view history, and manage returns.',
    benefits: ['Live tracking', 'Easy returns', 'Order history'],
  },
  wishlist: {
    icon:     'heart-outline',
    title:    'Wishlist',
    body:     'Save products you love and access them across devices.',
    benefits: ['Saved across devices', 'Price drop alerts', 'Faster checkout'],
  },
  profile: {
    icon:     'person-outline',
    title:    'Your account',
    body:     'Manage your profile, addresses, and preferences.',
    benefits: ['Track orders', 'Save wishlist', 'Manage addresses'],
  },
  checkout: {
    icon:     'bag-outline',
    title:    'Almost there',
    body:     'Sign in to complete your purchase and save your address.',
    benefits: ['Saved addresses', 'Order tracking', 'Easy returns'],
  },
  general: {
    icon:     'log-in-outline',
    title:    'Sign in to continue',
    body:     'Save items, track orders, and check out faster.',
    benefits: ['Track orders', 'Save wishlist', 'Faster checkout'],
  },
};

export const LoginPromptSheet: React.FC<LoginPromptSheetProps> = ({
  onClose,
  onSignIn,
  onRegister,
  context = 'general',
}) => {
  const { icon, title, body, benefits } = CONTEXT_MAP[context];
  const signInTactile = useTactile();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.modalWrap}>
        <BottomSheet
          index={0}
          snapPoints={['46%']}
          enablePanDownToClose
          onClose={onClose}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.handleIndicator}
          animationConfigs={{ damping: Motion.spring.settle.damping, stiffness: Motion.spring.settle.stiffness, mass: Motion.spring.settle.mass }}
        >
          <BottomSheetView style={styles.inner}>

            {/* Icon + heading */}
            <View style={styles.headingBlock}>
              <View style={styles.iconWrap}>
                <Icon name={icon} size={20} color={Colors.accent} />
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.body}>{body}</Text>
            </View>

            {/* Primary CTA */}
            <Animated.View style={signInTactile.animatedStyle}>
              <TouchableOpacity
                {...signInTactile.handlers}
                activeOpacity={1}
                onPress={onSignIn}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Sign In</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Secondary + dismiss row */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={onRegister}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.registerText}>Create Account →</Text>
              </TouchableOpacity>

              <Text style={styles.footerDivider}>·</Text>

              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.dismissText}>Continue browsing</Text>
              </TouchableOpacity>
            </View>

            {/* Benefit chips */}
            <View style={styles.benefitsRow}>
              {benefits.map(b => (
                <View key={b} style={styles.chip}>
                  <Icon name="checkmark" size={10} color={Colors.accent} />
                  <Text style={styles.chipText}>{b}</Text>
                </View>
              ))}
            </View>

          </BottomSheetView>
        </BottomSheet>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalWrap: {
    flex: 1,
  },
  sheetBackground: {
    backgroundColor:      Colors.surface,
    borderTopLeftRadius:  Radius.lg,
    borderTopRightRadius: Radius.lg,
    ...Shadow.md,
  },
  handleIndicator: {
    backgroundColor: Colors.rule,
    width:           36,
    height:          3,
  },
  inner: {
    flex:              1,
    paddingHorizontal: Space[6],
    paddingTop:        Space[2],
    paddingBottom:     Space[6],
    gap:               Space[4],
  },

  // Icon + heading
  headingBlock: {
    gap: Space[2],
  },
  iconWrap: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: 'rgba(178, 90, 61, 0.08)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Space[1],
  },
  title: {
    fontFamily:    FontFamily.serif,
    fontSize:      23,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.4,
    lineHeight:    23 * 1.1,
  },
  body: {
    ...Type.caption,
    color:      Colors.ink3,
    lineHeight: 13 * 1.55,
  },

  // Primary button
  primaryBtn: {
    width:           '100%',
    height:          52,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.ink1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  primaryBtnText: {
    ...Type.bodyStrong,
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Footer row — create account · continue browsing
  footer: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Space[3],
  },
  registerText: {
    ...Type.caption,
    color:      Colors.ink1,
    fontWeight: '500',
  },
  footerDivider: {
    ...Type.caption,
    color: Colors.ink4,
  },
  dismissText: {
    ...Type.caption,
    color: Colors.ink3,
  },

  // Benefit chips
  benefitsRow: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            Space[2],
    justifyContent: 'center',
    marginTop:      Space[1],
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
