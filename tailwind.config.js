/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Mirror existing design token system
        accent:       '#B25A3D',
        accentTint:   'rgba(178,90,61,0.07)',
        surface:      '#F8F7F4',
        surfaceSoft:  '#F2F0EC',
        surfaceDeep:  '#E8E5DF',
        ink1:         '#111111',
        ink2:         '#2E2E2E',
        ink3:         '#6B6B6B',
        ink4:         '#A8A8A8',
        ink5:         '#C9C9C7',
        rule:         '#E2DED7',
        danger:       '#C0394F',
        success:      '#1F7A3A',
        warning:      '#B47914',
        info:         '#2454FF',
        dangerTint:   '#FAE9EC',
        successTint:  '#E6F3EB',
        warningTint:  '#F7EFDD',
        infoTint:     '#E7EDFF',
        star:         '#F5A623',
      },
      fontFamily: {
        serif:      ['InstrumentSerif-Regular'],
        serifItalic: ['InstrumentSerif-Italic'],
        mono:       ['JetBrainsMono-Regular'],
      },
      borderRadius: {
        xs:   '4px',
        sm:   '8px',
        md:   '12px',
        lg:   '18px',
        pill: '999px',
      },
      spacing: {
        screenH: '20px',
      },
    },
  },
  plugins: [],
};
