import { Platform } from 'react-native';

export const Colors = {
  // Accent
  accent:      '#0A0A0A',
  accentInk:   '#FFFFFF',
  accentTint:  'rgba(10, 10, 10, 0.06)',

  // Surfaces
  bg:          '#FFFFFF',
  surface:     '#FFFFFF',
  surfaceAlt:  '#F5F5F3',
  surfaceMute: '#FAFAF8',
  surfaceDeep: '#0E0E0E',

  // Ink (text + iconography)
  ink1: '#0A0A0A',
  ink2: '#2E2E2E',
  ink3: '#6B6B6B',
  ink4: '#9A9A9A',
  ink5: '#C9C9C7',

  // Lines
  line:       '#ECECEA',
  lineStrong: '#DCDCD9',

  // Semantic
  danger:      '#D7263D',
  success:     '#1F7A3A',
  warning:     '#B47914',
  info:        '#2454FF',

  dangerTint:  '#FBE9EC',
  successTint: '#E6F3EB',
  warningTint: '#F7EFDD',
  infoTint:    '#E7EDFF',

  // Semantic borders (used alongside tints)
  dangerBorder:  '#F4C5CC',

  // Ratings
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
  screenH: 16,  // horizontal screen edge padding
  gapRow:  12,  // between list rows
  padCard: 16,  // inside cards
  padTap:  12,  // inside tap targets
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
