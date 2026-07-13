// components/IntroSplashScreen.tsx
// Pantalla de intro cinematográfica — video a pantalla completa con fade-out y skip

import React, { useRef, useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar,
} from 'react-native'
import { Video, ResizeMode } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

const { width: W, height: H } = Dimensions.get('window')

interface Props {
  onFinish: () => void
}

export default function IntroSplashScreen({ onFinish }: Props) {
  const videoRef = useRef<Video>(null)
  const [progress, setProgress] = useState(0)      // 0-1
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const fadeAnim = useRef(new Animated.Value(0)).current   // fade-in inicial
  const exitAnim = useRef(new Animated.Value(1)).current   // fade-out al salir
  const barAnim = useRef(new Animated.Value(0)).current    // barra de progreso
  const skipPulse = useRef(new Animated.Value(1)).current  // pulso del botón skip

  useEffect(() => {
    // Fade-in de entrada suave
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start()

    // Pulso del botón SALTAR
    Animated.loop(
      Animated.sequence([
        Animated.timing(skipPulse, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(skipPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  // Actualizar barra de progreso
  useEffect(() => {
    if (duration > 0) {
      Animated.timing(barAnim, {
        toValue: position / duration,
        duration: 200,
        useNativeDriver: false,
      }).start()
      setProgress(position / duration)
    }
  }, [position, duration])

  const handleFinish = () => {
    // Fade-out cinematográfico antes de pasar a la app
    Animated.timing(exitAnim, {
      toValue: 0, duration: 700, useNativeDriver: true,
    }).start(() => onFinish())
  }

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <Animated.View style={[styles.root, { opacity: exitAnim }]}>
      <StatusBar hidden />

      {/* VIDEO A PANTALLA COMPLETA */}
      <Animated.View style={[styles.videoWrap, { opacity: fadeAnim }]}>
        <Video
          ref={videoRef}
          source={require('../assets/video_bienvenida.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.COVER}         // Cubre toda la pantalla
          shouldPlay
          isLooping={false}
          isMuted={false}                        // Con audio para mayor impacto
          onPlaybackStatusUpdate={status => {
            if (status.isLoaded) {
              setPosition(status.positionMillis ?? 0)
              setDuration(status.durationMillis ?? 0)
              if (status.didJustFinish) handleFinish()
            }
          }}
        />
      </Animated.View>

      {/* GRADIENTE SUPERIOR — para legibilidad del logo */}
      <LinearGradient
        colors={['rgba(0,0,0,0.65)', 'transparent']}
        style={styles.gradTop}
      />

      {/* GRADIENTE INFERIOR — para controles */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.gradBottom}
      />

      {/* LOGO Y TEXTO ARRIBA */}
      <Animated.View style={[styles.logoArea, { opacity: fadeAnim }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🛒</Text>
        </View>
        <Text style={styles.logoTitle}>Consume lo Nuestro</Text>
        <Text style={styles.logoSub}>Gobernación de Oruro</Text>
      </Animated.View>

      {/* CONTROLES ABAJO */}
      <View style={styles.controls}>
        {/* Barra de progreso */}
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>

        <View style={styles.controlsRow}>
          {/* Tiempo restante */}
          <Text style={styles.timeText}>
            {duration > 0
              ? `0:${Math.max(0, Math.ceil((duration - position) / 1000)).toString().padStart(2, '0')}`
              : '--'}
          </Text>

          {/* Botón SALTAR */}
          <Animated.View style={{ transform: [{ scale: skipPulse }] }}>
            <TouchableOpacity style={styles.skipBtn} onPress={handleFinish} activeOpacity={0.8}>
              <Text style={styles.skipTxt}>Saltar</Text>
              <Ionicons name="play-skip-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0,
    width: W, height: H,
    backgroundColor: '#000',
    zIndex: 99999,
  },
  videoWrap: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  gradTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 160,
  },
  gradBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 180,
  },
  logoArea: {
    position: 'absolute',
    top: 56,
    left: 0, right: 0,
    alignItems: 'center',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(26,122,74,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#1a7a4a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 14,
  },
  logoEmoji: { fontSize: 36 },
  logoTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.2,
  },
  logoSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ade80',
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
  },
  skipTxt: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
})
