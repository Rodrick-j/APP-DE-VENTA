// app/(auth)/bienvenida.tsx
// Pantalla de bienvenida — Diseño Ultra-Premium e Institucional con Reanimated 4

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
  const pulseOuter = useSharedValue(1)
  const feature1TranslateY = useSharedValue(25)
  const feature1Opacity = useSharedValue(0)
  const feature2TranslateY = useSharedValue(25)
  const feature2Opacity = useSharedValue(0)
  const feature3TranslateY = useSharedValue(25)
  const feature3Opacity = useSharedValue(0)
  const buttonsTranslateY = useSharedValue(35)
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

  const pulseOuterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseOuter.value }],
    opacity: 2 - pulseOuter.value,
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
    // Secuencia de entrada principal
    fadeAnim.value = withTiming(1, { duration: 750, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    slideAnim.value = withSpring(0, { damping: 14, stiffness: 100 })
    scaleAnim.value = withSpring(1, { damping: 12, stiffness: 100 })

    // Pulso continuo del escudo central
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    )

    pulseOuter.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    )

    // Stagger de características
    setTimeout(() => {
      feature1TranslateY.value = withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) })
      feature1Opacity.value = withTiming(1, { duration: 550 })
    }, 350)
    setTimeout(() => {
      feature2TranslateY.value = withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) })
      feature2Opacity.value = withTiming(1, { duration: 550 })
    }, 480)
    setTimeout(() => {
      feature3TranslateY.value = withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) })
      feature3Opacity.value = withTiming(1, { duration: 550 })
    }, 610)

    // Botones de acción
    setTimeout(() => {
      buttonsTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
      buttonsOpacity.value = withTiming(1, { duration: 600 })
    }, 720)
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
        colors={['#063b21', '#0a4f2e', '#11633b', '#1a7a4a']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        {/* Luces y círculos de fondo ambiental con contraste dorado */}
        <View style={styles.ambientCircleTop} />
        <View style={styles.ambientCircleMiddle} />
        <View style={styles.ambientCircleBottom} />
        <View style={styles.ambientGoldGlow} />

        {/* Header institucional elegante con Glassmorphism */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <View style={styles.institutionalPill}>
            <View style={styles.shieldBadge}>
              <Ionicons name="shield-checkmark" size={16} color={colors.gold} />
            </View>
            <View style={styles.headerTextBox}>
              <Text style={styles.gobernacionText}>GOBERNACIÓN DE ORURO</Text>
              <Text style={styles.secretariaText}>Secretaría de Desarrollo Productivo</Text>
            </View>
          </View>
        </Animated.View>

        {/* Logo central con anillos de luz multi-capa */}
        <Animated.View style={[styles.logoArea, logoAnimatedStyle]}>
          <View style={styles.emblemContainer}>
            <Animated.View style={[styles.logoOuterRing, pulseOuterStyle]} />
            <Animated.View style={[styles.logoMiddleRing, pulseAnimatedStyle]}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.08)']}
                style={styles.logoInnerCircle}
              >
                <Ionicons name="storefront" size={44} color="#ffffff" />
              </LinearGradient>
            </Animated.View>
          </View>

          <Text style={styles.appNombre}>Consume lo Nuestro</Text>
          <View style={styles.sloganBadge}>
            <Text style={styles.appSloganText}>
              <Text style={{ color: colors.gold, fontWeight: '700' }}>★</Text> El Marketplace Oficial de los Productores Orureños
            </Text>
          </View>
        </Animated.View>

        {/* Tarjetas de características (Premium Glass Cards) */}
        <View style={styles.featuresContainer}>
          <Animated.View style={[styles.featureCard, feature1AnimatedStyle]}>
            <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
              <Ionicons name="leaf" size={20} color="#10b981" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Productores 100% Locales</Text>
              <Text style={styles.featureSubtitle}>Del campo y el taller orureño directo a tu hogar.</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.featureCard, feature2AnimatedStyle]}>
            <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.25)', borderColor: 'rgba(59, 130, 246, 0.4)' }]}>
              <Ionicons name="navigate" size={20} color="#60a5fa" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Geolocalización GPS</Text>
              <Text style={styles.featureSubtitle}>Encuentra puntos de venta físicos en el mapa.</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.featureCard, feature3AnimatedStyle]}>
            <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Respaldo Gobernación</Text>
              <Text style={styles.featureSubtitle}>MYPEs y PYMEs verificadas con precio justo y sin intermediarios.</Text>
            </View>
          </Animated.View>
        </View>

        {/* Sección de Botones Ultra-Modernos */}
        <Animated.View style={[styles.botonesContainer, buttonsAnimatedStyle]}>
          <Button
            variant="primary"
            label={googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}
            icon="logo-google"
            onPress={() => promptAsync()}
            fullWidth
            gradient={[colors.white, colors.white]}
            disabled={googleLoading}
            textStyle={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}
            style={styles.googleBtnShadow}
          />

          <View style={styles.rowButtons}>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                label="Con Correo"
                icon="mail"
                onPress={() => router.push('/(auth)/registro')}
                fullWidth
                gradient={['#1e9455', '#146c3d']}
                style={styles.emailButton}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Button
                variant="outline"
                label="Ya tengo cuenta"
                onPress={() => router.push('/(auth)/login')}
                fullWidth
                style={styles.loginButton}
                textStyle={{ color: '#fff', fontWeight: '600' }}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.exploreBadge}
            onPress={() => router.replace('/(tabs)/marketplace')}
            activeOpacity={0.8}
          >
            <Text style={styles.txtExplorar}>
              🚀 Explorar el Marketplace como Invitado <Text style={{ fontWeight: '800' }}>→</Text>
            </Text>
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
    paddingHorizontal: spacing.xxl,
    paddingTop: Platform.OS === 'web' ? 40 : 54,
    paddingBottom: Platform.OS === 'web' ? 30 : spacing.xxxl,
    justifyContent: 'space-between',
  },

  // Luces de fondo (Atmospheric glow)
  ambientCircleTop: {
    position: 'absolute', top: -120, right: -100,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  ambientCircleMiddle: {
    position: 'absolute', top: '35%', left: -140,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  ambientCircleBottom: {
    position: 'absolute', bottom: -80, right: -60,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  ambientGoldGlow: {
    position: 'absolute', top: '22%', right: '15%',
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },

  // Header institucional Glassmorphism
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  institutionalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' as any }
    })
  },
  shieldBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  headerTextBox: {
    justifyContent: 'center',
  },
  gobernacionText: {
    ...typography.label,
    color: '#ffffff',
    letterSpacing: 1.8,
    fontWeight: '800',
    fontSize: 11,
  },
  secretariaText: {
    ...typography.tiny,
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.5,
    marginTop: 1,
    fontWeight: '500',
  },

  // Logo central
  logoArea: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  emblemContainer: {
    width: 136, height: 136,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoOuterRing: {
    position: 'absolute',
    width: 136, height: 136, borderRadius: 68,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  logoMiddleRing: {
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      ios: { shadowColor: colors.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14 },
      android: { elevation: 6 },
      web: { boxShadow: '0 6px 20px rgba(245, 158, 11, 0.25)' as any }
    })
  },
  logoInnerCircle: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  appNombre: {
    ...typography.hero,
    color: '#ffffff',
    textAlign: 'center',
    fontSize: Platform.OS === 'web' ? 36 : 32,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  sloganBadge: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  appSloganText: {
    ...typography.captionMedium,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontSize: 13,
  },

  // Tarjetas de Características (Glassmorphism Cards)
  featuresContainer: {
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 4px 14px rgba(0,0,0,0.12)' as any }
    })
  },
  featureIconContainer: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...typography.bodyBold,
    color: '#ffffff',
    fontSize: 15,
  },
  featureSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },

  // Sección de Botones
  botonesContainer: {
    gap: spacing.md,
  },
  googleBtnShadow: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10 },
      android: { elevation: 5 },
      web: { boxShadow: '0 6px 16px rgba(0,0,0,0.2)' as any }
    })
  },
  rowButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  emailButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  loginButton: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  exploreBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: spacing.xs,
  },
  txtExplorar: {
    color: '#ffffff',
    ...typography.captionBold,
    textAlign: 'center',
    fontSize: 13,
    letterSpacing: 0.3,
  },
})
