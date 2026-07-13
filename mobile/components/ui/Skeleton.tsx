// components/ui/Skeleton.tsx
// Skeleton loading reutilizable con shimmer Reanimated 4

import React, { useEffect } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { radius } from '../../lib/theme'

type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  borderRadius,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3)

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 750, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(0.3, { duration: 750, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      false
    )
  }, [])

  const variantStyle = variantStyles[variant]

  return (
    <Animated.View
      style={[
        styles.base,
        variantStyle,
        width !== undefined && { width: width as any },
        height !== undefined && { height },
        borderRadius !== undefined && { borderRadius },
        animatedStyle,
        style,
      ]}
    />
  )
}

// ─── Pre-configuraciones por variante ─────────────────────

const variantStyles: Record<SkeletonVariant, ViewStyle> = {
  text: { height: 12, borderRadius: radius.xs },
  circle: { borderRadius: 999 },
  rect: { borderRadius: radius.md },
  card: { borderRadius: radius.xl },
}

// ─── Skeleton compuesto: Card ─────────────────────────────

interface SkeletonCardProps {
  width?: number
}

export function SkeletonCard({ width = 170 }: SkeletonCardProps) {
  return (
    <Skeleton variant="card" width={width} height={200} />
  )
}

// ─── Skeleton compuesto: Product Card ─────────────────────

export function SkeletonProductCard() {
  return (
    <Skeleton variant="card" height={240} />
  )
}

// ─── Skeleton compuesto: List Item ────────────────────────

export function SkeletonListItem() {
  return (
    <Skeleton variant="rect" height={90} />
  )
}

// ─── Estilos base ─────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#e2e8f0',
  },
})

export default Skeleton
