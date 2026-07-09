import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { PrimaryButton } from './PrimaryButton';
import { CustomerCancellationReason, CancellationReasonLabel } from '../../config/enum_files/CustomerCancellationReason';
import { RefundMode, RefundModeLabel } from '../../config/enum_files/RefundMode';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.75;

interface CancelOrderSheetProps {
  itemName?: string;
  selectedReason: CustomerCancellationReason | null;
  selectedRefundMode: RefundMode | null;
  cancelError: string | null;
  cancelLoading: boolean;
  onSelectReason: (reason: CustomerCancellationReason) => void;
  onSelectRefundMode: (mode: RefundMode) => void;
  onConfirm: () => void;
  onClose: () => void;
}

// Plain Modal + ScrollView, matching OrderFilterSheet — not @gorhom/bottom-sheet.
// Two things were tried and rejected first:
//   1. BottomSheetScrollView (bottom-sheet's own scroll integration) crashed
//      with "[Reanimated] Cannot find host instance for this component".
//   2. A plain ScrollView nested inside BottomSheetView didn't crash, but
//      fought the sheet's own pan/dismiss gesture handler — scrolling needed
//      heavy pressure and felt broken.
// Dropping @gorhom/bottom-sheet entirely removes the competing gesture
// handler, so a plain ScrollView scrolls normally with one finger. Trade-off:
// no native drag-to-dismiss handle feel, same as OrderFilterSheet already
// accepts elsewhere in the app.
export const CancelOrderSheet: React.FC<CancelOrderSheetProps> = ({
  itemName,
  selectedReason,
  selectedRefundMode,
  cancelError,
  cancelLoading,
  onSelectReason,
  onSelectRefundMode,
  onConfirm,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOuter}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { height: SHEET_H }]}>
          <View style={styles.handle} />

          <ScrollView
            contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + Space[8] }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sheetTitle}>Cancel Item</Text>
            {itemName ? (
              <Text style={styles.sheetSubtitle}>{itemName}</Text>
            ) : null}

            <Text style={styles.sheetSectionLabel}>REASON FOR CANCELLATION</Text>
            {(Object.values(CustomerCancellationReason).filter(v => typeof v === 'number') as CustomerCancellationReason[]).map(reason => (
              <TouchableOpacity
                key={reason}
                onPress={() => onSelectReason(reason)}
                style={styles.optionRow}
                activeOpacity={0.7}
              >
                <View style={[styles.optionRadio, selectedReason === reason && styles.optionRadioSelected]} />
                <Text style={[styles.optionLabel, selectedReason === reason && styles.optionLabelSelected]}>
                  {CancellationReasonLabel[reason]}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.sheetSectionLabel, { marginTop: Space[5] }]}>REFUND METHOD</Text>
            {(Object.values(RefundMode).filter(v => typeof v === 'number') as RefundMode[]).map(mode => (
              <TouchableOpacity
                key={mode}
                onPress={() => onSelectRefundMode(mode)}
                style={styles.optionRow}
                activeOpacity={0.7}
              >
                <View style={[styles.optionRadio, selectedRefundMode === mode && styles.optionRadioSelected]} />
                <Text style={[styles.optionLabel, selectedRefundMode === mode && styles.optionLabelSelected]}>
                  {RefundModeLabel[mode]}
                </Text>
              </TouchableOpacity>
            ))}

            {cancelError ? <Text style={styles.sheetError}>{cancelError}</Text> : null}

            <View style={styles.ctaWrap}>
              <PrimaryButton
                label="Confirm Cancellation"
                onPress={onConfirm}
                loading={cancelLoading}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOuter: {
    flex:           1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  sheet: {
    backgroundColor:      Colors.surface,
    borderTopLeftRadius:  Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  handle: {
    backgroundColor: Colors.rule,
    width:           36,
    height:          4,
    borderRadius:    2,
    alignSelf:       'center',
    marginTop:       Space[2],
    marginBottom:    Space[2],
  },
  sheetContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[2],
  },
  sheetTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    ...Type.caption,
    color:        Colors.ink3,
    marginTop:    Space[1],
    marginBottom: Space[5],
  },
  sheetSectionLabel: {
    ...Type.label,
    color:        Colors.ink4,
    marginBottom: Space[3],
  },
  optionRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[3],
    paddingVertical:   Space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  optionRadio: {
    width:        16,
    height:       16,
    borderRadius: 8,
    borderWidth:  1.5,
    borderColor:  Colors.ink4,
    flexShrink:   0,
  },
  optionRadioSelected: {
    borderColor:     Colors.ink1,
    backgroundColor: Colors.ink1,
  },
  optionLabel: {
    ...Type.body,
    color: Colors.ink3,
    flex:  1,
  },
  optionLabelSelected: { color: Colors.ink1 },
  sheetError: {
    ...Type.caption,
    color:     Colors.danger,
    marginTop: Space[4],
    textAlign: 'center',
  },
  ctaWrap: {
    marginTop:      Space[5],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.rule,
    paddingTop:     Space[4],
  },
});
