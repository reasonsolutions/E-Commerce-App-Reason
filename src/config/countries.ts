export const COUNTRY_OPTIONS = [
  { label: 'Mauritius', dialCode: '+230', code: 230 },
  { label: 'India',     dialCode: '+91',  code: 91  },
] as const;

export type CountryOption = typeof COUNTRY_OPTIONS[number];

export const dialCodeForCountry = (code: number | undefined): string =>
  COUNTRY_OPTIONS.find(c => c.code === code)?.dialCode ?? '';
