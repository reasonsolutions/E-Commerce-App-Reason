import { StyleSheet } from 'react-native';
import { Colors, Space, Radius } from '../theme';
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
    paddingBottom: Space[4],
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
    fontSize:      29,
    fontWeight:    '600',
    color:         '#FFFFFF',
    lineHeight:    32,
    letterSpacing: 0.05,
  },
  bannerTitleItalic: {
    fontFamily:  FontFamily.serifItalic,
    fontSize:    34,
    fontWeight:  '500',
    lineHeight:  37,
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

  // ── Category rail ─────────────────────────────────────────────────────────────
  categoryRail: {
    flexDirection:     'row',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
    gap:               Space[4] - 2,
  },

  // ── Category spotlight card ───────────────────────────────────────────────────
  spotCard: {
    height:        360,
    borderRadius:  22,
    overflow:      'hidden',
    position:      'relative',
  },
  spotContent: {
    position:  'absolute',
    inset:     0,
    padding:   26,
  },
  spotEyebrow: {
    ...Type.label,
    color:         'rgba(255,255,255,0.72)',
    letterSpacing: 2.2,
  },
  spotTitle: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      38,
    fontWeight:    '500',
    color:         '#FFFFFF',
    lineHeight:    42,
    marginTop:     Space[3],
  },
  spotCtaWrap: {
    marginTop: Space[4],
  },
  spotCta: {
    alignSelf:         'flex-start',
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    paddingVertical:   11,
    paddingHorizontal: Space[5],
    borderRadius:      Radius.pill,
    backgroundColor:   '#FFFFFF',
  },
  spotCtaText: {
    fontFamily:  FontFamily.sans,
    fontSize:    13,
    fontWeight:  '700',
    color:       Colors.ink1,
  },

  // ── Brands rail ───────────────────────────────────────────────────────────────
  brandsRail: {
    flexDirection:     'row',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
    gap:               Space[4] + 2,
  },
  brandChip: {
    alignItems: 'center',
    width:      70,
    gap:        Space[2] + 1,
  },
  brandLabel: {
    ...Type.caption,
    fontWeight: '600',
    color:      Colors.ink2,
    textAlign:  'center',
  },
});

export default styles;
