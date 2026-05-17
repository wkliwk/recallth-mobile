// B·Health design system — warm cream + orange accent (#ed8547)
// Source: design/proto-shared.jsx

export type ColorPalette = {
  primary: string;
  primaryBright: string;
  primaryLight: string;
  primaryMid: string;
  ai: string;
  aiDeep: string;
  aiLight: string;
  aiMid: string;
  ok: string;
  okLight: string;
  warning: string;
  warningLight: string;
  warningMid: string;
  danger: string;
  dangerLight: string;
  dangerMid: string;
  info: string;
  infoLight: string;
  bg: string;
  surface: string;
  cardSolid: string;
  border: string;
  borderStrong: string;
  dim: string;
  text: string;
  text2: string;
  text3: string;
  text4: string;
};

export const lightColors: ColorPalette = {
  primary: '#ed8547',
  primaryBright: '#d9772e',
  primaryLight: '#fdf0e6',
  primaryMid: '#fce8d0',
  ai: '#ed8547',
  aiDeep: '#c66a2e',
  aiLight: '#fdf0e6',
  aiMid: '#fce8d0',
  ok: '#2d9d5a',
  okLight: '#e8f7ee',
  warning: '#c4880f',
  warningLight: '#fef6e0',
  warningMid: '#fef3c7',
  danger: '#b91c1c',
  dangerLight: '#fde8e8',
  dangerMid: '#fee2e2',
  info: '#2563EB',
  infoLight: '#EFF6FF',
  bg: '#f5f5f0',
  surface: '#ffffff',
  cardSolid: '#f0ede4',
  border: '#e7e5dc',
  borderStrong: '#d6d3c4',
  dim: '#a8a8a8',
  text: '#1c1c1e',
  text2: '#6b6b70',
  text3: '#a8a8a8',
  text4: '#d6d3c4',
};

export const darkColors: ColorPalette = {
  primary: '#f5975a',
  primaryBright: '#e8852a',
  primaryLight: '#2c1f14',
  primaryMid: '#3a2518',
  ai: '#f5975a',
  aiDeep: '#e8852a',
  aiLight: '#2c1f14',
  aiMid: '#3a2518',
  ok: '#3dba6e',
  okLight: '#14301f',
  warning: '#e0a020',
  warningLight: '#2e240a',
  warningMid: '#2a2008',
  danger: '#ef4444',
  dangerLight: '#300f0f',
  dangerMid: '#3a1111',
  info: '#60a5fa',
  infoLight: '#0f1e35',
  bg: '#0f0f0f',
  surface: '#1a1a1a',
  cardSolid: '#242424',
  border: '#2e2e2e',
  borderStrong: '#3a3a3a',
  dim: '#5a5a5a',
  text: '#f0f0f0',
  text2: '#a0a0a8',
  text3: '#606068',
  text4: '#3a3a3a',
};

/** Static light palette — for use in legacy StyleSheet.create() calls and non-reactive contexts. */
export const colors: ColorPalette = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenPad: 20,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
  full: 9999,
} as const;

export const typography = {
  pageTitle: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const },
  sectionTitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: '500' as const },
  cta: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
} as const;
