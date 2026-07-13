// app/(auth)/bienvenida.tsx
// Pantalla de bienvenida — diseño premium con Reanimated 4

import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar, Alert, Platform,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { useAuthStore } from '../../stores/authStore'
import { colors, typography, spacing, radius, shadows, gradients } from '../../lib/theme'
import { Button } from '../../components/ui'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_WEB_CLIENT_ID = '148514294195-8bgj6mgc0tqin18s85vuclt9qr9k0ttv.apps.googleusercontent.com'
const { width, height } = Dimensions.get('window')

export default function BienvenidaScreen() {
  const { signInWithGoogle } = useAuthStore()
  const [googleLoading, setGoogleLoading] = useState(false)

  // Animaciones con Reanimated
  const fadeAnim = useSharedValue(0)
  const slideAnim = useSharedValue(40)
  const scaleAnim = useSharedValue(0.85)
  const pulseAnim = useSharedValue(1)
  const feature1TranslateY = useSharedValue(20)
  const feature1Opacity = useSharedValue(0)
  const feature2TranslateY = useSharedValue(20)
  const feature2Opacity = useSharedValue(0)
  const feature3TranslateY = useSharedValue(20)
  const feature3Opacity = useSharedValue(0)
  const buttonsTranslateY = useSharedValue(30)
  const buttonsOpacity = useSharedValue(0)

  // Estilos animados
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }))

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }))

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }))

  const feature1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: feature1Opacity.value,
    transform: [{ translateY: feature1TranslateY.value }],
  }))

  const feature2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: feature2Opacity.value,
    transform: [{ translateY: feature2TranslateY.value }],
  }))

  const feature3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: feature3Opacity.value,
    transform: [{ translateY: feature3TranslateY.value }],
  }))

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }))

  useEffect(() => {
    // Secuencia de entrada
    fadeAnim.value = withTiming(1, { duration: 700, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    slideAnim.value = withSpring(0, { damping: 12, stiffness: 100 })
    scaleAnim.value = withSpring(1, { damping: 10, stiffness: 100 })

    // Pulso continuo
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(1, { duration: 1800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      false
    )

    // Stagger de features
    setTimeout(() => {
      feature1TranslateY.value = withTiming(0, { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      feature1Opacity.value = withTiming(1, { duration: 500 })
    }, 400)
    setTimeout(() => {
      feature2TranslateY.value = withTiming(0, { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      feature2Opacity.value = withTiming(1, { duration: 500 })
    }, 500)
    setTimeout(() => {
      feature3TranslateY.value = withTiming(0, { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      feature3Opacity.value = withTiming(1, { duration: 500 })
    }, 600)

    // Botones
    setTimeout(() => {
      buttonsTranslateY.value = withTiming(0, { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      buttonsOpacity.value = withTiming(1, { duration: 500 })
    }, 700)
  }, [])

  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    responseType: 'id_token',
    scopes: ['openid', 'profile', 'email'],
    redirectUri: Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined,
  })

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token || response.authentication?.idToken
      if (idToken) {
        handleGoogleToken(idToken)
      } else {
        Alert.alert('Error de autenticación', 'No se recibió el token de identificación de Google.')
      }
    }
  }, [response])

  const handleGoogleToken = async (idToken: string) => {
    setGoogleLoading(true)
    const { error } = await signInWithGoogle(idToken)
    setGoogleLoading(false)
    if (error) Alert.alert('Error con Google', error)
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDeep} />

      <LinearGradient
        colors={gradients.heroFull}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      >
        {/* Elementos decorativos */}
        <View style={styles.decoCircle1} />
        <View style={styles.decoCircle2} />
        <View style={styles.decoCircle3} />
        <View style={styles.decoRing1} />

        {/* Header institucional */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.escudoBadge}>
            <Ionicons name="library" size={20} color="#fff" />
          </View>
          <Text style={styles.gobernacion}>GOBERNACIÓN DE ORURO</Text>
          <Text style={styles.secretaria}>Secretaría de Desarrollo Productivo</Text>
        </Animated.View>

        {/* Logo central animado */}
        <Animated.View style={[styles.logoArea, logoAnimatedStyle]}>
          <Animated.View style={[styles.logoCircle, pulseAnimatedStyle]}>
            <View style={styles.logoInner}>
              <Ionicons name="cart" size={42} color="#fff" />
            </View>
          </Animated.View>

          <Text style={styles.appNombre}>Consume lo Nuestro</Text>
          <Text style={styles.appSlogan}>
            El marketplace oficial de{'\n'}los productores de Oruro
          </Text>
        </Animated.View>

        {/* Features con glassmorphism — stagger animado */}
        <View style={styles.features}>
          <Animated.View style={[styles.featureRow, feature1AnimatedStyle]}>
            <View style={styles.featureIconBox}>
              <Ionicons name="leaf-outline" size={18} color="#ffffff" />
            </View>
            <Text style={styles.featureText}>MYPEs, PYMEs y Agropecuarios</Text>
          </Animated.View>

          <Animated.View style={[styles.featureRow, feature2AnimatedStyle]}>
            <View style={styles.featureIconBox}>
              <Ionicons name="location-outline" size={18} color="#ffffff" />
            </View>
            <Text style={styles.featureText}>Productores cerca de ti</Text>
          </Animated.View>

          <Animated.View style={[styles.featureRow, feature3AnimatedStyle]}>
            <View style={styles.featureIconBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#ffffff" />
            </View>
            <Text style={styles.featureText}>Verificado por la Gobernación</Text>
          </Animated.View>
        </View>

        {/* Botones de acción — stagger animado */}
        <Animated.View style={[styles.botones, buttonsAnimatedStyle]}>
          {/* Google Sign-In */}
          <Button
            variant="primary"
            label={googleLoading ? 'Conectando...' : 'Continuar con Google'}
            icon="logo-google"
            onPress={() => promptAsync()}
            fullWidth
            gradient={[colors.white, colors.white]}
            disabled={googleLoading}
            textStyle={{ color: colors.textPrimary }}
          />

          {/* Registrarse con email */}
          <Button
            variant="primary"
            label="Registrarme con email"
            icon="mail-outline"
            onPress={() => router.push('/(auth)/registro')}
            fullWidth
            gradient={gradients.greenLight}
          />

          {/* Ya tengo cuenta */}
          <Button
            variant="outline"
            label="Ya tengo cuenta →"
            onPress={() => router.push('/(auth)/login')}
            fullWidth
            style={{ borderColor: 'rgba(255,255,255,0.5)' }}
            textStyle={{ color: '#fff' }}
          />

          {/* Explorar */}
          <TouchableOpacity onPress={() => router.replace('/(tabs)/marketplace')}>
            <Text style={styles.txtExplorar}>Explorar sin registrarme</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: {
    flex: 1,
    paddingHorizontal: spacing.xxxl,
    paddingTop: 54,
    paddingBottom: spacing.xxxl,
    justifyContent: 'space-between',
  },

  // Decoración
  decoCircle1: {
    position: 'absolute', top: -100, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decoCircle2: {
    position: 'absolute', top: 160, left: -70,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decoCircle3: {
    position: 'absolute', bottom: 180, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decoRing1: {
    position: 'absolute', top: -60, left: 40,
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },

  // Header
  header: { alignItems: 'center' },
  escudoBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  gobernacion: {
    ...typography.small,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 2.5, fontWeight: '800',
  },
  secretaria: {
    ...typography.small,
    color: 'rgba(255,255,255,0.55)',
    marginTop: spacing.xxs, textAlign: 'center',
  },

  // Logo
  logoArea: { alignItems: 'center' },
  logoCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.xxl,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
  },
  logoInner: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  appNombre: {
    ...typography.hero,
    color: '#ffffff',
    textAlign: 'center',
  },
  appSlogan: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', marginTop: spacing.md, lineHeight: 21,
  },

  // Features
  features: { gap: spacing.sm },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  featureIconBox: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  featureText: { ...typography.body, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

  // Botones
  botones: { gap: spacing.sm },

  txtExplorar: {
    color: 'rgba(255,255,255,0.5)', ...typography.small,
    textAlign: 'center', textDecorationLine: 'underline',
    marginTop: spacing.xs,
  },
})
