import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { useHaptic } from '../../hooks/useHaptic';
import { CategoryInterface } from '../../api/interfaces';

export type SortKey = 'default' | 'price_asc' | 'price_desc' | 'newest';

const THUMB_R = 13;
const TRACK_H = 3;
const MIN_GAP = 0.05;

// ── Dual-thumb price range slider — pure PanResponder, no Reanimated ──────────
const PriceRangeSlider: React.FC<{
  floor: number;
  ceiling: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: string) => void;
  onChangeMax: (v: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}> = ({ floor, ceiling, valueMin, valueMax, onChangeMin, onChangeMax, onDragStart, onDragEnd }) => {
  // Keep mutable refs for everything the PanResponder closures need —
  // closures are created once, so they must read through refs to get current values.
  const trackWNum = useRef(0);
  const floorRef  = useRef(floor);
  const rangeRef  = useRef(ceiling - floor || 1);
  const loFrac    = useRef((valueMin - floor) / rangeRef.current);
  const hiFrac    = useRef((valueMax - floor) / rangeRef.current);
  const startLoPx = useRef(0);
  const startHiPx = useRef(0);

  // Pixel Animated.Values — driven directly, no interpolation
  const loPx = useRef(new Animated.Value(0)).current;
  const hiPx = useRef(new Animated.Value(0)).current;

  // Labels update live during drag
  const [displayMin, setDisplayMin] = React.useState(valueMin);
  const [displayMax, setDisplayMax] = React.useState(valueMax);

  // Helpers always read from refs — safe to call from PanResponder closures
  const fracToPx  = (f: number) => f * trackWNum.current;
  const pxToPrice = (px: number) =>
    Math.round(floorRef.current + (px / (trackWNum.current || 1)) * rangeRef.current);

  // Recompute positions whenever bounds or track width change
  const reposition = () => {
    if (trackWNum.current === 0) return;
    loPx.setValue(fracToPx(loFrac.current));
    hiPx.setValue(fracToPx(hiFrac.current));
  };

  // Track width known — set positions
  const onLayout = (w: number) => {
    trackWNum.current = w;
    reposition();
  };

  // Bounds changed (products loaded) — update refs and reposition
  useEffect(() => {
    floorRef.current = floor;
    rangeRef.current = ceiling - floor || 1;
    loFrac.current   = (valueMin - floor) / rangeRef.current;
    hiFrac.current   = (valueMax - floor) / rangeRef.current;
    setDisplayMin(valueMin);
    setDisplayMax(valueMax);
    reposition();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floor, ceiling]);

  // External value reset (clear-all) — re-sync fracs and positions
  useEffect(() => {
    loFrac.current = (valueMin - floorRef.current) / rangeRef.current;
    setDisplayMin(valueMin);
    reposition();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueMin]);

  useEffect(() => {
    hiFrac.current = (valueMax - floorRef.current) / rangeRef.current;
    setDisplayMax(valueMax);
    reposition();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueMax]);

  const loPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        startLoPx.current = fracToPx(loFrac.current);
        onDragStart();
      },
      onPanResponderMove: (_, g) => {
        const maxPx = fracToPx(hiFrac.current) - MIN_GAP * trackWNum.current;
        const next  = Math.max(0, Math.min(startLoPx.current + g.dx, maxPx));
        loFrac.current = next / (trackWNum.current || 1);
        loPx.setValue(next);
        setDisplayMin(pxToPrice(next));
      },
      onPanResponderRelease: () => {
        onChangeMin(String(pxToPrice(fracToPx(loFrac.current))));
        onDragEnd();
      },
    }),
  ).current;

  const hiPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        startHiPx.current = fracToPx(hiFrac.current);
        onDragStart();
      },
      onPanResponderMove: (_, g) => {
        const minPx = fracToPx(loFrac.current) + MIN_GAP * trackWNum.current;
        const next  = Math.min(trackWNum.current, Math.max(startHiPx.current + g.dx, minPx));
        hiFrac.current = next / (trackWNum.current || 1);
        hiPx.setValue(next);
        setDisplayMax(pxToPrice(next));
      },
      onPanResponderRelease: () => {
        onChangeMax(String(pxToPrice(fracToPx(hiFrac.current))));
        onDragEnd();
      },
    }),
  ).current;

  const fillLeft  = loPx;
  const fillWidth = Animated.subtract(hiPx, loPx);
  const loTransX  = Animated.subtract(loPx, THUMB_R);
  const hiTransX  = Animated.subtract(hiPx, THUMB_R);

  return (
    <View style={sliderStyles.wrap}>
      <View style={sliderStyles.labels}>
        <Text style={sliderStyles.valueText}>Rs {displayMin.toLocaleString()}</Text>
        <Text style={sliderStyles.valueText}>Rs {displayMax.toLocaleString()}</Text>
      </View>

      <View
        style={sliderStyles.trackOuter}
        onLayout={e => onLayout(e.nativeEvent.layout.width)}
      >
        <View style={sliderStyles.trackBg} />

        <Animated.View style={[sliderStyles.trackFill, { left: fillLeft, width: fillWidth }]} />

        <Animated.View
          {...loPanResponder.panHandlers}
          style={[sliderStyles.thumb, { transform: [{ translateX: loTransX }] }]}
        />
        <Animated.View
          {...hiPanResponder.panHandlers}
          style={[sliderStyles.thumb, { transform: [{ translateX: hiTransX }] }]}
        />
      </View>

      <View style={sliderStyles.boundLabels}>
        <Text style={sliderStyles.boundText}>Rs {floor.toLocaleString()}</Text>
        <Text style={sliderStyles.boundText}>Rs {ceiling.toLocaleString()}</Text>
      </View>
    </View>
  );
};

// ── FilterSheet ───────────────────────────────────────────────────────────────

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;

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

  sheetCategories: CategoryInterface[];
  allBrandsFromSheet: { id: number; name: string }[];
  hideBrands?: boolean;

  priceFloor?: number;
  priceCeiling?: number;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default',    label: 'Default' },
  { key: 'price_asc',  label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'newest',     label: 'Newest' },
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
  priceFloor = 0,
  priceCeiling = 10000,
}) => {
  const insets          = useSafeAreaInsets();
  const haptic          = useHaptic();
  const scrollRef       = useRef<ScrollView>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useEffect(() => {
    if (visible) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [visible]);

  const sliderMin = draftPriceMin !== '' ? Number(draftPriceMin) : priceFloor;
  const sliderMax = draftPriceMax !== '' ? Number(draftPriceMax) : priceCeiling;

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
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheetBackground, { paddingBottom: insets.bottom + Space[4] }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={() => { haptic.light(); onClearAll(); }} activeOpacity={0.7}>
              <Text style={styles.sheetClearBtn}>Clear all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
          >
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

            <View style={styles.sectionDivider} />
            <Text style={styles.sectionLabel}>PRICE RANGE</Text>
            <PriceRangeSlider
              key={`${priceFloor}-${priceCeiling}`}
              floor={priceFloor}
              ceiling={priceCeiling}
              valueMin={sliderMin}
              valueMax={sliderMax}
              onChangeMin={setDraftPriceMin}
              onChangeMax={setDraftPriceMax}
              onDragStart={() => setScrollEnabled(false)}
              onDragEnd={() => setScrollEnabled(true)}
            />

            <View style={styles.sectionDivider} />
            <Text style={styles.sectionLabel}>OFFERS</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Discount only"
                selected={draftDiscount}
                onPress={() => { haptic.light(); setDraftDiscount(!draftDiscount); }}
              />
            </View>
          </ScrollView>

          <View style={styles.applyWrap}>
            <TouchableOpacity
              onPress={() => { haptic.success(); onApply(); }}
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

// ── Slider styles ─────────────────────────────────────────────────────────────
const sliderStyles = StyleSheet.create({
  wrap: {
    paddingBottom: Space[2],
  },
  labels: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   Space[4],
  },
  valueText: {
    fontFamily:    FontFamily.serif,
    fontSize:      15,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.1,
  },
  boundLabels: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      Space[3],
  },
  boundText: {
    ...Type.label,
    color: Colors.ink4,
  },
  trackOuter: {
    height:   THUMB_R * 2,
    position: 'relative',
    justifyContent: 'center',
  },
  trackBg: {
    position:        'absolute',
    left:            0,
    right:           0,
    height:          TRACK_H,
    backgroundColor: Colors.surfaceDeep,
    borderRadius:    TRACK_H / 2,
  },
  trackFill: {
    position:        'absolute',
    height:          TRACK_H,
    backgroundColor: Colors.ink1,
    borderRadius:    TRACK_H / 2,
  },
  thumb: {
    position:        'absolute',
    top:             0,
    width:           THUMB_R * 2,
    height:          THUMB_R * 2,
    borderRadius:    THUMB_R,
    backgroundColor: Colors.ink1,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.2,
    shadowRadius:    4,
    elevation:       4,
  },
});

// ── Sheet styles ──────────────────────────────────────────────────────────────
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
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    marginBottom:      Space[5],
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
    paddingBottom:     Space[4],
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
  applyWrap: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[3],
    paddingBottom:     Space[2],
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
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
