// components/ui/Card.tsx
// Card reutilizable con variantes: elevated, bordered, flat, glass
// Press animation con Reanimated 4

import React from 'react'
import {
  View, TouchableOpacity, StyleSheet, ViewStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { colors, radius, spacing, shadows } from '../../lib/theme'

type CardVariant = 'elevated' | 'bordered' | 'flat' | 'glass'

interface CardProps {
  variant?: CardVariant
  padding?: number
  margin?: number
  radius?: number
  onPress?: () => void
  children: React.ReactNode
  style?: ViewStyle
  noPadding?: boolean
}

export function Card({
  variant = 'elevated',
  padding = spacing.lg,
  margin,
  radius: r,
  onPress,
  children,
  style,
  noPadding = false,
}: CardProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      if (onPress) {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 })
      }
    })
    .onFinalize(() => {
      if (onPress) {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 })
      }
    })

  const variantStyle = variantStyles[variant]

  const content = (
    <View
      style={[
        styles.base,
        variantStyle,
        !noPadding && { padding },
        r !== undefined && { borderRadius: r },
        margin !== undefined && { margin },
        style,
      ]}
    >
      {children}
    </View>
  )

  if (onPress) {
    return (
      <GestureDetector gesture={tapGesture}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
            {content}
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    )
  }

  return content
}

// ─── Estilos por variante ─────────────────────────────────

const variantStyles: Record<CardVariant, ViewStyle> = {
  elevated: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    ...shadows.medium,
  },
  bordered: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flat: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
  },
  glass: {
    backgroundColor: colors.glassWhite,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
}

// ─── Estilos base ─────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
})

export default Card
