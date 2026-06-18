import { StyleSheet, Dimensions } from 'react-native';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_GAP = Space[3];

export const COL_W      = (SCREEN_W - Space.screenH * 2 - COL_GAP) / 2;
export const SPAN_W     = SCREEN_W - Space.screenH * 2;
export const GRID_IMG_H = COL_W * 1.25;
export const SPAN_IMG_H = SPAN_W * 0.58;
export const HERO_IMG_H = SCREEN_W * 0.56;
export const FEAT_W     = SCREEN_W - Space.screenH * 2;
export const FEAT_IMG_H = FEAT_W * 0.92;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerWrap: {
    backgroundColor: Colors.surface,
    zIndex:          2,
  },
  headerRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[4],
    gap:               Space[3],
  },
  headerCenter: {
    flex: 1,
    gap:  2,
  },
  headerTitle: {
    fontFamily:  FontFamily.sans,
    fontSize:    18,
    fontWeight:  '600',
    color:       Colors.ink1,
    letterSpacing: -0.1,
  },
  headerCount: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 0.5,
  },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── Filter pill ──────────────────────────────────────────────────────────────
  filterPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[1],
    paddingVertical:   Space[1],
    paddingHorizontal: Space[2],
    borderRadius:      Radius.pill,
    borderWidth:       StyleSheet.hairlineWidth,
    borderColor:       Colors.rule,
  },
  filterPillText: {
    fontFamily:  FontFamily.sans,
    fontSize:    12,
    fontWeight:  '400',
    color:       Colors.ink3,
    lineHeight:  12 * 1.2,
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
    overflow:        'hidden',
    backgroundColor: Colors.surfaceDeep,
    marginBottom:    Space[1],
  },
  heroImgWrap: {
    width:           '100%',
    height:          HERO_IMG_H,
    backgroundColor: Colors.surfaceDeep,
    overflow:        'hidden',
  },
  heroInfo: {
    paddingTop:  Space[3],
    gap:         3,
  },
  heroCardBrand: {
    ...Type.label,
    color: Colors.ink4,
  },
  heroCardName: {
    fontFamily:    FontFamily.serif,
    fontSize:      18,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.3,
    lineHeight:    18 * 1.4,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           Space[2],
    marginTop:     2,
  },
  heroCardPrice: {
    fontFamily:    FontFamily.serif,
    fontSize:      16,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.2,
    lineHeight:    16 * 1.2,
  },
  heroCardWas: {
    fontFamily:         FontFamily.mono,
    fontSize:           11,
    color:              Colors.ink4,
    textDecorationLine: 'line-through',
    lineHeight:         11 * 1.2,
  },
  heroDiscount: {
    fontFamily:    FontFamily.mono,
    fontSize:      10,
    color:         Colors.ink3,
    letterSpacing: 0.2,
    lineHeight:    10 * 1.2,
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
  gridRowCentered: {
    justifyContent: 'center',
  },

  // ── Grid tile ─────────────────────────────────────────────────────────────────
  gridTile: {
    width: COL_W,
  },
  gridTileCentered: {
    width:     COL_W,
    alignSelf: 'center',
  },
  gridImgWrap: {
    width:           COL_W,
    height:          GRID_IMG_H,
    borderRadius:    16,
    overflow:        'hidden',
    backgroundColor: '#FFFFFF',
    padding:         Space[2],
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
    paddingTop: Space[2],
    gap:        3,
  },
  gridBrand: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 0.6,
  },
  gridName: {
    fontFamily: FontFamily.sans,
    fontSize:   13,
    fontWeight: '400',
    color:      Colors.ink2,
    lineHeight: 13 * 1.45,
  },
  gridPrice: {
    fontFamily: FontFamily.sans,
    fontSize:   14,
    fontWeight: '600',
    color:      Colors.ink1,
    lineHeight: 14 * 1.2,
  },

  // ── Span card ─────────────────────────────────────────────────────────────────
  spanCard: {
    width:           SPAN_W,
    overflow:        'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius:    16,
    marginBottom:    Space[6],
  },
  spanImgWrap: {
    width:           '100%',
    height:          SPAN_W * 0.65,
    backgroundColor: '#FFFFFF',
    overflow:        'hidden',
    borderRadius:    16,
  },
  spanFooter: {
    paddingTop: Space[3],
    gap:        3,
  },
  spanName: {
    fontFamily: FontFamily.sans,
    fontSize:   15,
    fontWeight: '400',
    color:      Colors.ink2,
    lineHeight: 15 * 1.45,
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
  endOfResultsRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginVertical: Space[8],
    gap:            Space[3],
  },
  endOfResultsLine: {
    flex:            1,
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  endOfResults: {
    ...Type.caption,
    color:         Colors.ink5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize:      10,
  },
  heartBtn: {
    position: 'absolute',
    top:      Space[2],
    right:    Space[2],
  },
  heartCircle: {
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.08,
    shadowRadius:    2,
    elevation:       1,
  },

  // ── Empty state CTAs ──────────────────────────────────────────────────────────
  emptyPrimaryBtn: {
    height:          44,
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    paddingHorizontal: Space[6],
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       Space[2],
  },
  emptyPrimaryBtnText: {
    ...Type.bodyStrong,
    color:    '#FFFFFF',
    fontSize: 15,
  },
  stateSecondaryAction: {
    alignSelf:  'center',
    marginTop:  Space[3],
  },

  // ── Scroll to top ─────────────────────────────────────────────────────────────
  scrollTopBtn: {
    position: 'absolute',
    right:    Space[5],
    bottom:   Space[6],
    zIndex:   20,
  },
  scrollTopInner: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: Colors.surface,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.10,
    shadowRadius:    8,
    elevation:       4,
  },

  // ── Featured layout — full-width single column for ≤3 results ────────────────
  featuredCard: {
    width:        FEAT_W,
    marginBottom: Space[5],
    alignSelf:    'center',
  },
  featuredImgWrap: {
    width:           FEAT_W,
    height:          FEAT_IMG_H,
    borderRadius:    16,
    overflow:        'hidden',
    backgroundColor: '#FFFFFF',
    padding:         Space[3],
  },
  featuredInfo: {
    paddingTop: Space[3],
    gap:        4,
  },
  featuredName: {
    fontFamily: FontFamily.sans,
    fontSize:   16,
    fontWeight: '400',
    color:      Colors.ink2,
    lineHeight: 16 * 1.4,
  },
  featuredPrice: {
    fontFamily: FontFamily.sans,
    fontSize:   15,
    fontWeight: '600',
    color:      Colors.ink1,
    lineHeight: 15 * 1.2,
  },
});
