// hooks/useAnimations.ts
// Hooks de animación reutilizables con Reanimated 4

import { useCallback } from 'react'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated'

// ─── SPRING PRESS (para cards, botones) ───────────────────

interface UsePressSpringConfig {
  scale?: number
  springDamping?: number
  springStiffness?: number
}

export function usePressSpring(config: UsePressSpringConfig = {}) {
  const {
    scale = 0.96,
    springDamping = 15,
    springStiffness = 150,
  } = config

  const scaleAnim = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }))

  const pressIn = useCallback(() => {
    scaleAnim.value = withSpring(scale, {
      damping: springDamping,
      stiffness: springStiffness,
    })
  }, [scaleAnim, scale, springDamping, springStiffness])

  const pressOut = useCallback(() => {
    scaleAnim.value = withSpring(1, {
      damping: springDamping,
      stiffness: springStiffness,
    })
  }, [scaleAnim, springDamping, springStiffness])

  return { animatedStyle, pressIn, pressOut, scaleAnim }
}

// ─── FADE IN / OUT ────────────────────────────────────────

interface UseFadeInConfig {
  duration?: number
  initialOpacity?: number
}

export function useFadeIn(config: UseFadeInConfig = {}) {
  const { duration = 400, initialOpacity = 0 } = config

  const opacity = useSharedValue(initialOpacity)

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const start = useCallback(() => {
    opacity.value = withTiming(1, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
  }, [opacity, duration])

  return { animatedStyle, start, opacity }
}

// ─── SLIDE IN ─────────────────────────────────────────────

interface UseSlideInConfig {
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  duration?: number
}

export function useSlideIn(config: UseSlideInConfig = {}) {
  const {
    direction = 'up',
    distance = 30,
    duration = 500,
  } = config

  const translateX = useSharedValue(direction === 'left' ? -distance : direction === 'right' ? distance : 0)
  const translateY = useSharedValue(direction === 'up' ? distance : direction === 'down' ? -distance : 0)
  const opacity = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }))

  const start = useCallback(() => {
    translateX.value = withTiming(0, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    translateY.value = withTiming(0, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    opacity.value = withTiming(1, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
  }, [translateX, translateY, opacity, duration])

  return { animatedStyle, start }
}

// ─── SCALE IN (para modales, badges) ──────────────────────

interface UseScaleInConfig {
  from?: number
  to?: number
  duration?: number
  spring?: boolean
}

export function useScaleIn(config: UseScaleInConfig = {}) {
  const { from = 0.5, to = 1, duration = 400, spring = true } = config

  const scale = useSharedValue(from)
  const opacity = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const start = useCallback(() => {
    if (spring) {
      scale.value = withSpring(to, { damping: 12, stiffness: 150 })
    } else {
      scale.value = withTiming(to, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    }
    opacity.value = withTiming(1, { duration: duration * 0.6, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
  }, [scale, opacity, to, duration, spring])

  return { animatedStyle, start }
}

// ─── PULSE (para badges, icons) ───────────────────────────

interface UsePulseConfig {
  minScale?: number
  maxScale?: number
  duration?: number
}

export function usePulse(config: UsePulseConfig = {}) {
  const { minScale = 1, maxScale = 1.15, duration = 1200 } = config

  const scale = useSharedValue(minScale)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const start = useCallback(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: duration / 2, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(minScale, { duration: duration / 2, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      false
    )
  }, [scale, minScale, maxScale, duration])

  const stop = useCallback(() => {
    scale.value = withTiming(minScale, { duration: 300 })
  }, [scale, minScale])

  return { animatedStyle, start, stop }
}

// ─── SHIMMER (para skeleton loading) ──────────────────────

interface UseShimmerConfig {
  duration?: number
  minOpacity?: number
  maxOpacity?: number
}

export function useShimmer(config: UseShimmerConfig = {}) {
  const { duration = 1000, minOpacity = 0.3, maxOpacity = 0.7 } = config

  const opacity = useSharedValue(minOpacity)

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const start = useCallback(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(maxOpacity, { duration: duration / 2, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(minOpacity, { duration: duration / 2, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      false
    )
  }, [opacity, duration, minOpacity, maxOpacity])

  return { animatedStyle, start }
}
