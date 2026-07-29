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
  // Fixed nav bar (wordmark + icons + search reveal) — solid blue, stays pinned
  // above the ScrollView. The category rail and hero carousel live inside the
  // ScrollView on their own gradient so they scroll away with the rest of the page.
  topBar: {
    backgroundColor: Colors.heroStageStart,
    zIndex:          10,
  },
  // Sits behind the ScrollView, colored to match the hero gradient's start
  // color, so pull-to-refresh overscroll reveals blue instead of the page's
  // cream background. Height is generous — only needs to cover however far a
  // pull gesture typically travels, not tied to any exact layout measurement.
  pullBacking: {
    position:        'absolute',
    top:              0,
    left:             0,
    right:            0,
    height:           400,
    backgroundColor:  Colors.heroStageStart,
  },
  topBarRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    paddingTop:        2,
    paddingBottom:     2,
  },
  wordmark: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      22,
    fontWeight:    '700',
    color:         '#FFFFFF',
    letterSpacing: -0.1,
  },
  wordmarkDot: {
    color: '#FFFFFF',
  },
  topBarIcons: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           2,
  },
  iconBtn: {
    width:           34,
    height:          34,
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
    backgroundColor:   Colors.heroNavy,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 3,
    borderWidth:       1.5,
    borderColor:       Colors.heroStageStart,
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
  // Resume cart cue — sits below the colored stage, on the page's normal surface.
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
  // No backgroundColor here on purpose — every section rendered inside
  // (the hero LinearGradient, sectionSurface/Soft/Deep) already paints its
  // own opaque background. Leaving this transparent lets `pullBacking` (a
  // sibling behind the ScrollView) show through during pull-to-refresh
  // overscroll instead of being covered by this view's own fill.
  scroll: {
    flex: 1,
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

  // Flat bottom edge — matches pullBacking behind it so the masthead reads as
  // one integrated section with no curve/seam, whether at rest or scrolled.
  heroStage: {
    overflow: 'hidden',
  },

  // ── BannerSlot — solid ember panel, the one color break inside the ink
  // masthead. Everything else at the top of Home (logo, categories, search)
  // stays on ink; the hero alone breaks to ember so it reads as "the featured
  // moment" rather than blending into the surrounding chrome. ──────────────
  bannerSlot: {
    gap: 0,
  },
  bannerSkeletonWrap: {
    marginHorizontal: Space.screenH,
    marginTop:        Space[3],
  },
  // The hero panel itself — inset within the ink masthead like any other
  // card, its own duotone gradient set per-slide (heroThemeFor in
  // HomeScreen.tsx) instead of one fixed ember color for every category.
  // Column layout: header row (eyebrow + wishlist), body row (text + product
  // plinth), CTA row.
  bannerCard: {
    flex:              1,
    marginHorizontal:  Space.screenH,
    borderRadius:      20,
    overflow:          'hidden',
    position:          'relative',
    paddingHorizontal: Space[4],
    paddingTop:        Space[3],
    paddingBottom:     Space[3] + 2,
  },
  // Soft glow — integrates the card's own accent into its gradient instead
  // of it reading as a flat block. Stands in for a literal radial gradient
  // (RN has no native radial-gradient primitive without a new dependency) —
  // a large, softly-alpha'd circle reads similarly at this scale.
  bannerGlow: {
    position:        'absolute',
    right:            -30,
    top:              -30,
    width:            160,
    height:           160,
    borderRadius:     80,
    backgroundColor:  'rgba(255,255,255,0.14)',
  },
  bannerHeaderRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
  },
  bannerEyebrow: {
    flex:          1,
    fontFamily:    FontFamily.sans,
    fontSize:      10,
    fontWeight:    '700',
    color:         'rgba(255,255,255,0.78)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // WishlistHeart positions itself absolutely (top/right) within its nearest
  // positioned ancestor — this fixed-size, relatively-positioned wrapper is
  // that ancestor, so the heart lands next to the eyebrow instead of in the
  // corner of the whole card.
  bannerWishlistWrap: {
    position: 'relative',
    width:    32,
    height:   32,
    flexShrink: 0,
  },
  bannerBody: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
  },
  bannerTextCol: {
    flex:     1,
    minWidth: 0,
  },
  // Italic serif — matches the handoff's product-editorial treatment.
  bannerHeadline: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      21,
    fontWeight:    '600',
    color:         '#FFFFFF',
    lineHeight:    24,
  },
  bannerPriceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           6,
    marginTop:     Space[2],
    flexWrap:      'wrap',
  },
  bannerPrice: {
    fontFamily: FontFamily.sans,
    fontWeight: '700',
    fontSize:   16,
    color:      '#FFFFFF',
  },
  bannerComparePrice: {
    fontFamily:        FontFamily.sans,
    fontSize:          12,
    color:             'rgba(255,255,255,0.55)',
    textDecorationLine: 'line-through',
  },
  // Solid white, same as the CTA pill — was a translucent white-on-white
  // pill that barely registered against the mid-tone gradient. The discount
  // is one of the two numbers meant to jump out here, so it gets the same
  // high-contrast treatment instead of the weakest one.
  bannerDiscountPill: {
    alignSelf:         'flex-start',
    marginTop:         Space[2],
    backgroundColor:   '#FFFFFF',
    paddingVertical:   4,
    paddingHorizontal: 10,
    borderRadius:      Radius.pill,
  },
  bannerDiscountPillText: {
    fontFamily: FontFamily.sans,
    fontSize:   11,
    fontWeight: '700',
    color:      Colors.ink1,
  },
  // Fixed square (not a % of card width) so the card's total height is
  // deterministic — BannerSlot's BANNER_H is sized against this.
  bannerPlinthCol: {
    width:          142,
    height:         142,
    flexShrink:     0,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  // Soft grounded shadow, cast directly beneath the plinth — narrower and
  // closer than a generic ambient shadow so it reads as this card's own
  // shadow, not a separate floating element. A translucent blurred oval
  // standing in for a CSS blur filter (RN has no blur-filter primitive).
  bannerGroundShadow: {
    position:        'absolute',
    bottom:           15,
    width:            84,
    height:           12,
    borderRadius:     Radius.pill,
    backgroundColor:  'rgba(0,0,0,0.22)',
  },
  // Product photos from the API are opaque white-background shots, not
  // cutouts — floating them directly on the gradient just shows a hard white
  // square. Made intentional instead: a smaller, lifted white card (rounded +
  // real shadow) reads as a deliberate product plinth. Sized below the full
  // 142 plinth column so the gradient still shows around it.
  bannerPlinth: {
    width:            108,
    height:           108,
    borderRadius:     Radius.md,
    backgroundColor:  '#FFFFFF',
    alignItems:       'center',
    justifyContent:   'center',
    padding:          Space[2],
    ...Shadow.md,
  },
  bannerImg: {
    width:  '100%',
    height: '100%',
  },
  // Solid white pill — same weight as the wishlist heart's solid-white
  // treatment elsewhere in this card, so the CTA reads as a real button
  // instead of text floating on the busy gradient. Not its own touch
  // target — the whole card already handles the tap — so no press state
  // of its own, just the visual affordance.
  bannerCta: {
    alignSelf:         'flex-start',
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    marginTop:         Space[3],
    backgroundColor:   '#FFFFFF',
    borderRadius:       Radius.pill,
    paddingVertical:   Space[2],
    paddingHorizontal: Space[4],
  },
  bannerCtaText: {
    fontFamily: FontFamily.sans,
    fontSize:   13.5,
    fontWeight: '700',
    color:      Colors.ink1,
  },
  // Dots sit on the same dark masthead as the rest of the hero content.
  // Bottom padding kept tight — sectionSurface below already adds its own
  // top padding, so products aren't pushed down by a redundant double gap.
  bannerDots: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            6,
    paddingTop:     Space[1],
    paddingBottom:  Space[3],
  },
  bannerDot: {
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  bannerDotActive: {
    width:           24,
    backgroundColor: Colors.heroYellow,
  },

  // ── Shop by category — on the hero stage, white avatars on blue ──────────────
  categoryRailWrap: {
    paddingTop:    Space[1],
    paddingBottom: Space[3],
  },
  categoryRailHead: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    marginBottom:      Space[3],
  },
  categoryRailEyebrow: {
    ...Type.label,
    color:         '#FFFFFF',
    letterSpacing: 1.6,
  },
  categoryRailAction: {
    fontFamily: FontFamily.sans,
    fontSize:   13,
    fontWeight: '600',
    color:      Colors.heroTextSoft,
  },
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

  // ── Section background alternation ───────────────────────────────────────────────
  // cream (page base) → neutral band → cream → neutral band → cream, with the
  // peach ember tint (heroBandTint) reserved exclusively for "Picked for you"
  // — keeps ember scarce per the color-hierarchy restraint pass.
  sectionSurface: {
    backgroundColor: Colors.heroPageBg,
    paddingTop:      Space[5],
    paddingBottom:   Space[3],
  },
  sectionSoft: {
    backgroundColor: Colors.heroPageBg,
    paddingTop:      Space[5],
    paddingBottom:   Space[5],
  },
  sectionDeep: {
    backgroundColor: Colors.surfaceSoft,
    paddingTop:      Space[5],
    paddingBottom:   Space[5],
  },
  sectionPeach: {
    backgroundColor: Colors.heroBandTint,
    paddingTop:      Space[5],
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
