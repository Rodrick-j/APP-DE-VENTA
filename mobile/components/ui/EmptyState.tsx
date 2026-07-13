// components/ui/EmptyState.tsx
// Estado vacío reutilizable con animación de entrada Reanimated 4

import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { colors, typography, spacing } from '../../lib/theme'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap
  emoji?: string
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  style?: ViewStyle
}

export function EmptyState({
  icon,
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const iconScale = useSharedValue(0.5)
  const iconOpacity = useSharedValue(0)
  const textTranslateY = useSharedValue(20)
  const textOpacity = useSharedValue(0)

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }))

  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }))

  useEffect(() => {
    iconScale.value = withSpring(1, { damping: 12, stiffness: 150 })
    iconOpacity.value = withTiming(1, { duration: 400 })
    // Text animation with slight delay using callback
    setTimeout(() => {
      textTranslateY.value = withTiming(0, { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      textOpacity.value = withTiming(1, { duration: 500 })
    }, 150)
  }, [])

  return (
    <View style={[styles.container, style]}>
      {icon ? (
        <Animated.View style={[styles.iconCircle, iconAnimatedStyle]}>
          <Ionicons name={icon} size={48} color={colors.textMuted} />
        </Animated.View>
      ) : emoji ? (
        <Animated.Text style={[styles.emoji, iconAnimatedStyle]}>{emoji}</Animated.Text>
      ) : null}
      <Animated.View style={textAnimatedStyle}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </Animated.View>
      {actionLabel && onAction ? (
        <Animated.View style={[{ marginTop: spacing.lg }, textAnimatedStyle]}>
          <Button
            variant="outline"
            label={actionLabel}
            onPress={onAction}
            size="sm"
          />
        </Animated.View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
    minHeight: 280,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
  },
})

export default EmptyState
