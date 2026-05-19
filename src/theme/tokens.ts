import { Platform } from 'react-native';

export const Colors = {
  // ── Accent ────────────────────────────────────────────────────────────────
  // Ember/terracotta — primary CTA states, success moments. Use sparingly (≤3
  // appearances per session). Was #0A0A0A (near-black) in the pre-premium era.
  accent:      '#B25A3D',
  accentInk:   '#FFFFFF',
  accentTint:  'rgba(178, 90, 61, 0.07)',

  // ── Surfaces ──────────────────────────────────────────────────────────────
  // Three warm off-white levels replace the flat #FFFFFF + drop-shadow system.
  // Depth is expressed through tone, not elevation.
  bg:          '#F8F7F4',  // legacy alias — prefer `surface`
  surface:     '#F8F7F4',  // page background (was #FFFFFF)
  surfaceSoft: '#F2F0EC',  // cards, list rows, input fills
  surfaceAlt:  '#F2F0EC',  // legacy alias — maps to surfaceSoft for compatibility
  surfaceMute: '#FAFAF8',  // legacy alias — retained for compatibility
  surfaceDeep: '#E8E5DF',  // sheets, cart summary panel, bottom sheet backdrops

  // ── Ink (text + iconography) ───────────────────────────────────────────────
  ink1: '#111111',  // primary — headings, active icons
  ink2: '#2E2E2E',  // secondary text
  ink3: '#6B6B6B',  // tertiary — captions, inactive icons, placeholders
  ink4: '#A8A8A8',  // quaternary — disabled, subtle meta (was #9A9A9A)
  ink5: '#C9C9C7',  // quinary — hairlines, skeleton base

  // ── Dividers ──────────────────────────────────────────────────────────────
  rule:       '#E2DED7',  // warm hairline dividers (premium register)
  line:       '#ECECEA',  // legacy alias — retained for compatibility
  lineStrong: '#DCDCD9',  // legacy alias — retained for compatibility

  // ── Semantic ──────────────────────────────────────────────────────────────
  // danger is desaturated — reserved for destructive actions only, not promos.
  // Discount badges and flash-deal chips must NOT use danger (see spec A7).
  danger:      '#C0394F',  // desaturated from #D7263D — destructive only
  success:     '#1F7A3A',
  warning:     '#B47914',
  info:        '#2454FF',

  dangerTint:  '#FAE9EC',
  successTint: '#E6F3EB',
  warningTint: '#F7EFDD',
  infoTint:    '#E7EDFF',

  // Semantic borders (used alongside tints)
  dangerBorder: '#F0C2C9',

  // ── Ratings ───────────────────────────────────────────────────────────────
  star: '#F5A623',
} as const;

// 4px base grid
export const Space = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,

  // Named density constants matching design tokens
  screenH:  20,  // horizontal screen edge padding (was 16 pre-premium)
  gapRow:   12,  // between list rows
  gapBlock: 20,  // between content blocks inside a card
  padCard:  20,  // inside cards (was 16 pre-premium)
  padTap:   12,  // inside tap targets
} as const;

export const Radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   18,
  pill: 999,
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
} as const;

export const FontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
};

// Line height multipliers — multiply by fontSize to get lineHeight in RN
export const LineHeight = {
  tight:  1.15,
  snug:   1.3,
  normal: 1.45,
} as const;

// RN shadow objects — cross-platform
// iOS: shadowColor/shadowOffset/shadowOpacity/shadowRadius
// Android: elevation
export const Shadow = {
  sm: Platform.select({
    ios: {
      shadowColor:   '#0A0A0A',
      shadowOffset:  { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius:  2,
    },
    android: { elevation: 1 },
    default: {},
  })!,

  md: Platform.select({
    ios: {
      shadowColor:   '#0A0A0A',
      shadowOffset:  { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius:  12,
    },
    android: { elevation: 3 },
    default: {},
  })!,

  lg: Platform.select({
    ios: {
      shadowColor:   '#0A0A0A',
      shadowOffset:  { width: 0, height: 12 },
      shadowOpacity: 0.10,
      shadowRadius:  32,
    },
    android: { elevation: 8 },
    default: {},
  })!,
} as const;

// Z-index ladder
export const ZIndex = {
  base:    0,
  raised:  1,
  overlay: 10,
  modal:   20,
  toast:   30,
} as const;
