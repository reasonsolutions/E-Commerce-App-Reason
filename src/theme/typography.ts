import { TextStyle } from 'react-native';
import { Colors, FontSize, FontWeight, LineHeight } from './tokens';
import { FontFamily } from './fonts';

// Pre-built TextStyle presets for the premium type hierarchy.
//
// Three families:
//   Serif  (InstrumentSerif)  — display, title, heading, price roles
//   Mono   (JetBrainsMono)   — label, micro-meta, order numbers
//   Sans   (system default)  — body, caption, tab, UI copy
//
// All letter-spacing values are in points (RN uses points, not em).
// Conversions: -0.02em @ 15px = -0.3pt; 0.14em @ 12px = 1.68pt ≈ 1.7.
//
// Roles marked ← UPDATED carry a changed fontSize, fontFamily, or weight vs
// the pre-premium version. OrderSuccessScreen spreads title/body/label/caption
// — it will inherit the new scale automatically (intended Phase 1 behaviour).

export const Type = {
  // ── Serif roles ────────────────────────────────────────────────────────────

  // Hero headlines — Login wordmark, OrderSuccess, hero banner copy.
  // ← UPDATED: 28 → 40, added serif family, tighter leading.
  display: {
    fontFamily:    FontFamily.serif,
    fontSize:      40,
    fontWeight:    FontWeight.regular,  // Instrument Serif reads well at regular weight
    letterSpacing: -0.8,
    lineHeight:    40 * 1.05,
    color:         Colors.ink1,
  } satisfies TextStyle,

  // Screen section titles, sheet headers.
  // ← UPDATED: 24 → 28, added serif family.
  title: {
    fontFamily:    FontFamily.serif,
    fontSize:      FontSize['2xl'],     // 28
    fontWeight:    FontWeight.regular,
    letterSpacing: -0.5,
    lineHeight:    FontSize['2xl'] * 1.1,
    color:         Colors.ink1,
  } satisfies TextStyle,

  // Product names, card titles, screen sub-headers.
  // ← UPDATED: 17 → 22, added serif family.
  heading: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    fontWeight:    FontWeight.regular,
    letterSpacing: -0.3,
    lineHeight:    22 * 1.2,
    color:         Colors.ink1,
  } satisfies TextStyle,

  // Current price — prominent serif, tabular feel.
  // ← UPDATED: size pinned to 22, added serif family. Replaces the sans bold price.
  price: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    fontWeight:    FontWeight.regular,
    letterSpacing: -0.4,
    lineHeight:    22 * 1.1,
    color:         Colors.ink1,
  } satisfies TextStyle,

  // Cart total, ProductScreen hero price — large serif figure.
  // NEW role (did not exist pre-premium).
  priceLarge: {
    fontFamily:    FontFamily.serif,
    fontSize:      32,
    fontWeight:    FontWeight.regular,
    letterSpacing: -0.6,
    lineHeight:    32 * 1.0,
    color:         Colors.ink1,
  } satisfies TextStyle,

  // ── Sans roles ─────────────────────────────────────────────────────────────

  // Primary body text — 16/1.5 per spec (was 15/1.45).
  // ← UPDATED: 15 → 16, lineHeight ratio 1.45 → 1.5.
  body: {
    fontSize:   16,
    fontWeight: FontWeight.regular,
    lineHeight: 16 * 1.5,
    color:      Colors.ink1,
  } satisfies TextStyle,

  // Emphasized body — same metrics, medium weight.
  // ← UPDATED: fontSize 15 → 16 to match body.
  bodyStrong: {
    fontSize:   16,
    fontWeight: FontWeight.medium,
    lineHeight: 16 * 1.5,
    color:      Colors.ink1,
  } satisfies TextStyle,

  // Secondary body — descriptions, metadata, captions.
  // Unchanged metrics; color updated to ink3.
  caption: {
    fontSize:   FontSize.sm,   // 13
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * 1.4,
    color:      Colors.ink3,
  } satisfies TextStyle,

  captionStrong: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.sm * 1.4,
    color:      Colors.ink3,
  } satisfies TextStyle,

  // Tab bar labels.
  // ← UPDATED: added fontWeight medium (was unspecified → regular).
  tab: {
    fontSize:   FontSize.xs,   // 11
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xs * 1.2,
    color:      Colors.ink3,
  } satisfies TextStyle,

  // ── Mono roles ─────────────────────────────────────────────────────────────

  // Brand micro-labels, category kickers, field labels, order numbers.
  // ← UPDATED: added mono fontFamily; uppercase + 0.14em letter-spacing.
  // 0.14em @ 12px = 1.68pt ≈ 1.7.
  label: {
    fontFamily:    FontFamily.mono,
    fontSize:      FontSize.xs,   // 11 — spec says 12; FontSize.xs is 11, nearest token
    fontWeight:    FontWeight.regular,
    letterSpacing: 1.7,
    lineHeight:    FontSize.xs * 1.2,
    color:         Colors.ink3,
    textTransform: 'uppercase',
  } satisfies TextStyle,
} as const;
