// Font family name constants for the premium type system.
//
// ── Installation required ────────────────────────────────────────────────────
// These constants reference fonts that must be installed before the serif and
// mono roles render visually. The token layer is correct; drop the files and
// rebuild to activate.
//
// Instrument Serif (editorial serif — Type.display / title / heading / price)
//   Source:  https://fonts.google.com/specimen/Instrument+Serif  (OFL license, free)
//   Files needed:
//     InstrumentSerif-Regular.ttf
//     InstrumentSerif-Italic.ttf
//   Drop into:
//     iOS:     ios/EcommerceApp/Fonts/   and register in Info.plist under UIAppFonts
//     Android: android/app/src/main/assets/fonts/
//   After dropping files:  npx react-native run-ios  (rebuilds; Metro alone is not enough)
//
// JetBrains Mono (tabular mono — Type.label / micro-meta)
//   Source:  https://www.jetbrains.com/lp/mono/  (OFL license, free)
//   Files needed:
//     JetBrainsMono-Regular.ttf
//     JetBrainsMono-Medium.ttf
//   Same drop locations and Info.plist registration as above.
//
// ── Fallback behavior ────────────────────────────────────────────────────────
// React Native silently falls back to the platform system font if a fontFamily
// name is not found. No crash; the serif/mono roles render in the system sans
// until the font files are installed and the app is rebuilt.
//
// ── iOS Info.plist entry (add inside the root <dict>) ────────────────────────
// <key>UIAppFonts</key>
// <array>
//   <string>InstrumentSerif-Regular.ttf</string>
//   <string>InstrumentSerif-Italic.ttf</string>
//   <string>JetBrainsMono-Regular.ttf</string>
//   <string>JetBrainsMono-Medium.ttf</string>
// </array>

export const FontFamily = {
  // Editorial serif — headlines, product names, prices.
  serif:      'InstrumentSerif-Regular',
  serifItalic: 'InstrumentSerif-Italic',

  // Tabular mono — brand micro-labels, order numbers, timestamps.
  mono:       'JetBrainsMono-Regular',
  monoMedium: 'JetBrainsMono-Medium',

  // System sans — body copy, UI text, captions. No installation required.
  // React Native uses the platform default when fontFamily is undefined.
  sans: undefined,
} as const;
