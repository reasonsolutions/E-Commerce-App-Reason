import { StyleSheet, Dimensions } from 'react-native';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_GAP = Space[3];

export const COL_W    = (SCREEN_W - Space.screenH * 2 - COL_GAP) / 2;
export const SPAN_W   = SCREEN_W - Space.screenH * 2;
export const GRID_IMG_H = COL_W * 1.25;
export const SPAN_IMG_H = SPAN_W * 0.58;
export const HERO_IMG_H = SCREEN_W * 0.56;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.ink1,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerWrap: {
    zIndex: 2,
  },

  // ── Filter pill (rightSlot) ──────────────────────────────────────────────────
  filterPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[1] + 2,
    paddingVertical:   Space[1] + 1,
    paddingHorizontal: Space[2] + 2,
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.18)',
  },
  filterPillText: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    color:         'rgba(255,255,255,0.70)',
    letterSpacing: 0.5,
  },
  filterPillTextActive: {
    color: Colors.accent,
  },
  filterDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: Colors.accent,
  },

  // ── Search band ──────────────────────────────────────────────────────────────
  searchBand: {
    backgroundColor:   Colors.ink1,
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[2],
    paddingBottom:     Space[3],
  },

  // ── Scroll canvas ────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
  },

  // ── Hero card ────────────────────────────────────────────────────────────────
  heroCard: {
    borderRadius:     Radius.md,
    overflow:         'hidden',
    backgroundColor:  Colors.surfaceDeep,
    marginBottom:     Space[1],
  },
  heroImgWrap: {
    width:           '100%',
    height:          HERO_IMG_H,
    backgroundColor: Colors.surfaceDeep,
  },
  heroBadgeWrap: {
    position: 'absolute',
    top:      Space[3],
    left:     Space[3],
  },
  heroFooter: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    paddingHorizontal: Space[5],
    paddingBottom:     Space[5],
    paddingTop:        Space[4],
    flexDirection:     'row',
    alignItems:        'flex-end',
    justifyContent:    'space-between',
  },
  heroFooterLeft: {
    flex:         1,
    gap:          4,
    paddingRight: Space[4],
  },
  heroCardBrand: {
    ...Type.label,
    color: 'rgba(255,255,255,0.46)',
  },
  heroCardName: {
    fontFamily:    FontFamily.serif,
    fontSize:      20,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight:    20 * 1.2,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           Space[2],
    marginTop:     2,
  },
  heroCardPrice: {
    fontFamily:    FontFamily.serif,
    fontSize:      18,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroCardWas: {
    fontFamily:         FontFamily.mono,
    fontSize:           12,
    color:              'rgba(255,255,255,0.36)',
    textDecorationLine: 'line-through',
  },
  heroViewLink: {
    alignItems:    'center',
    paddingBottom: 2,
  },
  heroViewLinkText: {
    ...Type.caption,
    color:         'rgba(255,255,255,0.72)',
    letterSpacing: 0.2,
  },
  heroViewLinkUnderline: {
    height:          1,
    width:           '100%',
    backgroundColor: 'rgba(255,255,255,0.32)',
    marginTop:       2,
  },

  // ── Ember discount badge ──────────────────────────────────────────────────────
  discountBadge: {
    backgroundColor:   Colors.accentTint,
    borderWidth:       1,
    borderColor:       Colors.accent,
    borderRadius:      Radius.xs,
    paddingVertical:   2,
    paddingHorizontal: Space[2],
  },
  discountBadgeText: {
    ...Type.label,
    color:         Colors.accent,
    letterSpacing: 0.8,
  },

  // ── Grid divider ─────────────────────────────────────────────────────────────
  gridDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical:  Space[6],
  },

  // ── Grid row ──────────────────────────────────────────────────────────────────
  gridRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   Space[6],
  },

  // ── Grid tile ─────────────────────────────────────────────────────────────────
  gridTile: {
    width: COL_W,
  },
  gridImgWrap: {
    width:           COL_W,
    height:          GRID_IMG_H,
    borderRadius:    Radius.sm,
    overflow:        'hidden',
    backgroundColor: Colors.surfaceDeep,
  },
  gridImg: {
    width:  '100%',
    height: '100%',
  },
  gridBadgeWrap: {
    position: 'absolute',
    top:      Space[2],
    left:     Space[2],
  },
  gridInfo: {
    paddingTop:        Space[2],
    paddingHorizontal: 1,
    gap:               3,
  },
  gridBrand: {
    ...Type.label,
    color: Colors.ink4,
  },
  gridName: {
    fontFamily:    FontFamily.serif,
    fontSize:      14,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.1,
    lineHeight:    14 * 1.35,
  },

  // ── Span card ─────────────────────────────────────────────────────────────────
  spanCard: {
    width:           SPAN_W,
    borderRadius:    Radius.md,
    overflow:        'hidden',
    backgroundColor: Colors.surfaceDeep,
    marginBottom:    Space[6],
  },
  spanImgWrap: {
    width:           '100%',
    height:          SPAN_IMG_H,
    backgroundColor: Colors.surfaceDeep,
  },
  spanBadgeWrap: {
    position: 'absolute',
    top:      Space[3],
    left:     Space[4],
  },
  spanFooter: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    paddingHorizontal: Space[5],
    paddingBottom:     Space[5],
    gap:               3,
  },
  spanBrand: {
    ...Type.label,
    color: 'rgba(255,255,255,0.44)',
  },
  spanName: {
    fontFamily:    FontFamily.serif,
    fontSize:      18,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight:    18 * 1.2,
  },
  spanPrice: {
    fontFamily:    FontFamily.serif,
    fontSize:      15,
    fontWeight:    '400',
    color:         'rgba(255,255,255,0.75)',
    letterSpacing: -0.2,
    marginTop:     2,
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────────
  skeletonWrap: {
    paddingTop: Space[2],
  },

  // ── State wrappers ────────────────────────────────────────────────────────────
  stateWrap: {
    flex:       1,
    paddingTop: Space[12] + Space[6],
  },

  // ── Chip ──────────────────────────────────────────────────────────────────────
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
  endOfResults: {
    ...Type.caption,
    color:     Colors.ink4,
    textAlign: 'center',
    marginVertical: Space[6],
  },
});
