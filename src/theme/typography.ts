import { TextStyle } from 'react-native';
import { Colors, FontSize, FontWeight, LineHeight } from './tokens';

// Pre-built TextStyle presets for consistent type hierarchy.
// All letter-spacing values are in points (RN uses points, not em).
// Conversions from design: -0.02em @ 15px = -0.3pt, -0.03em @ 32px = -0.96pt.

export const Type = {
  // Hero headlines — login, order success, hero banner
  display: {
    fontSize:      FontSize['2xl'],
    fontWeight:    FontWeight.bold,
    letterSpacing: -0.6,
    lineHeight:    FontSize['2xl'] * LineHeight.tight,
    color:         Colors.ink1,
  } satisfies TextStyle,

  // Screen section titles
  title: {
    fontSize:      FontSize.xl,
    fontWeight:    FontWeight.semibold,
    letterSpacing: -0.4,
    lineHeight:    FontSize.xl * LineHeight.snug,
    color:         Colors.ink1,
  } satisfies TextStyle,

  // Screen header title, card headings
  heading: {
    fontSize:      FontSize.md,
    fontWeight:    FontWeight.semibold,
    letterSpacing: -0.2,
    lineHeight:    FontSize.md * LineHeight.snug,
    color:         Colors.ink1,
  } satisfies TextStyle,

  // Primary body text
  body: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * LineHeight.normal,
    color:      Colors.ink1,
  } satisfies TextStyle,

  bodyStrong: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.base * LineHeight.normal,
    color:      Colors.ink1,
  } satisfies TextStyle,

  // Secondary body — descriptions, metadata
  caption: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.normal,
    color:      Colors.ink3,
  } satisfies TextStyle,

  captionStrong: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    color:      Colors.ink3,
  } satisfies TextStyle,

  // Uppercase micro-labels — brand names, category kickers, field labels
  label: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.semibold,
    letterSpacing: 0.6,
    color:         Colors.ink3,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  // Price figures — prominent, tabular rhythm
  price: {
    fontSize:      FontSize.lg,
    fontWeight:    FontWeight.bold,
    letterSpacing: -0.4,
    color:         Colors.ink1,
    // fontVariant: ['tabular-nums'] — iOS only, omit for cross-platform safety
  } satisfies TextStyle,

  // Tab bar labels
  tab: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.medium,
    color:      Colors.ink3,
  } satisfies TextStyle,
} as const;
