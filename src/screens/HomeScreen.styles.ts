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
    fontSize:      26,
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
    right:    Space[4],
    zIndex:   20,
  },
  scrollTopInner: {
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: Colors.surfaceDeep,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    3,
    elevation:       1,
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
    fontFamily:    FontFamily.serifItalic,
    fontSize:      32,
    fontWeight:    '400',
    color:         '#FFFFFF',
    lineHeight:    36,
    letterSpacing: 0.2,
  },
  bannerTitleItalic: {
    fontFamily:  FontFamily.serifItalic,
    fontSize:    32,
    fontWeight:  '400',
    lineHeight:  36,
  },
  bannerSub: {
    fontFamily:    FontFamily.mono,
    fontSize:      10,
    color:         'rgba(255,255,255,0.60)',
    lineHeight:    14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  bannerCtaWrap: {
    marginTop: Space[1],
  },
  bannerCta: {
    alignSelf:         'flex-start',
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingVertical:   9,
    paddingHorizontal: Space[5],
    borderRadius:      Radius.pill,
    backgroundColor:   '#FFFFFF',
  },
  bannerCtaText: {
    fontFamily:    FontFamily.sans,
    fontSize:      12,
    fontWeight:    '700',
    color:         Colors.ink1,
    letterSpacing: 0.1,
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

  // ── Shop by category — compact horizontal rail ──────────────────────────────────
  categoryRail: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
    gap:               Space[4],
  },
  categoryRailSkeleton: {
    flexDirection:     'row',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
    gap:               Space[4],
  },

  // ── Category discovery band — tinted surface directly after trust strip ────────
  discoveryBand: {
    backgroundColor: Colors.surfaceSoft,
    paddingTop:      Space[5],
    paddingBottom:   Space[5],
    marginTop:       Space[4],
  },
  // Leads the feed now that category sits above the hero banner — no
  // preceding section, so no extra top margin.
  discoveryBandLead: {
    marginTop: 0,
  },

  // ── Section background alternation ───────────────────────────────────────────────
  sectionSurface: {
    backgroundColor: Colors.surface,
    paddingTop:      Space[6],
    paddingBottom:   Space[3],
  },
  sectionSoft: {
    backgroundColor: Colors.surfaceSoft,
    paddingTop:      Space[6],
    paddingBottom:   Space[5],
  },
  sectionDeep: {
    backgroundColor: Colors.surfaceDeep,
    paddingTop:      Space[6],
    paddingBottom:   Space[5],
  },

  // ── Featured brands — horizontal scroll rail ────────────────────────────────────
  brandsRail: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
    gap:               Space[3],
  },
});

export default styles;
