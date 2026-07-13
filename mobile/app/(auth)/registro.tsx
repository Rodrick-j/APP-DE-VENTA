// app/(auth)/registro.tsx
// Pantalla de registro — Diseño Legendario Premium (Dark Glassmorphism)

import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, StatusBar, Animated,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_WEB_CLIENT_ID = '148514294195-8bgj6mgc0tqin18s85vuclt9qr9k0ttv.apps.googleusercontent.com'

type Rol = 'comprador' | 'productor'
const isWeb = Platform.OS === 'web'

export default function RegistroScreen() {
  const { signUp, signInWithGoogle, updatePerfil, isLoading } = useAuthStore()
  const params = useLocalSearchParams()
  const initialRol = (params.rol as Rol) || 'comprador'

  const [googleLoading, setGoogleLoading] = useState(false)
  const [rol, setRol] = useState<Rol>(initialRol)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Animaciones de fondo
  const floatAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: !isWeb }).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 4000, useNativeDriver: !isWeb }),
        Animated.timing(floatAnim, { toValue: 0, duration: 4000, useNativeDriver: !isWeb }),
      ])
    ).start()
  }, [])

  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    responseType: 'id_token',
    scopes: ['openid', 'profile', 'email'],
    redirectUri: isWeb && typeof window !== 'undefined' ? window.location.origin : undefined,
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
    
    if (!error && rol === 'productor') {
      await updatePerfil({ rol: 'productor' })
    }

    setGoogleLoading(false)
    if (error) Alert.alert('Error con Google', error)
  }

  const validar = () => {
    const e: Record<string, string> = {}
    if (!nombre.trim()) e.nombre = 'El nombre es requerido'
    if (!email.trim()) e.email = 'El email es requerido'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email no válido'
    if (!password) e.password = 'La contraseña es requerida'
    else if (password.length < 8) e.password = 'Mínimo 8 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleRegistro = async () => {
    if (!validar()) return
    const { error } = await signUp(email.trim().toLowerCase(), password, nombre.trim(), rol)
    if (error) {
      Alert.alert('Error en el registro', error)
    } else {
      Alert.alert(
        '¡Registro exitoso! 🎉',
        'Tu cuenta ha sido creada exitosamente.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      )
    }
  }

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] })

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#022c22" />

      {/* Fondo Premium Oscuro */}
      <LinearGradient
        colors={['#022c22', '#064e3b', '#022c22']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      
      {/* Orbe decorativo */}
      <Animated.View style={[styles.orb, { transform: [{ translateY }] }]} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/bienvenida')}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Crear Cuenta</Text>
              <Text style={styles.headerSub}>Únete al movimiento Consume lo Nuestro</Text>
            </View>
          </View>

          {/* Formulario Glassmorphism */}
          <View style={styles.glassContainer}>
            
            {/* Selector de Rol Premium */}
            <View style={styles.rolToggle}>
              <TouchableOpacity
                style={[styles.rolBtn, rol === 'comprador' && styles.rolBtnActivoComprador]}
                onPress={() => setRol('comprador')}
                activeOpacity={0.8}
              >
                <Ionicons name="cart" size={20} color={rol === 'comprador' ? '#34d399' : '#9ca3af'} />
                <Text style={[styles.rolTexto, rol === 'comprador' && { color: '#34d399' }]}>Cliente</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.rolBtn, rol === 'productor' && styles.rolBtnActivoProductor]}
                onPress={() => setRol('productor')}
                activeOpacity={0.8}
              >
                <Ionicons name="storefront" size={20} color={rol === 'productor' ? '#fbbf24' : '#9ca3af'} />
                <Text style={[styles.rolTexto, rol === 'productor' && { color: '#fbbf24' }]}>Productor</Text>
              </TouchableOpacity>
            </View>

            {rol === 'productor' && (
              <View style={styles.productorAviso}>
                <Ionicons name="shield-checkmark" size={18} color="#fbbf24" />
                <Text style={styles.productorAvisoTexto}>
                  Tu cuenta será verificada por la Gobernación antes de publicar.
                </Text>
              </View>
            )}

            {/* Google Btn Oscuro */}
            <TouchableOpacity
              style={styles.btnGoogle}
              onPress={() => promptAsync()}
              disabled={googleLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.btnGoogleText}>
                {googleLoading ? 'Conectando...' : 'Continuar con Google'}
              </Text>
            </TouchableOpacity>

            <View style={styles.sep}>
              <View style={styles.sepLine} />
              <Text style={styles.sepText}>O usa tu email</Text>
              <View style={styles.sepLine} />
            </View>

            {/* Inputs Glass */}
            <View style={styles.formContainer}>
              <View style={[styles.inputWrapper, errors.nombre && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo / Empresa"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={nombre}
                  onChangeText={(t) => { setNombre(t); setErrors({ ...errors, nombre: '' }) }}
                />
              </View>

              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: '' }) }}
                />
              </View>

              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña (mínimo 8)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: '' }) }}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={22} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.terminosTxt}>
              Al registrarte, aceptas los <Text style={styles.terminosLink}>Términos</Text> y la <Text style={styles.terminosLink}>Privacidad</Text>.
            </Text>

            {/* Submit Btn */}
            <TouchableOpacity 
              style={styles.btnSubmit}
              onPress={handleRegistro}
              disabled={isLoading || googleLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={rol === 'comprador' ? ['#059669', '#047857'] : ['#d97706', '#b45309']}
                style={styles.btnSubmitGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnSubmitText}>Crear Cuenta</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.loginBold}>Iniciar Sesión</Text>
              </TouchableOpacity>
            </View>

          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#022c22' },
  orb: {
    position: 'absolute',
    width: 300, height: 300,
    borderRadius: 150,
    backgroundColor: '#047857',
    opacity: 0.35,
    top: -50, right: -100,
    filter: 'blur(50px)', // Para web
  },
  scroll: { flexGrow: 1, paddingBottom: 40, paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)'
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  glassContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  rolToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 6,
    marginBottom: 20,
  },
  rolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  rolBtnActivoComprador: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  rolBtnActivoProductor: { backgroundColor: 'rgba(251, 191, 36, 0.15)' },
  rolTexto: { fontSize: 14, fontWeight: '700', color: '#9ca3af' },

  productorAviso: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  productorAvisoTexto: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#fcd34d',
    lineHeight: 16,
  },

  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 10,
  },
  btnGoogleText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  sep: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  sepLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  sepText: { marginHorizontal: 16, color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },

  formContainer: { gap: 14 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  inputError: { borderColor: 'rgba(239, 68, 68, 0.5)', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#fff', height: '100%' },
  eyeBtn: { padding: 4 },

  terminosTxt: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 16 },
  terminosLink: { color: '#34d399', fontWeight: '700' },

  btnSubmit: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnSubmitGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSubmitText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  loginText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  loginBold: { color: '#34d399', fontWeight: '800', fontSize: 14 }
})
