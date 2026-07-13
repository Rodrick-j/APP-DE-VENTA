// components/ui/SectionHeader.tsx
// Encabezado de sección reutilizable con título y acción

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, typography, spacing } from '../../lib/theme'

interface SectionHeaderProps {
  title: string
  actionLabel?: string
  onAction?: () => void
  icon?: keyof typeof Ionicons.glyphMap
  style?: ViewStyle
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  icon,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleRow}>
        {icon ? <Ionicons name={icon} size={16} color={colors.primary} style={styles.icon} /> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  action: {
    ...typography.captionBold,
    color: colors.primary,
  },
})

export default SectionHeader
