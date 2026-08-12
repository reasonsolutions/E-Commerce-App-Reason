import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import type { ProductPolicyInfo } from '../../api/interfaces';

interface ReturnPolicySheetProps {
  policy: ProductPolicyInfo;
  onClose: () => void;
}

export const ReturnPolicySheet: React.FC<ReturnPolicySheetProps> = ({
  policy,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const policyLines = policy.ReturnPolicy
    ? policy.ReturnPolicy.split('\n').map(line => line.trim()).filter(Boolean)
    : [];

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom + Space[6],
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>
            {policy.ReturnWindow
              ? `${policy.ReturnWindow}-Day Return Policy`
              : 'Return Policy'}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="close" size={22} color={Colors.ink3} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {policyLines.length > 0 ? (
            policyLines.map((line, i) => (
              <Text
                key={i}
                style={[
                  styles.bodyText,
                  i < policyLines.length - 1 && styles.bodyTextSpacing,
                ]}
              >
                {line}
              </Text>
            ))
          ) : (
            <Text style={styles.bodyText}>
              This product is eligible for easy returns.
            </Text>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.rule,
    alignSelf: 'center',
    marginTop: Space[2],
    marginBottom: Space[1],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space[6],
    paddingTop: Space[3],
    paddingBottom: Space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  title: {
    fontFamily: FontFamily.serif,
    fontSize: 19,
    fontWeight: '400',
    color: Colors.ink1,
    letterSpacing: -0.2,
    flexShrink: 1,
    paddingRight: Space[3],
  },
  body: {
    paddingHorizontal: Space[6],
    paddingTop: Space[4],
  },
  bodyText: {
    ...Type.body,
    color: Colors.ink3,
    lineHeight: 15 * 1.6,
  },
  bodyTextSpacing: {
    marginBottom: Space[3],
  },
});