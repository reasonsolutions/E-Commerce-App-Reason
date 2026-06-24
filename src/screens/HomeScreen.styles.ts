import { StyleSheet } from 'react-native';
import { Colors, Space, Radius, Shadow } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },

  // ── TopBar ───────────────────────────────────────────────────────────────────
  topBar: {
    backgroundColor: Colors.surface,
    zIndex:          10,
  },
  topBarRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[2],
    paddingBottom:     Space[2],
  },
  wordmark: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      30,
    fontWeight:    '700',
    color:         Colors.ink1,
    letterSpacing: -0.1,
  },
  wordmarkDot: {
    color: Colors.accent,
  },
  topBarIcons: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           2,
  },
  iconBtn: {
    width:           40,
    height:          40,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cartBadge: {
    position:          'absolute',
    top:               4,
    right:             3,
    minWidth:          16,
    height:            16,
    borderRadius:      Radius.pill,
    backgroundColor:   Colors.accent,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 3,
    borderWidth:       1.5,
    borderColor:       Colors.surface,
  },
  cartBadgeText: {
    ...Type.label,
    color:         '#FFFFFF',
    letterSpacing: 0,
    fontSize:      9,
  },
  searchWrap: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[3],
  },
  // Resume cart cue
  resumeCue: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[2] + 2,
    backgroundColor:   'rgba(178,90,61,0.08)',
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
  },
  resumeLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2] + 1,
  },
  resumeText: {
    fontFamily:  FontFamily.sans,
    fontSize:    12.5,
    fontWeight:  '500',
    color:       Colors.ink2,
  },
  resumeRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  resumeAction: {
    fontFamily:  FontFamily.sans,
    fontSize:    12.5,
    fontWeight:  '700',
    color:       Colors.accent,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scroll: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingBottom: Space[10],
  },

  // ── Scroll to top ─────────────────────────────────────────────────────────────
  scrollTopBtn: {
    position: 'absolute',
    right:    Space[5],
    bottom:   80,
    zIndex:   20,
  },
  scrollTopInner: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: Colors.surface,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.08,
    shadowRadius:    4,
    elevation:       2,
  },

  // ── BannerSlot ───────────────────────────────────────────────────────────────
  bannerSlot: {
    gap: Space[4] - 2,
  },
  bannerCard: {
    borderRadius: 20,
    overflow:     'hidden',
    position:     'relative',
  },
  bannerImg: {
    width:  '100%',
    height: '100%',
  },
  bannerInsetCard: {
    position:        'absolute',
    bottom:           20,
    right:            20,
    width:            84,
    height:           104,
    borderRadius:     12,
    overflow:         'hidden',
    borderWidth:      3,
    borderColor:      '#FFFFFF',
    ...Shadow.sm,
  },
  bannerInsetImg: {
    width:  '100%',
    height: '100%',
  },
  bannerContent: {
    position:   'absolute',
    left:       24,
    right:      24,
    bottom:     24,
    gap:        Space[3] - 2,
  },
  bannerContentSplit: {
    top:    24,
    bottom: 24,
    justifyContent: 'center',
  },
  bannerEyebrow: {
    ...Type.label,
    color:         'rgba(255,255,255,0.72)',
    letterSpacing: 2.2,
  },
  bannerTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      25,
    fontWeight:    '600',
    color:         '#FFFFFF',
    lineHeight:    28,
    letterSpacing: 0.05,
  },
  bannerTitleItalic: {
    fontFamily:  FontFamily.serifItalic,
    fontSize:    29,
    fontWeight:  '500',
    lineHeight:  32,
  },
  bannerSub: {
    fontFamily:  FontFamily.sans,
    fontSize:    13,
    color:       'rgba(255,255,255,0.82)',
    lineHeight:  18,
  },
  bannerCtaWrap: {
    marginTop: Space[1],
  },
  bannerCta: {
    alignSelf:         'flex-start',
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    paddingVertical:   11,
    paddingHorizontal: Space[5],
    borderRadius:      Radius.pill,
    backgroundColor:   '#FFFFFF',
  },
  bannerCtaText: {
    fontFamily:  FontFamily.sans,
    fontSize:    13,
    fontWeight:  '700',
    color:       Colors.ink1,
  },
  bannerDots: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            6,
    paddingTop:     Space[4] - 2,
  },
  bannerDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: 'rgba(40,32,24,0.18)',
  },
  bannerDotActive: {
    width:           20,
    backgroundColor: Colors.ink1,
  },

  // ── Shop by category — wrapped grid, 3 per row ──────────────────────────────────
  categoryGrid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    rowGap:            Space[4],
  },

  // ── Discovery band — tints Brands + Categories for section-to-section rhythm ────
  discoveryBand: {
    backgroundColor: Colors.surfaceSoft,
    paddingTop:       Space[6],
    paddingBottom:    Space[8],
  },

  // ── Featured brands — compact horizontal rail ───────────────────────────────────
  brandsRail: {
    flexDirection:     'row',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
    gap:               Space[4],
  },
});

export default styles;
