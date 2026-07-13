// components/ui/Avatar.tsx
// Avatar reutilizable con ring, online dot, fallback de iniciales

import React from 'react'
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native'
import { colors, typography, radius } from '../../lib/theme'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  size?: AvatarSize
  imageUrl?: string | null
  name?: string
  ring?: boolean
  online?: boolean
  style?: ViewStyle
}

const sizeMap: Record<AvatarSize, { container: number; text: number; ring: number; dot: number }> = {
  xs: { container: 28, text: 12, ring: 32, dot: 8 },
  sm: { container: 36, text: 14, ring: 40, dot: 10 },
  md: { container: 44, text: 18, ring: 50, dot: 12 },
  lg: { container: 64, text: 26, ring: 72, dot: 14 },
  xl: { container: 94, text: 38, ring: 104, dot: 16 },
}

export function Avatar({
  size = 'md',
  imageUrl,
  name,
  ring = false,
  online = false,
  style,
}: AvatarProps) {
  const s = sizeMap[size]
  const initials = (name ?? '?')[0].toUpperCase()

  const containerStyle: ViewStyle = {
    width: ring ? s.ring : s.container,
    height: ring ? s.ring : s.container,
    borderRadius: ring ? s.ring / 2 : s.container / 2,
  }

  const innerStyle: ViewStyle = {
    width: s.container,
    height: s.container,
    borderRadius: s.container / 2,
  }

  return (
    <View style={[containerStyle, ring && styles.ring, style]}>
      <View style={[innerStyle, styles.placeholder]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={innerStyle as any} />
        ) : (
          <Text style={[styles.initials, { fontSize: s.text }]}>{initials}</Text>
        )}
      </View>
      {online ? (
        <View style={[styles.dot, { width: s.dot, height: s.dot, borderRadius: s.dot / 2 }]}>
          <View style={[styles.dotInner, { width: s.dot - 4, height: s.dot - 4, borderRadius: (s.dot - 4) / 2 }]} />
        </View>
      ) : null}
    </View>
  )
}

// ─── Estilos ──────────────────────────────────────────────

const styles = StyleSheet.create({
  ring: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initials: {
    ...typography.h1,
    color: '#fff',
    fontWeight: '900',
  },
  dot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#1a7a4a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a7a4a',
  },
  dotInner: {
    backgroundColor: '#4ade80',
  },
})

export default Avatar
