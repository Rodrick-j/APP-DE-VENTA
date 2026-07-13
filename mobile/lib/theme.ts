// lib/theme.ts
// Sistema de diseño centralizado — Consume lo Nuestro
// Todos los colores, tipografía, espaciado y sombras en un solo lugar.

import { Platform, TextStyle, ViewStyle, ShadowStyleIOS } from 'react-native'

// ─── COLORES ──────────────────────────────────────────────
export const colors = {
  // Primario
  primary: '#1a7a4a',
  primaryDark: '#0d5c35',
  primaryDeep: '#0a4f2e',
  primaryLight: '#22a85f',
  primaryTint: '#f0fdf4',
  primaryMuted: 'rgba(26,122,74,0.12)',

  // Secundario
  blue: '#3b82f6',
  blueDark: '#2563eb',
  blueTint: '#eff6ff',
  purple: '#8b5cf6',
  purpleTint: '#f5f3ff',

  // Acento
  gold: '#f59e0b',
  goldTint: '#fffbeb',
  error: '#ef4444',
  errorTint: '#fef2f2',
  errorDark: '#dc2626',
  success: '#10b981',
  successTint: '#ecfdf5',
  warning: '#d97706',
  warningTint: '#fffbeb',

  // Superficies
  white: '#ffffff',
  surfacePrimary: '#f8fafc',
  surfaceSecondary: '#f1f5f9',
  surfaceTertiary: '#e2e8f0',
  surfaceGray: '#f3f4f6',
  surfaceDark: '#111827',

  // Texto
  textPrimary: '#111827',
  textSecondary: '#374151',
  textTertiary: '#6b7280',
  textMuted: '#9ca3af',
  textPlaceholder: '#c4c9d4',
  textInverse: '#ffffff',
  textLink: '#3b82f6',

  // Bordes
  border: '#e5e7eb',
  borderLight: '#e2e8f0',
  borderFocus: '#1a7a4a',

  // Plataformas
  whatsapp: '#25d366',
  facebook: '#1877f2',
  google: '#4285F4',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.32)',
  glassWhite: 'rgba(255,255,255,0.1)',
  glassWhiteMed: 'rgba(255,255,255,0.18)',
  glassWhiteHigh: 'rgba(255,255,255,0.85)',
} as const

// ─── TIPOGRAFÍA ───────────────────────────────────────────
const fontFamily = Platform.select({
  ios: 'Inter',
  android: 'Inter',
  default: 'Inter',
})

export const typography: Record<string, TextStyle> = {
  hero: { fontFamily, fontSize: 30, fontWeight: '900', letterSpacing: -0.5, lineHeight: 36 },
  h1: { fontFamily, fontSize: 24, fontWeight: '800', letterSpacing: -0.3, lineHeight: 30 },
  h2: { fontFamily, fontSize: 20, fontWeight: '700', letterSpacing: -0.2, lineHeight: 26 },
  h3: { fontFamily, fontSize: 17, fontWeight: '700', letterSpacing: 0, lineHeight: 22 },
  h4: { fontFamily, fontSize: 15, fontWeight: '700', letterSpacing: 0, lineHeight: 20 },
  bodyLarge: { fontFamily, fontSize: 16, fontWeight: '400', lineHeight: 24 },
  body: { fontFamily, fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyMedium: { fontFamily, fontSize: 15, fontWeight: '600', lineHeight: 22 },
  bodyBold: { fontFamily, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  caption: { fontFamily, fontSize: 13, fontWeight: '400', lineHeight: 18 },
  captionMedium: { fontFamily, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  captionBold: { fontFamily, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  label: { fontFamily, fontSize: 11, fontWeight: '700', letterSpacing: 1, lineHeight: 16 },
  small: { fontFamily, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, lineHeight: 14 },
  tiny: { fontFamily, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, lineHeight: 12 },
} as const

// ─── ESPACIADO ────────────────────────────────────────────
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
} as const

// ─── BORDER RADIUS ────────────────────────────────────────
export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const

// ─── SOMBRAS ──────────────────────────────────────────────
type Shadow = ShadowStyleIOS & { elevation: number }

const androidElevation = (level: 'light' | 'medium' | 'heavy'): number => {
  switch (level) {
    case 'light': return 2
    case 'medium': return 5
    case 'heavy': return 10
  }
}

export const shadows: Record<string, Shadow> = {
  none: Platform.OS === 'ios'
    ? { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 }
    : { elevation: 0 },

  light: Platform.OS === 'ios'
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: androidElevation('light') }
    : { elevation: androidElevation('light') },

  medium: Platform.OS === 'ios'
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: androidElevation('medium') }
    : { elevation: androidElevation('medium') },

  heavy: Platform.OS === 'ios'
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: androidElevation('heavy') }
    : { elevation: androidElevation('heavy') },

  green: Platform.OS === 'ios'
    ? { shadowColor: '#1a7a4a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 6 }
    : { elevation: 6 },

  colored: ((color: string, opacity = 0.15): any => {
    return Platform.OS === 'ios'
      ? { shadowColor: color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: opacity, shadowRadius: 14, elevation: 6 }
      : { elevation: 6 }
  }) as any,
}

// ─── GRADIENTES ───────────────────────────────────────────
export const gradients = {
  hero: ['#0a4f2e', '#1a7a4a'] as [string, string],
  heroFull: ['#0a4f2e', '#12703f', '#1a7a4a', '#1e9455'] as [string, string, string, string],
  headerProfile: ['#0a4f2e', '#1a7a4a', '#22a85f'] as [string, string, string],
  blue: ['#1e3a5f', '#2563eb'] as [string, string],
  purple: ['#4a1942', '#7c3aed'] as [string, string],
  greenButton: ['#1a7a4a', '#0d5c35'] as [string, string],
  greenLight: ['#22a85f', '#1a7a4a'] as [string, string],
  danger: ['#dc2626', '#ef4444'] as [string, string],
  heroBlue: ['#1e3a5f', '#3b82f6'] as [string, string],
  heroPurple: ['#4a1942', '#7c3aed'] as [string, string],
} as const

// ─── UTILIDADES ───────────────────────────────────────────
export const utils = {
  /** Flex container centrado */
  center: { justifyContent: 'center' as const, alignItems: 'center' as const },
  /** Flex row centrado */
  row: { flexDirection: 'row' as const, alignItems: 'center' as const },
  /** Flex row space-between */
  rowBetween: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  /** Absolute fill */
  absoluteFill: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 },
  /** Padding horizontal de pantalla */
  screenPadding: { paddingHorizontal: spacing.lg },
  /** Padding horizontal reducido */
  screenPaddingSmall: { paddingHorizontal: spacing.md },
}

// ─── EXPORT DEFAULT ───────────────────────────────────────
const theme = { colors, typography, spacing, radius, shadows, gradients, utils }
export default theme
