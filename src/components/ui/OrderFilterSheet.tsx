import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { useHaptic } from '../../hooks/useHaptic';
import type { OrderHistoryFilters } from '../../api/order';

export type OrderSortKey = 'desc' | 'asc' | '30d' | '6m' | '12m';
export type OrderStatusKey = 'all' | 'delivered' | 'cancelled' | 'returned';

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function sortKeyToDates(key: OrderSortKey): { sortBy: 'asc' | 'desc'; dateFrom: string | null; dateTo: string | null } {
  const now   = new Date();
  const today = toISODate(now);

  if (key === 'asc') return { sortBy: 'asc', dateFrom: null, dateTo: null };
  if (key === '30d') {
    const d = new Date(now); d.setDate(now.getDate() - 30);
    return { sortBy: 'desc', dateFrom: toISODate(d), dateTo: today };
  }
  if (key === '6m') {
    const d = new Date(now); d.setMonth(now.getMonth() - 6);
    return { sortBy: 'desc', dateFrom: toISODate(d), dateTo: today };
  }
  if (key === '12m') {
    const d = new Date(now); d.setFullYear(now.getFullYear() - 1);
    return { sortBy: 'desc', dateFrom: toISODate(d), dateTo: today };
  }
  return { sortBy: 'desc', dateFrom: null, dateTo: null };
}

function filtersToSortKey(filters: OrderHistoryFilters): OrderSortKey {
  if (filters.sortBy === 'asc') return 'asc';
  if (!filters.dateFrom) return 'desc';
  const now   = new Date();
  const today = toISODate(now);
  const d30   = new Date(now); d30.setDate(now.getDate() - 30);
  const d6m   = new Date(now); d6m.setMonth(now.getMonth() - 6);
  const d12m  = new Date(now); d12m.setFullYear(now.getFullYear() - 1);
  if (filters.dateFrom === toISODate(d30)  && filters.dateTo === today) return '30d';
  if (filters.dateFrom === toISODate(d6m)  && filters.dateTo === today) return '6m';
  if (filters.dateFrom === toISODate(d12m) && filters.dateTo === today) return '12m';
  return 'desc';
}

const SORT_OPTIONS: { key: OrderSortKey; label: string }[] = [
  { key: 'desc', label: 'Recent' },
  { key: '30d',  label: 'Last 30 Days' },
  { key: '6m',   label: 'Last 6 Months' },
  { key: '12m',  label: 'Last 12 Months' },
];

const STATUS_OPTIONS: { key: OrderStatusKey; label: string }[] = [
  { key: 'all',       label: 'All Orders' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'returned',  label: 'Returned' },
];

// ── Radio row ─────────────────────────────────────────────────────────────────
const RadioRow: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
}> = ({ label, selected, onPress, isLast }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.65}
    style={[
      radioStyles.row,
      !isLast && !selected && radioStyles.border,
      selected && radioStyles.rowSelected,
    ]}
  >
    <Text style={[radioStyles.label, selected && radioStyles.labelSelected]}>
      {label}
    </Text>
    <View style={[radioStyles.outer, selected && radioStyles.outerSelected]}>
      {selected && <View style={radioStyles.inner} />}
    </View>
  </TouchableOpacity>
);

const radioStyles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingVertical:   Space[4],
    paddingHorizontal: Space[3],
    borderRadius:      8,
    marginHorizontal:  -Space[3],
  },
  rowSelected: {
    backgroundColor: '#EEE7DA',
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize:   15,
    fontWeight: '400',
    color:      Colors.ink2,
  },
  labelSelected: {
    fontWeight: '600',
    color:      Colors.ink1,
  },
  outer: {
    width:           20,
    height:          20,
    borderRadius:    10,
    borderWidth:     1.5,
    borderColor:     Colors.ink4,
    alignItems:      'center',
    justifyContent:  'center',
  },
  outerSelected: {
    borderColor: Colors.brandNavy,
  },
  inner: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: Colors.brandNavy,
  },
});

// ── Sheet ─────────────────────────────────────────────────────────────────────
interface OrderFilterSheetProps {
  visible:    boolean;
  onClose:    () => void;
  onApply:    (filters: OrderHistoryFilters) => void;
  onClearAll: () => void;
  current:    OrderHistoryFilters;
}

export const OrderFilterSheet: React.FC<OrderFilterSheetProps> = ({
  visible,
  onClose,
  onApply,
  onClearAll,
  current,
}) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const [sortKey, setSortKey] = useState<OrderSortKey>(filtersToSortKey(current));
  const [status,  setStatus]  = useState<OrderStatusKey>(current.status ?? 'all');

  useEffect(() => {
    if (visible) {
      setSortKey(filtersToSortKey(current));
      setStatus(current.status ?? 'all');
    }
  }, [visible, current]);

  const handleApply = () => {
    haptic.success();
    const dates = sortKeyToDates(sortKey);
    onApply({ ...dates, status });
  };

  const handleClear = () => {
    haptic.light();
    setSortKey('desc');
    setStatus('all');
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

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sort & Filter</Text>
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearBtn}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Sort section */}
          <Text style={styles.sectionLabel}>SORT BY</Text>
          {SORT_OPTIONS.map((opt, i) => (
            <RadioRow
              key={opt.key}
              label={opt.label}
              selected={sortKey === opt.key}
              onPress={() => { haptic.light(); setSortKey(opt.key); }}
              isLast={i === SORT_OPTIONS.length - 1}
            />
          ))}

          <View style={styles.divider} />

          {/* Status section */}
          <Text style={styles.sectionLabel}>STATUS</Text>
          {STATUS_OPTIONS.map((opt, i) => (
            <RadioRow
              key={opt.key}
              label={opt.label}
              selected={status === opt.key}
              onPress={() => { haptic.light(); setStatus(opt.key); }}
              isLast={i === STATUS_OPTIONS.length - 1}
            />
          ))}

          {/* Apply CTA */}
          <View style={styles.applyWrap}>
            <TouchableOpacity
              onPress={handleApply}
              activeOpacity={0.85}
              style={styles.applyBtn}
              accessibilityRole="button"
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
    backgroundColor: 'rgba(0,0,0,0.30)',
  },

  // Sheet sits at ~75% screen height via content sizing (no fixed maxHeight needed
  // — 4 sort + 4 status rows + header + CTA naturally lands around 70-75%)
  sheet: {
    backgroundColor:      Colors.surface,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingHorizontal:    Space.screenH,
    paddingTop:           Space[2],
  },
  handle: {
    backgroundColor: Colors.rule,
    width:           36,
    height:          4,
    borderRadius:    2,
    alignSelf:       'center',
    marginBottom:    Space[4],
  },

  // Header
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Space[5],
  },
  headerTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      21,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.2,
  },
  clearBtn: {
    ...Type.caption,
    color:              Colors.ink1,
    textDecorationLine: 'underline',
  },

  // Section label — sans uppercase matching profile screen
  sectionLabel: {
    ...Type.label,
    fontSize:      9,
    letterSpacing: 1.4,
    color:         Colors.ink4,
    marginBottom:  Space[1],
  },

  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical:  Space[4],
  },

  // Apply CTA
  applyWrap: {
    marginTop:      Space[5],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.rule,
    paddingTop:     Space[4],
  },
  applyBtn: {
    height:          52,
    backgroundColor: Colors.brandNavy,
    borderRadius:    Radius.pill,
    alignItems:      'center',
    justifyContent:  'center',
  },
  applyBtnText: {
    ...Type.bodyStrong,
    color:         '#FFFFFF',
    letterSpacing: 0.2,
  },
});
