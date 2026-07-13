// components/ui/Button.tsx
// Botón reutilizable con variantes y press animation Reanimated 4

import React from 'react'
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle, View,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { colors, typography, radius, spacing, shadows } from '../../lib/theme'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'icon'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  label?: string
  icon?: keyof typeof Ionicons.glyphMap
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  onPress?: () => void
  style?: ViewStyle
  textStyle?: TextStyle
  gradient?: [string, string]
}

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  style,
  textStyle,
  gradient,
}: ButtonProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      if (!disabled && !loading) {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 })
      }
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 })
    })

  const isDisabled = disabled || loading
  const sizeStyles = sizeConfig[size]
  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 20 : 17

  const iconEl = icon ? (
    <Ionicons
      name={icon}
      size={iconSize}
      color={iconColor[variant]}
      style={iconPosition === 'left' ? { marginRight: spacing.sm } : { marginLeft: spacing.sm }}
    />
  ) : null

  const content = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={loaderColor[variant]} style={{ marginRight: label ? spacing.sm : 0 }} />
      ) : (
        iconPosition === 'left' && iconEl
      )}
      {label ? (
        <Text style={[styles.text, sizeStyles.text, textStyles[variant], textStyle]}>
          {label}
        </Text>
      ) : null}
      {!loading && iconPosition === 'right' && iconEl}
    </>
  )

  // Ghost y outline
  if (variant === 'ghost' || variant === 'outline') {
    const baseStyle = variant === 'ghost' ? styles.ghost : styles.outline
    return (
      <GestureDetector gesture={tapGesture}>
        <Animated.View style={[animatedStyle, fullWidth && { width: '100%' }]}>
          <TouchableOpacity
            style={[
              styles.base,
              sizeStyles.container,
              baseStyle,
              fullWidth && styles.fullWidth,
              isDisabled && styles.disabled,
              style,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={isDisabled}
          >
            {content}
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    )
  }

  // Primary, secondary, danger usan LinearGradient
  const grad = gradient || gradientMap[variant]

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[animatedStyle, fullWidth && { width: '100%' }]}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.88}
          disabled={isDisabled}
          style={[
            fullWidth && styles.fullWidth,
            isDisabled && styles.disabled,
            variant === 'primary' && shadows.green,
            variant === 'danger' && (shadows as any).colored('#ef4444', 0.2),
            style,
          ]}
        >
          <LinearGradient
            colors={isDisabled ? ['#9ca3af', '#9ca3af'] : grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.base, sizeStyles.container, styles.borderRadius]}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  )
}

// ─── Configuraciones por variante ─────────────────────────

const textStyles: Record<ButtonVariant, TextStyle> = {
  primary: { color: colors.textInverse, ...typography.bodyMedium },
  secondary: { color: colors.textInverse, ...typography.bodyMedium },
  outline: { color: colors.primary, ...typography.bodyMedium },
  ghost: { color: colors.primary, ...typography.bodyMedium },
  danger: { color: colors.textInverse, ...typography.bodyMedium },
  icon: { color: colors.textInverse, ...typography.bodyMedium },
}

const iconColor: Record<ButtonVariant, string> = {
  primary: colors.textInverse,
  secondary: colors.textInverse,
  outline: colors.primary,
  ghost: colors.primary,
  danger: colors.textInverse,
  icon: colors.textInverse,
}

const loaderColor: Record<ButtonVariant, string> = {
  primary: colors.textInverse,
  secondary: colors.textInverse,
  outline: colors.primary,
  ghost: colors.primary,
  danger: colors.textInverse,
  icon: colors.textInverse,
}

const gradientMap: Record<string, [string, string]> = {
  primary: [colors.primary, colors.primaryDark || '#0d5c35'],
  secondary: ['#3b82f6', '#2563eb'],
  danger: ['#ef4444', '#dc2626'],
  icon: [colors.primary, colors.primaryDark || '#0d5c35'],
  outline: ['transparent', 'transparent'],
  ghost: ['transparent', 'transparent'],
}

const sizeConfig: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: 10, paddingHorizontal: spacing.lg, minHeight: 40 },
    text: { fontSize: 13 },
  },
  md: {
    container: { paddingVertical: 14, paddingHorizontal: spacing.xl, minHeight: 50 },
    text: { fontSize: 15 },
  },
  lg: {
    container: { paddingVertical: 16, paddingHorizontal: spacing.xxl, minHeight: 56 },
    text: { fontSize: 16 },
  },
}

// ─── Estilos ──────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  borderRadius: {
    borderRadius: radius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.lg,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: radius.lg,
  },
  disabled: {
    opacity: 0.5,
  },
})

export default Button
