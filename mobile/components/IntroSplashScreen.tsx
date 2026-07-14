// components/IntroSplashScreen.tsx
// Pantalla de intro cinematográfica — video a pantalla completa con fade-out y skip

import React, { useRef, useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Platform,
} from 'react-native'
import { Video, ResizeMode } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, typography, radius } from '../lib/theme'

const { width: W, height: H } = Dimensions.get('window')

interface Props {
  onFinish: () => void
}

export default function IntroSplashScreen({ onFinish }: Props) {
  const videoRef = useRef<Video>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const exitAnim = useRef(new Animated.Value(1)).current
  const barAnim = useRef(new Animated.Value(0)).current
  const skipPulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(skipPulse, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(skipPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    if (duration > 0) {
      Animated.timing(barAnim, {
        toValue: position / duration,
        duration: 250,
        useNativeDriver: false,
      }).start()
      setProgress(position / duration)
    }
  }, [position, duration])

  const handleFinish = () => {
    Animated.timing(exitAnim, {
      toValue: 0, duration: 650, useNativeDriver: true,
    }).start(() => onFinish())
  }

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <Animated.View style={[styles.root, { opacity: exitAnim }]}>
      <StatusBar hidden />

      <Animated.View style={[styles.videoWrap, { opacity: fadeAnim }]}>
        <Video
          ref={videoRef}
          source={require('../assets/video_bienvenida.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          isMuted={false}
          onPlaybackStatusUpdate={status => {
            if (status.isLoaded) {
              setPosition(status.positionMillis ?? 0)
              setDuration(status.durationMillis ?? 0)
              if (status.didJustFinish) handleFinish()
            }
          }}
        />
      </Animated.View>

      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.2)', 'transparent']}
        style={styles.gradTop}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.88)']}
        style={styles.gradBottom}
      />

      {/* HEADER OVERLAY — IDENTIDAD INSTITUCIONAL */}
      <Animated.View style={[styles.headerOverlay, { opacity: fadeAnim }]}>
        <View style={styles.institutionalBadge}>
          <Ionicons name="shield-checkmark" size={16} color={colors.gold} style={{ marginRight: 6 }} />
          <Text style={styles.badgeText}>GOBERNACIÓN DE ORURO • CONSUME LO NUESTRO</Text>
        </View>

        <View style={styles.logoRow}>
          <View style={styles.logoIconCircle}>
            <Ionicons name="storefront" size={32} color="#ffffff" />
          </View>
          <View style={styles.logoTextCol}>
            <Text style={styles.logoTitle}>Consume lo Nuestro</Text>
            <Text style={styles.logoSub}>★ Marketplace Regional Certificado</Text>
          </View>
        </View>
      </Animated.View>

      {/* BARRA DE PROGRESO Y BOTÓN SALTAR */}
      <View style={styles.controls}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>

        <View style={styles.controlsRow}>
          <Text style={styles.timeText}>
            {Math.floor(position / 1000)}s / {Math.floor(duration / 1000)}s
          </Text>

          <Animated.View style={{ transform: [{ scale: skipPulse }] }}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Text style={styles.skipTxt}>Omitir Introducción</Text>
              <Ionicons name="arrow-forward-circle" size={18} color={colors.gold} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#052e18',
    zIndex: 9999,
  },
  videoWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  gradTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 160,
  },
  gradBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
  },
  headerOverlay: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 36 : 56,
    left: 20, right: 20,
    alignItems: 'center',
  },
  institutionalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 14,
  },
  badgeText: {
    ...typography.label,
    color: '#ffffff',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 4 },
      web: { boxShadow: '0 6px 16px rgba(0,0,0,0.2)' as any }
    })
  },
  logoIconCircle: {
    width: 54, height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(26, 122, 74, 0.9)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoTextCol: {
    justifyContent: 'center',
  },
  logoTitle: {
    ...typography.h1,
    fontSize: 22,
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  logoSub: {
    ...typography.captionMedium,
    color: colors.gold,
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 30 : 42,
    left: 24,
    right: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : 'Inter',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
    ...Platform.select({
      ios: { shadowColor: colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' as any }
    })
  },
  skipTxt: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : 'Inter',
  },
})
