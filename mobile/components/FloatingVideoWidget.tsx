// components/FloatingVideoWidget.tsx
// Widget flotante de video en tamaño original (completo y sin recortes)

import React, { useState, useRef } from 'react'
import {
  View, TouchableOpacity, StyleSheet, Text, Animated,
  Dimensions, Platform
} from 'react-native'
import { Video, ResizeMode } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'

export default function FloatingVideoWidget() {
  const [isMuted, setIsMuted] = useState(true)
  const [isClosed, setIsClosed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const scaleAnim = useRef(new Animated.Value(1)).current
  const videoRef = useRef<Video>(null)

  if (isClosed) return null

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      {/* Contenedor Tamaño Original (Proporción 1:1 Completa) */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={toggleMute}
        style={styles.outerFrame}
      >
        <View style={styles.innerFrame}>
          <Video
            ref={videoRef}
            source={require('../assets/video_bienvenida.mp4')}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN} // Muestra el video orginal al 100% sin recortar nada
            shouldPlay={isPlaying}
            isLooping
            isMuted={isMuted}
          />
        </View>

        {/* Indicador de Sonido / Mute */}
        <View style={styles.soundBadge}>
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={16}
            color="#ffffff"
          />
          <Text style={styles.soundText}>{isMuted ? 'Muted' : 'Audio'}</Text>
        </View>
      </TouchableOpacity>

      {/* Botón Cerrar */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => setIsClosed(true)}
      >
        <Ionicons name="close" size={16} color="#ffffff" />
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 85, // Esquina inferior derecha
    right: 20,
    width: 210, // Tamaño original grande para verse nítido y completo
    height: 210,
    zIndex: 9999,
  },
  outerFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 105, // Contorno circular amplio al tamaño original del video
    padding: 4,
    backgroundColor: '#1a7a4a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 20,
    position: 'relative',
  },
  innerFrame: {
    flex: 1,
    borderRadius: 101,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  soundBadge: {
    position: 'absolute',
    bottom: 8,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderWidth: 1.5,
    borderColor: '#4ade80',
  },
  soundText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    top: 4,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 8,
  },
})
