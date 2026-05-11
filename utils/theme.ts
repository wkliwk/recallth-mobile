// B·Health design system — warm cream + orange accent (#ed8547)
// Source: design/proto-shared.jsx

export const colors = {
  primary: '#ed8547',
  primaryBright: '#d9772e',
  primaryLight: '#fdf0e6',
  primaryMid: '#fce8d0',
  // ai tokens remapped to orange (preserves existing consumers)
  ai: '#ed8547',
  aiDeep: '#c66a2e',
  aiLight: '#fdf0e6',
  aiMid: '#fce8d0',
  // evidence bar colors
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
} as const;

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
