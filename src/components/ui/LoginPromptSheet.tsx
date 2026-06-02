import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
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

const CONTEXT_MAP: Record<LoginPromptContext, { icon: string; title: string; body: string }> = {
  orders: {
    icon:  'receipt-outline',
    title: 'View your orders',
    body:  'Sign in to track deliveries, view order history, and manage returns.',
  },
  wishlist: {
    icon:  'heart-outline',
    title: 'Save to your wishlist',
    body:  'Sign in to save items you love and come back to them anytime.',
  },
  profile: {
    icon:  'person-outline',
    title: 'Your account',
    body:  'Sign in to manage your profile, addresses, and preferences.',
  },
  checkout: {
    icon:  'bag-outline',
    title: 'Almost there',
    body:  'Sign in to complete your purchase and save your address.',
  },
  general: {
    icon:  'log-in-outline',
    title: 'Sign in to continue',
    body:  'Save items, track orders, and check out faster.',
  },
};

export const LoginPromptSheet: React.FC<LoginPromptSheetProps> = ({
  onClose,
  onSignIn,
  onRegister,
  context = 'general',
}) => {
  const { icon, title, body } = CONTEXT_MAP[context];
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
    <BottomSheet
      index={0}
      snapPoints={['44%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.inner}>

        {/* Icon + heading */}
        <View style={styles.headingBlock}>
          <View style={styles.iconWrap}>
            <Icon name={icon} size={22} color={Colors.ink2} />
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
            <Text style={styles.registerText}>Create an account</Text>
          </TouchableOpacity>

          <Text style={styles.footerDivider}>·</Text>

          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.dismissText}>Continue browsing</Text>
          </TouchableOpacity>
        </View>

      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
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
    gap:               Space[5],
  },

  // Icon + heading
  headingBlock: {
    gap: Space[3],
  },
  iconWrap: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: Colors.surfaceDeep,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Space[1],
  },
  title: {
    fontFamily:    FontFamily.serif,
    fontSize:      26,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.5,
    lineHeight:    26 * 1.1,
  },
  body: {
    ...Type.caption,
    color:      Colors.ink3,
    lineHeight: 13 * 1.6,
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
    color: Colors.ink2,
  },
  footerDivider: {
    ...Type.caption,
    color: Colors.ink4,
  },
  dismissText: {
    ...Type.caption,
    color: Colors.ink3,
  },
});
