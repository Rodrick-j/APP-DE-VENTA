// app/(auth)/login.tsx
// Pantalla de inicio de sesión — diseño premium con theme centralizado

import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, StatusBar,
} from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { colors, typography, spacing, radius, shadows, gradients } from '../../lib/theme'
import { Button, Input } from '../../components/ui'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_WEB_CLIENT_ID = '148514294195-8bgj6mgc0tqin18s85vuclt9qr9k0ttv.apps.googleusercontent.com'

export default function LoginScreen() {
  const { signIn, signInWithGoogle, isLoading } = useAuthStore()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({})
  const [googleLoading, setGoogleLoading] = useState(false)

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
        Alert.alert('Error de Google', 'No se recibió el token de Google.')
      }
    }
  }, [response])

  const handleGoogleToken = async (idToken: string) => {
    setGoogleLoading(true)
    const { error } = await signInWithGoogle(idToken)
    setGoogleLoading(false)
    if (error) Alert.alert('Error con Google', error)
  }

  const validar = () => {
    const e: typeof errors = {}
    if (!email.trim()) e.email = 'El email es requerido'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email no válido'
    if (!password) e.password = 'La contraseña es requerida'
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async () => {
    if (!validar()) return
    const { error } = await signIn(email.trim().toLowerCase(), password)
    if (error) {
      Alert.alert(
        'Error al iniciar sesión',
        error.includes('Invalid login') ? 'Email o contraseña incorrectos' : error
      )
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header verde con curva */}
        <LinearGradient
          colors={gradients.greenButton}
          style={styles.headerGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/bienvenida')}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerLogo}>
              <Ionicons name="cart" size={36} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Bienvenido de vuelta</Text>
            <Text style={styles.headerSub}>Ingresa a tu cuenta</Text>
          </View>
          <View style={styles.headerCurve} />
        </LinearGradient>

        {/* Formulario */}
        <View style={styles.form}>

          {/* Google */}
          <Button
            variant="primary"
            label={googleLoading ? 'Conectando...' : 'Continuar con Google'}
            icon="logo-google"
            onPress={() => promptAsync()}
            fullWidth
            disabled={googleLoading}
            gradient={[colors.white, colors.white]}
            textStyle={{ color: colors.textPrimary }}
            style={{ borderWidth: 1.5, borderColor: colors.border, marginBottom: spacing.xl }}
          />

          {/* Separador */}
          <View style={styles.sep}>
            <View style={styles.sepLine} />
            <Text style={styles.sepText}>o ingresa con email</Text>
            <View style={styles.sepLine} />
          </View>

          {/* Email */}
          <Input
            label="Correo electrónico"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />

          {/* Contraseña */}
          <Input
            label="Contraseña"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPass}
            autoCorrect={false}
            error={errors.password}
            rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPass(!showPass)}
          />

          <TouchableOpacity style={styles.olvide}>
            <Text style={styles.olvideTexto}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Botón principal */}
          <Button
            variant="primary"
            label={isLoading ? 'Iniciando...' : 'Iniciar sesión'}
            onPress={handleLogin}
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/registro')}>
              <Text style={styles.footerLink}>Regístrate gratis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfacePrimary },
  scroll: { flexGrow: 1 },

  // Header
  headerGrad: { paddingTop: 50, paddingBottom: 60, paddingHorizontal: spacing.xxl, position: 'relative' },
  backBtn: {
    width: 38, height: 38, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xxl,
  },
  headerContent: { alignItems: 'center' },
  headerLogo: {
    width: 80, height: 80, borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
  },
  headerTitle: { ...typography.h1, color: '#fff' },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs + 1 },
  headerCurve: {
    position: 'absolute', bottom: -1, left: 0, right: 0,
    height: 30, backgroundColor: colors.surfacePrimary, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
  },

  // Formulario
  form: { paddingHorizontal: spacing.xxl, paddingTop: spacing.sm, paddingBottom: spacing.huge },

  // Separador
  sep: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  sepLine: { flex: 1, height: 1, backgroundColor: colors.border },
  sepText: { color: colors.textMuted, ...typography.small, marginHorizontal: spacing.md, fontWeight: '500' },

  olvide: { alignSelf: 'flex-end', marginBottom: spacing.xl, marginTop: spacing.xs },
  olvideTexto: { color: colors.primary, ...typography.captionMedium },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { ...typography.body, color: colors.textTertiary },
  footerLink: { ...typography.body, color: colors.primary, fontWeight: '700' },
})
