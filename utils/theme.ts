/**
 * Design tokens — mirrors `DESIGN_SYSTEM.md`.
 *
 * Scope intentionally small for issue #8 (auth screens only). Future issues
 * may migrate to NativeWind as recommended in the design system; this file
 * keeps consumption typed and centralized in the meantime.
 */

export const colors = {
  primary: '#059669',
  primaryBright: '#34D399',
  primaryLight: '#ECFDF5',
  primaryMid: '#D1FAE5',
  ai: '#7C3AED',
  aiDeep: '#6D28D9',
  aiLight: '#F5F3FF',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  dangerMid: '#FEE2E2',
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  cardSolid: '#F2F3F5',
  border: 'rgba(0,0,0,0.06)',
  borderStrong: 'rgba(0,0,0,0.10)',
  text: '#111827',
  text2: '#6B7280',
  text3: '#9CA3AF',
  text4: '#D1D5DB',
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
