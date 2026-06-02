import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { useHaptic } from '../../hooks/useHaptic';
import type { OrderHistoryFilters } from '../../api/order';

export type OrderSortKey = 'desc' | 'asc';

interface OrderFilterSheetProps {
  visible:    boolean;
  onClose:    () => void;
  onApply:    (filters: OrderHistoryFilters) => void;
  onClearAll: () => void;
  current:    OrderHistoryFilters;
}

const SORT_OPTIONS: { key: OrderSortKey; label: string }[] = [
  { key: 'desc', label: 'Newest first' },
  { key: 'asc',  label: 'Oldest first' },
];

const Chip: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({
  label, selected, onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[styles.chip, selected && styles.chipSelected]}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

// yyyy-MM-dd validation
const isValidDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export const OrderFilterSheet: React.FC<OrderFilterSheetProps> = ({
  visible,
  onClose,
  onApply,
  onClearAll,
  current,
}) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const [sortBy,   setSortBy]   = useState<OrderSortKey>(current.sortBy ?? 'desc');
  const [dateFrom, setDateFrom] = useState(current.dateFrom ?? '');
  const [dateTo,   setDateTo]   = useState(current.dateTo ?? '');
  const [dateError, setDateError] = useState('');

  // Sync draft when sheet opens with current filters
  useEffect(() => {
    if (visible) {
      setSortBy(current.sortBy ?? 'desc');
      setDateFrom(current.dateFrom ?? '');
      setDateTo(current.dateTo ?? '');
      setDateError('');
    }
  }, [visible, current]);

  const validate = (): boolean => {
    if (dateFrom && !isValidDate(dateFrom)) {
      setDateError('Date From must be yyyy-MM-dd');
      return false;
    }
    if (dateTo && !isValidDate(dateTo)) {
      setDateError('Date To must be yyyy-MM-dd');
      return false;
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setDateError('Date From cannot be after Date To');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleApply = () => {
    if (!validate()) return;
    haptic.success();
    onApply({
      sortBy,
      dateFrom: dateFrom || null,
      dateTo:   dateTo   || null,
    });
  };

  const handleClear = () => {
    haptic.light();
    setSortBy('desc');
    setDateFrom('');
    setDateTo('');
    setDateError('');
    onClearAll();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOuter}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Space[4] }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Filter & Sort</Text>
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
              <Text style={styles.clearBtn}>Clear all</Text>
            </TouchableOpacity>
          </View>

          {/* Sort */}
          <Text style={styles.sectionLabel}>SORT</Text>
          <View style={styles.chipRow}>
            {SORT_OPTIONS.map(opt => (
              <Chip
                key={opt.key}
                label={opt.label}
                selected={sortBy === opt.key}
                onPress={() => { haptic.light(); setSortBy(opt.key); }}
              />
            ))}
          </View>

          <View style={styles.divider} />

          {/* Date range */}
          <Text style={styles.sectionLabel}>DATE RANGE</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>FROM</Text>
              <TextInput
                style={styles.dateInput}
                value={dateFrom}
                onChangeText={v => { setDateFrom(v); setDateError(''); }}
                placeholder="yyyy-MM-dd"
                placeholderTextColor={Colors.ink5}
                keyboardType="numeric"
                maxLength={10}
                returnKeyType="next"
              />
            </View>
            <View style={styles.dateSep} />
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>TO</Text>
              <TextInput
                style={styles.dateInput}
                value={dateTo}
                onChangeText={v => { setDateTo(v); setDateError(''); }}
                placeholder="yyyy-MM-dd"
                placeholderTextColor={Colors.ink5}
                keyboardType="numeric"
                maxLength={10}
                returnKeyType="done"
              />
            </View>
          </View>
          {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}

          {/* Apply */}
          <View style={styles.applyWrap}>
            <TouchableOpacity
              onPress={handleApply}
              activeOpacity={0.85}
              style={styles.applyBtn}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor:      Colors.surface,
    borderTopLeftRadius:  18,
    borderTopRightRadius: 18,
    paddingHorizontal:    Space.screenH,
    paddingTop:           Space[2],
  },
  handle: {
    backgroundColor: Colors.rule,
    width:           40,
    height:          4,
    borderRadius:    2,
    alignSelf:       'center',
    marginBottom:    Space[4],
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Space[5],
  },
  title: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  clearBtn: {
    ...Type.caption,
    color:              Colors.ink3,
    textDecorationLine: 'underline',
  },
  sectionLabel: {
    ...Type.label,
    color:        Colors.ink4,
    marginBottom: Space[3],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    marginBottom:  Space[2],
  },
  chip: {
    paddingVertical:   Space[1] + 2,
    paddingHorizontal: Space[3],
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       Colors.rule,
    backgroundColor:   Colors.surface,
    marginBottom:      Space[2],
    marginRight:       Space[2],
  },
  chipSelected: {
    backgroundColor: Colors.ink1,
    borderColor:     Colors.ink1,
  },
  chipText: {
    ...Type.caption,
    color: Colors.ink2,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical:  Space[5],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    marginBottom:  Space[2],
  },
  dateField: {
    flex: 1,
  },
  dateSep: {
    width: Space[3],
  },
  dateLabel: {
    ...Type.label,
    color:        Colors.ink4,
    marginBottom: Space[1],
  },
  dateInput: {
    fontFamily:      FontFamily.mono,
    fontSize:        13,
    color:           Colors.ink1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
    paddingVertical: Space[2],
    letterSpacing:   0.3,
  },
  errorText: {
    ...Type.caption,
    color:       Colors.danger,
    marginTop:   Space[1],
    marginBottom: Space[2],
  },
  applyWrap: {
    marginTop:      Space[5],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.rule,
    paddingTop:     Space[3],
  },
  applyBtn: {
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    paddingVertical: Space[4],
    alignItems:      'center',
  },
  applyBtnText: {
    fontFamily:    FontFamily.sans,
    fontSize:      16,
    fontWeight:    '500',
    color:         '#FFFFFF',
    letterSpacing: 0.2,
  },
});
