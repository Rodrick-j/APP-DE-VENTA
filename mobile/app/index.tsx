// app/index.tsx
// Pantalla de entrada — redirige según si hay sesión o no

import { Redirect } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../stores/authStore'

export default function Index() {
  const { session, isInitialized } = useAuthStore()

  // Mientras inicializa, mostrar spinner
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a7a4a' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    )
  }

  // Si tiene sesión → ir al marketplace
  if (session) {
    return <Redirect href="/(tabs)/marketplace" />
  }

  // Sin sesión → ir a bienvenida
  return <Redirect href="/(auth)/bienvenida" />
}
