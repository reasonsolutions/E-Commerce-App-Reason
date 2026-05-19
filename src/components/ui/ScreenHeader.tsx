import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme/tokens';
import { Type } from '../../theme/typography';

type Variant = 'plain' | 'transparent';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  variant?: Variant;
}

const HEADER_HEIGHT = 52;

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  back = true,
  onBack,
  right,
  variant = 'plain',
}) => {
  const insets = useSafeAreaInsets();
  const transparent = variant === 'transparent';

  const topPad = Platform.OS === 'ios' ? insets.top : Math.max(insets.top, Space[3]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPad },
        transparent ? styles.containerTransparent : styles.containerPlain,
      ]}
    >
      <View style={styles.inner}>
        {back && (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.iconBtn, transparent && styles.iconBtnTransparent]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <Icon
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
              size={22}
              color={Colors.ink1}
            />
          </TouchableOpacity>
        )}

        <View style={styles.titleBlock}>
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {right ? <View style={styles.rightSlot}>{right}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0,
  },
  containerPlain: {
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  containerTransparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  inner: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.screenH,
    gap: Space[2],
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconBtnTransparent: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...Type.heading,
    letterSpacing: -0.2,
  },
  subtitle: {
    ...Type.caption,
    marginTop: 2,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[1],
  },
});

export const SCREEN_HEADER_HEIGHT = HEADER_HEIGHT;
