import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { useHaptic } from '../../hooks/useHaptic';
import { CategoryInterface } from '../../api/interfaces';

export type SortKey = 'default' | 'price_asc' | 'price_desc' | 'newest';

const THUMB_R = 13;
const TRACK_H = 3;
const MIN_GAP = 0.05;

// ── Dual-thumb price range slider ─────────────────────────────────────────────
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
  const trackWNum = useRef(0);
  const floorRef  = useRef(floor);
  const rangeRef  = useRef(ceiling - floor || 1);
  const loFrac    = useRef((valueMin - floor) / rangeRef.current);
  const hiFrac    = useRef((valueMax - floor) / rangeRef.current);
  const startLoPx = useRef(0);
  const startHiPx = useRef(0);

  const loPx = useRef(new Animated.Value(0)).current;
  const hiPx = useRef(new Animated.Value(0)).current;

  const [displayMin, setDisplayMin] = React.useState(valueMin);
  const [displayMax, setDisplayMax] = React.useState(valueMax);

  const fracToPx  = (f: number) => f * trackWNum.current;
  const pxToPrice = (px: number) =>
    Math.round(floorRef.current + (px / (trackWNum.current || 1)) * rangeRef.current);

  const reposition = () => {
    if (trackWNum.current === 0) return;
    loPx.setValue(fracToPx(loFrac.current));
    hiPx.setValue(fracToPx(hiFrac.current));
  };

  const onLayout = (w: number) => {
    trackWNum.current = w;
    reposition();
  };

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
        <Text style={sliderStyles.valueText}>MUR {displayMin.toLocaleString()}</Text>
        <Text style={sliderStyles.valueText}>MUR {displayMax.toLocaleString()}</Text>
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
        <Text style={sliderStyles.boundText}>MUR {floor.toLocaleString()}</Text>
        <Text style={sliderStyles.boundText}>MUR {ceiling.toLocaleString()}</Text>
      </View>
    </View>
  );
};

// ── Checkbox row ──────────────────────────────────────────────────────────────
const CheckRow: React.FC<{
  label: string;
  checked: boolean;
  onPress: () => void;
  count?: number;
}> = ({ label, checked, onPress, count }) => (
  <TouchableOpacity style={styles.checkRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Icon name="checkmark" size={12} color="#FFFFFF" />}
    </View>
    <Text style={styles.checkLabel} numberOfLines={1}>{label}</Text>
    {count !== undefined && (
      <Text style={styles.checkCount}>{count}</Text>
    )}
  </TouchableOpacity>
);

// ── Radio row ─────────────────────────────────────────────────────────────────
const RadioRow: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
}> = ({ label, selected, onPress }) => (
  <TouchableOpacity style={styles.radioRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
    <Text style={styles.radioLabel}>{label}</Text>
  </TouchableOpacity>
);

// ── FilterSheet ───────────────────────────────────────────────────────────────

export interface FilterSheetProps {
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

type NavSection = 'sort' | 'category' | 'brand' | 'price' | 'offers';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default',    label: 'Relevance' },
  { key: 'price_asc',  label: 'Price Low to High' },
  { key: 'price_desc', label: 'Price High to Low' },
  { key: 'newest',     label: 'Newest First' },
];

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
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const [activeSection, setActiveSection] = useState<NavSection>('sort');
  const [sliderScrollEnabled, setSliderScrollEnabled] = useState(true);

  useEffect(() => {
    if (visible) setActiveSection('sort');
  }, [visible]);

  const sliderMin = draftPriceMin !== '' ? Number(draftPriceMin) : priceFloor;
  const sliderMax = draftPriceMax !== '' ? Number(draftPriceMax) : priceCeiling;

  const hasActiveFilters =
    draftCategories.length > 0 ||
    draftBrands.length > 0 ||
    draftPriceMin !== '' ||
    draftPriceMax !== '' ||
    draftDiscount ||
    draftSortKey !== 'default';

  const navItems: { key: NavSection; label: string; count?: number }[] = [
    { key: 'sort',     label: 'Sort By',   count: draftSortKey !== 'default' ? 1 : undefined },
    { key: 'category', label: 'Category',  count: draftCategories.length || undefined },
    ...(!hideBrands ? [{ key: 'brand' as NavSection, label: 'Brand', count: draftBrands.length || undefined }] : []),
    { key: 'price',   label: 'Price',     count: (draftPriceMin !== '' || draftPriceMax !== '') ? 1 : undefined },
    { key: 'offers',  label: 'Offers',    count: draftDiscount ? 1 : undefined },
  ];

  const renderPanel = () => {
    switch (activeSection) {
      case 'sort':
        return (
          <>
            {SORT_OPTIONS.map(opt => (
              <RadioRow
                key={opt.key}
                label={opt.label}
                selected={draftSortKey === opt.key}
                onPress={() => { haptic.light(); setDraftSortKey(opt.key); }}
              />
            ))}
          </>
        );

      case 'category':
        return sheetCategories.length === 0 ? (
          <Text style={styles.emptyPanelText}>No categories available</Text>
        ) : (
          <>
            {sheetCategories.map(cat => (
              <CheckRow
                key={cat.CategoryId}
                label={cat.CategoryName}
                checked={draftCategories.includes(cat.CategoryId)}
                onPress={() => { haptic.light(); toggleDraftCategory(cat.CategoryId); }}
              />
            ))}
          </>
        );

      case 'brand':
        return allBrandsFromSheet.length === 0 ? (
          <Text style={styles.emptyPanelText}>No brands available</Text>
        ) : (
          <>
            {allBrandsFromSheet.map(b => (
              <CheckRow
                key={b.id}
                label={b.name}
                checked={draftBrands.includes(b.id)}
                onPress={() => { haptic.light(); toggleDraftBrand(b.id); }}
              />
            ))}
          </>
        );

      case 'price':
        return (
          <View style={styles.pricePanel}>
            <PriceRangeSlider
              key={`${priceFloor}-${priceCeiling}`}
              floor={priceFloor}
              ceiling={priceCeiling}
              valueMin={sliderMin}
              valueMax={sliderMax}
              onChangeMin={setDraftPriceMin}
              onChangeMax={setDraftPriceMax}
              onDragStart={() => setSliderScrollEnabled(false)}
              onDragEnd={() => setSliderScrollEnabled(true)}
            />
          </View>
        );

      case 'offers':
        return (
          <RadioRow
            label="Discount only"
            selected={draftDiscount}
            onPress={() => { haptic.light(); setDraftDiscount(!draftDiscount); }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <View style={[styles.root, { paddingTop: insets.top }]}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="arrow-back" size={22} color={Colors.ink1} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filter By</Text>
          <TouchableOpacity
            onPress={() => { haptic.light(); onClearAll(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={!hasActiveFilters}
          >
            <Text style={[styles.resetBtn, !hasActiveFilters && styles.resetBtnDisabled]}>Reset</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerDivider} />

        {/* ── Two-panel body ───────────────────────────────────────────── */}
        <View style={styles.body}>

          {/* Left nav */}
          <View style={styles.navCol}>
            {navItems.map(item => {
              const isActive = activeSection === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => { haptic.light(); setActiveSection(item.key); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  {item.count !== undefined && (
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>{item.count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Right panel */}
          <ScrollView
            style={styles.panelCol}
            contentContainerStyle={styles.panelContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={sliderScrollEnabled}
          >
            {renderPanel()}
          </ScrollView>
        </View>

        {/* ── Apply button ─────────────────────────────────────────────── */}
        <View style={[styles.applyWrap, { paddingBottom: insets.bottom + Space[2] }]}>
          <TouchableOpacity
            onPress={() => { haptic.success(); onApply(); }}
            activeOpacity={0.85}
            style={styles.applyBtn}
          >
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Slider styles ─────────────────────────────────────────────────────────────
const sliderStyles = StyleSheet.create({
  wrap: {
    paddingBottom: Space[2],
    paddingTop:    Space[2],
  },
  labels: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   Space[5],
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
    height:         THUMB_R * 2,
    position:       'relative',
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
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[4],
  },
  headerTitle: {
    fontFamily:    FontFamily.sans,
    fontSize:      17,
    fontWeight:    '600',
    color:         Colors.ink1,
    letterSpacing: 0,
  },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  resetBtn: {
    fontFamily:    FontFamily.sans,
    fontSize:      14,
    fontWeight:    '500',
    color:         Colors.accent,
    letterSpacing: 0,
  },
  resetBtnDisabled: {
    color: Colors.ink4,
  },

  // ── Two-panel layout ─────────────────────────────────────────────────────────
  body: {
    flex:          1,
    flexDirection: 'row',
  },

  // Left nav column
  navCol: {
    width:           130,
    backgroundColor: Colors.surfaceSoft,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.rule,
  },
  navItem: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical:  Space[4] + 2,
    paddingLeft:     Space[4],
    paddingRight:    Space[3],
    borderLeftWidth:  3,
    borderLeftColor: 'transparent',
  },
  navItemActive: {
    backgroundColor:  Colors.surface,
    borderLeftColor:  Colors.ink1,
  },
  navLabel: {
    fontFamily:    FontFamily.sans,
    fontSize:      13,
    fontWeight:    '400',
    color:         Colors.ink3,
    flex:          1,
  },
  navLabelActive: {
    color:      Colors.ink1,
    fontWeight: '500',
  },
  navBadge: {
    backgroundColor: Colors.ink1,
    borderRadius:    8,
    minWidth:        16,
    height:          16,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 4,
  },
  navBadgeText: {
    fontSize:    9,
    color:       '#FFFFFF',
    fontWeight:  '600',
  },

  // Right panel column
  panelCol: {
    flex: 1,
  },
  panelContent: {
    paddingHorizontal: Space[4],
    paddingTop:        Space[3],
    paddingBottom:     Space[6],
  },
  pricePanel: {
    paddingTop: Space[2],
  },
  emptyPanelText: {
    ...Type.caption,
    color:     Colors.ink4,
    marginTop: Space[4],
  },

  // ── Check row ────────────────────────────────────────────────────────────────
  checkRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   Space[3] + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
    gap:               Space[3],
  },
  checkbox: {
    width:           20,
    height:          20,
    borderRadius:    Radius.xs,
    borderWidth:     1.5,
    borderColor:     Colors.rule,
    backgroundColor: Colors.surface,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  checkboxChecked: {
    backgroundColor: Colors.ink1,
    borderColor:     Colors.ink1,
  },
  checkLabel: {
    fontFamily:    FontFamily.sans,
    fontSize:      14,
    fontWeight:    '400',
    color:         Colors.ink1,
    flex:          1,
  },
  checkCount: {
    ...Type.label,
    color: Colors.ink4,
  },

  // ── Radio row ─────────────────────────────────────────────────────────────────
  radioRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   Space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
    gap:               Space[3],
  },
  radioOuter: {
    width:           20,
    height:          20,
    borderRadius:    10,
    borderWidth:     1.5,
    borderColor:     Colors.rule,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  radioOuterSelected: {
    borderColor: Colors.ink1,
  },
  radioInner: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: Colors.ink1,
  },
  radioLabel: {
    fontFamily:    FontFamily.sans,
    fontSize:      14,
    fontWeight:    '400',
    color:         Colors.ink1,
  },

  // ── Apply ──────────────────────────────────────────────────────────────────
  applyWrap: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[3],
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
