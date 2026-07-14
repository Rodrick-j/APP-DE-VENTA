// app/_layout.tsx
// Layout raíz de la app — configura providers globales:
// - Tipografía Inter (carga inicial)
// - TanStack Query (caché de datos)
// - Auth listener (Supabase)
// - IntroSplashScreen (video de bienvenida)
// - Expo Router Stack

import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { LogBox } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFonts } from 'expo-font'
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter'
import { useAuthStore } from '../stores/authStore'
import IntroSplashScreen from '../components/IntroSplashScreen'

LogBox.ignoreLogs([
  '[expo-av]:',
  'props.pointerEvents is deprecated',
  '"shadow*" style props are deprecated',
  'Animated: `useNativeDriver` is not supported',
])

// Cliente TanStack Query con configuración global
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 2, // 2 minutos por defecto
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize)
  const [showIntro, setShowIntro] = useState<boolean | null>(null)

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  })

  useEffect(() => {
    initialize()
    checkIntro()
  }, [])

  const checkIntro = async () => {
    try {
      const hasSeen = await AsyncStorage.getItem('@has_seen_intro')
      if (hasSeen === 'true') {
        setShowIntro(false)
      } else {
        setShowIntro(true)
      }
    } catch {
      setShowIntro(true)
    }
  }

  const handleFinishIntro = async () => {
    setShowIntro(false)
    try {
      await AsyncStorage.setItem('@has_seen_intro', 'true')
    } catch {}
  }

  if (!fontsLoaded || showIntro === null) return null

  // Estilo de contenedor para Web: simula una pantalla de celular centrada en el navegador
  const webRootStyle: any = Platform.OS === 'web' ? {
    flex: 1,
    backgroundColor: '#0f172a', // Fondo oscuro de escritorio
    alignItems: 'center',
    justifyContent: 'center',
  } : { flex: 1 }

  const webContainerStyle: any = Platform.OS === 'web' ? {
    flex: 1,
    width: '100%',
    maxWidth: 460, // Tamaño estándar de celular
    maxHeight: '100vh',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 25,
    overflow: 'hidden',
    position: 'relative',
  } : { flex: 1 }

  return (
    <GestureHandlerRootView style={webRootStyle}>
      <View style={webContainerStyle}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            {/* Rutas de autenticación */}
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            {/* Rutas principales (con tabs) */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* Pantalla de detalle de producto */}
            <Stack.Screen
              name="producto/[id]"
              options={{
                headerShown: true,
                title: 'Detalle del Producto',
                headerBackTitle: 'Volver',
              }}
            />
            {/* Pantalla de perfil de productor */}
            <Stack.Screen
              name="productor/[id]"
              options={{
                headerShown: true,
                title: 'Productor',
                headerBackTitle: 'Volver',
              }}
            />
          </Stack>

          {/* VIDEO INTRO — se muestra sobre todo al iniciar la app (1 sola vez por instalación) */}
          {showIntro && (
            <IntroSplashScreen onFinish={handleFinishIntro} />
          )}
        </QueryClientProvider>
      </View>
    </GestureHandlerRootView>
  )
}

