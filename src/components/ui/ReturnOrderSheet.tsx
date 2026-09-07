import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { PrimaryButton } from './PrimaryButton';
import { RefundMode, RefundModeLabel } from '../../config/enum_files/RefundMode';
import { getReturnReasons } from '../../api/order';
import type { ReturnReasonInterface } from '../../api/interfaces';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.75;

interface ReturnOrderSheetProps {
  itemName?: string;
  selectedReason: number | null;
  selectedRefundMode: RefundMode | null;
  showRefundMode?: boolean;
  remarks: string;
  returnError: string | null;
  returnLoading: boolean;
  onSelectReason: (reason: number, description: string) => void;
  onSelectRefundMode: (mode: RefundMode) => void;
  onChangeRemarks: (remarks: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

// Mirrors CancelOrderSheet: plain Modal + ScrollView, not @gorhom/bottom-sheet —
// same gesture-handler conflict applies here.
export const ReturnOrderSheet: React.FC<ReturnOrderSheetProps> = ({
  itemName,
  selectedReason,
  selectedRefundMode,
  showRefundMode = true,
  remarks,
  returnError,
  returnLoading,
  onSelectReason,
  onSelectRefundMode,
  onChangeRemarks,
  onConfirm,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const maxSheetHeight = Math.min(SHEET_H, SCREEN_H - insets.top - Space[4]);
  const [step, setStep] = useState<'details' | 'remarks'>('details');
  const [reasons, setReasons] = useState<ReturnReasonInterface[]>([]);
  const [reasonsLoading, setReasonsLoading] = useState(true);
  const [reasonsError, setReasonsError] = useState<string | null>(null);
  const canProceed =
    selectedReason !== null && (!showRefundMode || selectedRefundMode !== null);

  useEffect(() => {
    let cancelled = false;
    setReasonsLoading(true);
    setReasonsError(null);
    getReturnReasons()
      .then(res => {
        if (cancelled) return;
        if (res?.statusCode !== 1) {
          setReasonsError(res?.userMessage ?? 'Could not load return reasons.');
          return;
        }
        setReasons(res.result ?? []);
      })
      .catch(() => {
        if (!cancelled) setReasonsError('Could not load return reasons.');
      })
      .finally(() => {
        if (!cancelled) setReasonsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOuter}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => { Keyboard.dismiss(); onClose(); }}
        />

        <View style={[styles.sheet, { maxHeight: maxSheetHeight }]}>
          <View style={styles.handle} />

          <View style={styles.sheetHeaderRow}>
            {step === 'remarks' ? (
              <TouchableOpacity
                onPress={() => setStep('details')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Back"
                style={styles.sheetBackBtn}
              >
                <Icon name="arrow-back" size={20} color={Colors.ink3} />
              </TouchableOpacity>
            ) : null}
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>Return Item</Text>
              {itemName ? (
                <Text style={styles.sheetSubtitle}>{itemName}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Icon name="close" size={22} color={Colors.ink3} />
            </TouchableOpacity>
          </View>

          {step === 'details' ? (
            <>
              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.sheetSectionLabel}>REASON FOR RETURN</Text>
                {reasonsLoading ? (
                  <ActivityIndicator color={Colors.brandNavy} style={styles.reasonsLoading} />
                ) : reasonsError ? (
                  <Text style={styles.sheetError}>{reasonsError}</Text>
                ) : (
                  reasons.map(reason => (
                    <TouchableOpacity
                      key={reason.value}
                      onPress={() => onSelectReason(reason.value, reason.description)}
                      style={styles.optionRow}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.optionRadio, selectedReason === reason.value && styles.optionRadioSelected]} />
                      <Text style={[styles.optionLabel, selectedReason === reason.value && styles.optionLabelSelected]}>
                        {reason.description}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}

                {showRefundMode ? (
                  <>
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
                  </>
                ) : null}
              </ScrollView>

              <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + Space[4] }]}>
                <PrimaryButton
                  label="Next"
                  onPress={() => setStep('remarks')}
                  isDisabled={!canProceed}
                />
              </View>
            </>
          ) : (
            <>
              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
              >
                <Text style={styles.sheetSectionLabel}>ADDITIONAL DETAILS (OPTIONAL)</Text>
                <TextInput
                  style={styles.remarksInput}
                  value={remarks}
                  onChangeText={onChangeRemarks}
                  placeholder="Please add remarks"
                  placeholderTextColor={Colors.ink4}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {returnError ? <Text style={styles.sheetError}>{returnError}</Text> : null}
              </ScrollView>

              <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + Space[4] }]}>
                <PrimaryButton
                  label="Confirm Return"
                  onPress={onConfirm}
                  loading={returnLoading}
                />
              </View>
            </>
          )}
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
    maxHeight:            SHEET_H,
    flexShrink:           1,
    overflow:             'hidden',
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
  sheetScroll: {
    flexGrow:   0,
    flexShrink: 1,
  },
  sheetContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[2],
    paddingBottom:     Space[4],
  },
  sheetHeaderRow: {
    flexDirection:      'row',
    alignItems:         'flex-start',
    justifyContent:     'space-between',
    gap:                Space[3],
    paddingHorizontal:  Space.screenH,
    paddingBottom:      Space[3],
    borderBottomWidth:  StyleSheet.hairlineWidth,
    borderBottomColor:  Colors.rule,
  },
  sheetBackBtn: {
    marginTop: 2,
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    ...Type.caption,
    color:     Colors.ink3,
    marginTop: Space[1],
  },
  sheetSectionLabel: {
    ...Type.label,
    color:        Colors.ink4,
    marginBottom: Space[3],
  },
  reasonsLoading: {
    marginVertical: Space[4],
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
    borderColor:     Colors.brandNavy,
    backgroundColor: Colors.brandNavy,
  },
  optionLabel: {
    ...Type.body,
    color: Colors.ink3,
    flex:  1,
  },
  optionLabelSelected: { color: Colors.ink1 },
  remarksInput: {
    ...Type.body,
    color:             Colors.ink1,
    borderWidth:       StyleSheet.hairlineWidth,
    borderColor:       Colors.rule,
    borderRadius:      Radius.sm,
    paddingHorizontal: Space[3],
    paddingVertical:   Space[3],
    minHeight:         72,
  },
  sheetError: {
    ...Type.caption,
    color:     Colors.danger,
    marginTop: Space[4],
    textAlign: 'center',
  },
  ctaWrap: {
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
    paddingTop:        Space[4],
    paddingHorizontal: Space.screenH,
  },
});
