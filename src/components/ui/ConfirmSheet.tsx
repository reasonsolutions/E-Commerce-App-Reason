import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { Shadow } from '../../theme/tokens';
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
      snapPoints={['32%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.inner}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <View style={styles.actions}>
          <ConfirmButton
            label={confirmLabel}
            onPress={onConfirm}
            destructive={destructive}
          />
          <TouchableOpacity onPress={onClose} style={styles.cancelWrap} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
            <View style={styles.cancelUnderline} />
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius:  Radius.lg,
    borderTopRightRadius: Radius.lg,
    ...Shadow.md,
  },
  handleIndicator: {
    backgroundColor: Colors.rule,
    width:  40,
    height: 4,
  },
  inner: {
    flex:              1,
    paddingHorizontal: Space[6],
    paddingTop:        Space[3],
    paddingBottom:     Space[8],
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
    backgroundColor: Colors.danger,
  },
  btnText: {
    ...Type.bodyStrong,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
  },
  btnTextDestructive: {
    color: '#FFFFFF',
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
