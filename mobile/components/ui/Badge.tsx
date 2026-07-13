// components/ui/Badge.tsx
// Badge reutilizable para estados, categorías, roles

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, typography, radius, spacing } from '../../lib/theme'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'gold' | 'purple' | 'default'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  label: string
  dot?: boolean
  icon?: string
  style?: any
}

export function Badge({
  variant = 'default',
  size = 'md',
  label,
  dot = false,
  icon,
  style,
}: BadgeProps) {
  const config = variantConfig[variant]
  const sz = sizeConfig[size]

  return (
    <View style={[styles.container, sz.container, { backgroundColor: config.bg }, style]}>
      {dot && (
        <View style={[styles.dot, { backgroundColor: config.text }]} />
      )}
      {icon ? <Text style={[{ fontSize: sz.iconSize }]}>{icon}</Text> : null}
      <Text style={[styles.text, { color: config.text, fontSize: sz.fontSize }]}>
        {label}
      </Text>
    </View>
  )
}

// ─── Configuración por variante ───────────────────────────

const variantConfig: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.successTint, text: colors.primary },
  warning: { bg: colors.warningTint, text: colors.warning },
  error: { bg: colors.errorTint, text: colors.error },
  info: { bg: colors.blueTint, text: colors.blue },
  gold: { bg: colors.goldTint, text: colors.gold },
  purple: { bg: colors.purpleTint, text: colors.purple },
  default: { bg: colors.surfaceSecondary, text: colors.textTertiary },
}

// ─── Configuración por tamaño ─────────────────────────────

const sizeConfig: Record<BadgeSize, { container: any; fontSize: number; iconSize: number }> = {
  sm: {
    container: { paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
    fontSize: 10,
    iconSize: 10,
  },
  md: {
    container: { paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
    fontSize: 11,
    iconSize: 11,
  },
  lg: {
    container: { paddingHorizontal: 14, paddingVertical: 6, gap: 6 },
    fontSize: 13,
    iconSize: 13,
  },
}

// ─── Estilos ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    letterSpacing: 0.3,
    fontWeight: '700',
  },
})

export default Badge
