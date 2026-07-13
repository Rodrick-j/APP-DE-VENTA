// app/(auth)/_layout.tsx
// Layout para las pantallas de autenticación
// Si ya tiene sesión, redirige al marketplace

import { Stack, Redirect } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'

export default function AuthLayout() {
  const { session, isInitialized } = useAuthStore()

  if (isInitialized && session) {
    return <Redirect href="/(tabs)/marketplace" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="bienvenida" />
      <Stack.Screen name="login" />
      <Stack.Screen name="registro" />
    </Stack>
  )
}
