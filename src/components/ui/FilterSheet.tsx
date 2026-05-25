import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { useHaptic } from '../../hooks/useHaptic';
import { CategoryInterface } from '../../api/interfaces';

export type SortKey = 'default' | 'price_asc' | 'price_desc' | 'newest';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;

  // draft state
  draftSortKey: SortKey;
  setDraftSortKey: (key: SortKey) => void;
  draftCategories: number[];
  toggleDraftCategory: (id: number) => void;
  draftBrands: number[];
  toggleDraftBrand: (id: number) => void;
  draftPriceMin: string;
  setDraftPriceMin: (v: string) => void;
  draftPriceMax: string;
  setDraftPriceMax: (v: string) => void;
  draftDiscount: boolean;
  setDraftDiscount: (v: boolean) => void;
  onClearAll: () => void;

  // data for chips
  sheetCategories: CategoryInterface[];
  allBrandsFromSheet: { id: number; name: string }[];
  hideBrands?: boolean;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default',    label: 'Default' },
  { key: 'price_asc',  label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'newest',     label: 'Newest' },
];

const Chip: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({
  label,
  selected,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[styles.chip, selected && styles.chipSelected]}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

export const FilterSheet: React.FC<FilterSheetProps> = ({
  visible,
  onClose,
  onApply,
  draftSortKey,
  setDraftSortKey,
  draftCategories,
  toggleDraftCategory,
  draftBrands,
  toggleDraftBrand,
  draftPriceMin,
  setDraftPriceMin,
  draftPriceMax,
  setDraftPriceMax,
  draftDiscount,
  setDraftDiscount,
  onClearAll,
  sheetCategories,
  allBrandsFromSheet,
  hideBrands = false,
}) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

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
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheetBackground, { paddingBottom: insets.bottom + Space[4] }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={() => { haptic.light(); onClearAll(); }} activeOpacity={0.7}>
              <Text style={styles.sheetClearBtn}>Clear all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
          >
            {/* Sort */}
            <Text style={styles.sectionLabel}>SORT</Text>
            <View style={styles.chipRow}>
              {SORT_OPTIONS.map(opt => (
                <Chip
                  key={opt.key}
                  label={opt.label}
                  selected={draftSortKey === opt.key}
                  onPress={() => { haptic.light(); setDraftSortKey(opt.key); }}
                />
              ))}
            </View>

            {/* Categories */}
            {sheetCategories.length > 0 && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={styles.sectionLabel}>CATEGORIES</Text>
                <View style={styles.chipRow}>
                  {sheetCategories.map(cat => (
                    <Chip
                      key={cat.CategoryId}
                      label={cat.CategoryName}
                      selected={draftCategories.includes(cat.CategoryId)}
                      onPress={() => toggleDraftCategory(cat.CategoryId)}
                    />
                  ))}
                </View>
              </>
            )}

            {/* Brands */}
            {!hideBrands && allBrandsFromSheet.length > 0 && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={styles.sectionLabel}>BRANDS</Text>
                <View style={styles.chipRow}>
                  {allBrandsFromSheet.map(brand => (
                    <Chip
                      key={brand.id}
                      label={brand.name}
                      selected={draftBrands.includes(brand.id)}
                      onPress={() => toggleDraftBrand(brand.id)}
                    />
                  ))}
                </View>
              </>
            )}

            {/* Price range */}
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionLabel}>PRICE RANGE</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceInputWrap}>
                <Text style={styles.priceLabel}>Min</Text>
                <TextInput
                  style={styles.priceInput}
                  value={draftPriceMin}
                  onChangeText={setDraftPriceMin}
                  keyboardType="numeric"
                  placeholder="$ 0"
                  placeholderTextColor={Colors.ink4}
                  returnKeyType="done"
                />
              </View>
              <View style={styles.priceSeparator} />
              <View style={styles.priceInputWrap}>
                <Text style={styles.priceLabel}>Max</Text>
                <TextInput
                  style={styles.priceInput}
                  value={draftPriceMax}
                  onChangeText={setDraftPriceMax}
                  keyboardType="numeric"
                  placeholder="$ ∞"
                  placeholderTextColor={Colors.ink4}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Discount only */}
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionLabel}>OFFERS</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Discount only"
                selected={draftDiscount}
                onPress={() => { haptic.light(); setDraftDiscount(!draftDiscount); }}
              />
            </View>

            {/* Apply */}
            <View style={styles.applyWrap}>
              <TouchableOpacity
                onPress={() => { haptic.success(); onApply(); }}
                activeOpacity={0.85}
                style={styles.applyBtn}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
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
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetBackground: {
    backgroundColor:      Colors.surface,
    borderTopLeftRadius:  18,
    borderTopRightRadius: 18,
    maxHeight:            '78%',
  },
  sheetHandle: {
    backgroundColor: Colors.rule,
    width:           40,
    height:          4,
    borderRadius:    2,
    alignSelf:       'center',
    marginTop:       Space[2],
    marginBottom:    Space[1],
  },
  sheetHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.screenH,
    marginBottom:   Space[5],
  },
  sheetTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  sheetClearBtn: {
    ...Type.caption,
    color:              Colors.ink3,
    textDecorationLine: 'underline',
  },
  sheetContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[3],
    paddingBottom:     Space[12],
  },
  sectionLabel: {
    ...Type.label,
    color:        Colors.ink4,
    marginBottom: Space[3],
  },
  sectionDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical:  Space[5],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
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
  priceRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[3],
  },
  priceInputWrap: {
    flex:              1,
    backgroundColor:   Colors.surfaceSoft,
    borderRadius:      Radius.sm,
    paddingHorizontal: Space[3],
    paddingVertical:   Space[2] + 2,
    borderWidth:       1,
    borderColor:       Colors.rule,
  },
  priceLabel: {
    ...Type.label,
    color:        Colors.ink4,
    marginBottom: 2,
  },
  priceInput: {
    fontFamily: FontFamily.serif,
    fontSize:   16,
    fontWeight: '400',
    color:      Colors.ink1,
    padding:    0,
    margin:     0,
  },
  priceSeparator: {
    width:           24,
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  applyWrap: {
    marginTop: Space[6],
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
