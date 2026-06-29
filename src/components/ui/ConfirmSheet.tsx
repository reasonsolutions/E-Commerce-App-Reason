import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { useTactile } from '../../hooks/useTactile';

interface ConfirmSheetProps {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
}

const ConfirmButton: React.FC<{
  label: string;
  onPress: () => void;
  destructive?: boolean;
}> = ({ label, onPress, destructive }) => {
  const { animatedStyle, handlers } = useTactile();
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        {...handlers}
        activeOpacity={1}
        onPress={onPress}
        style={[styles.btn, destructive ? styles.btnDestructive : styles.btnPrimary]}
      >
        <Text style={[styles.btnText, destructive ? styles.btnTextDestructive : styles.btnTextPrimary]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ConfirmSheet: React.FC<ConfirmSheetProps> = ({
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
}) => {
  const insets   = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue:         0,
      duration:        320,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + Space[6], transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />
        <View style={styles.inner}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <View style={styles.actions}>
            <ConfirmButton
              label={confirmLabel}
              onPress={onConfirm}
              destructive={destructive}
            />
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelWrap}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
              <View style={styles.cancelUnderline} />
            </TouchableOpacity>
          </View>
        </View>
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
    position:             'absolute',
    bottom:               0,
    left:                 0,
    right:                0,
    backgroundColor:      Colors.surface,
    borderTopLeftRadius:  Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: Colors.rule,
    alignSelf:       'center',
    marginTop:       Space[2],
    marginBottom:    Space[1],
  },
  inner: {
    paddingHorizontal: Space[6],
    paddingTop:        Space[3],
    gap:               Space[3],
  },
  title: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  body: {
    ...Type.caption,
    color:      Colors.ink3,
    lineHeight: 13 * 1.55,
  },
  actions: {
    marginTop: Space[2],
    gap:       Space[4],
  },
  btn: {
    alignSelf:       'stretch',
    paddingVertical: Space[4],
    borderRadius:    Radius.pill,
    alignItems:      'center',
  },
  btnPrimary: {
    backgroundColor: Colors.ink1,
  },
  btnDestructive: {
    backgroundColor: Colors.ink1,
  },
  btnText: {
    ...Type.bodyStrong,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
  },
  btnTextDestructive: {
    color: Colors.dangerTint,
  },
  cancelWrap: {
    alignSelf: 'center',
  },
  cancelText: {
    ...Type.caption,
    color:     Colors.ink3,
    textAlign: 'center',
  },
  cancelUnderline: {
    height:          1,
    backgroundColor: Colors.ink4,
    marginTop:       3,
    width:           '100%',
  },
});
