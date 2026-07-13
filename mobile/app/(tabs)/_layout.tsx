// app/(tabs)/_layout.tsx
// Barra de navegación inferior flotante — diseño premium con theme centralizado

import { Tabs } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import { Ionicons } from '@expo/vector-icons'
import { Platform, View, StyleSheet } from 'react-native'
import { colors, typography, radius, shadows } from '../../lib/theme'

export default function TabsLayout() {
  const { isInitialized } = useAuthStore()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        headerStyle: { backgroundColor: colors.primary, shadowOpacity: 0, elevation: 0 },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '800', fontSize: 16, fontFamily: typography.h3.fontFamily },
        headerTitleAlign: 'center',
        tabBarBackground: () => <View style={styles.tabBg} />,
      }}
    >
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.tabIconActive : undefined}>
              <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={24} color={color} />
            </View>
          ),
          headerTitle: 'Consume lo Nuestro',
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.tabIconActive : undefined}>
              <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
            </View>
          ),
          headerTitle: 'Mapa de Productores',
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarLabel: 'Favoritos',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.tabIconActive : undefined}>
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
            </View>
          ),
          headerTitle: 'Mis Favoritos',
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.tabIconActive : undefined}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            </View>
          ),
          headerTitle: 'Mi Perfil',
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    height: 64,
    paddingBottom: 0,
    paddingTop: 0,
    borderTopWidth: 0,
    ...shadows.heavy,
  },
  tabBg: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: typography.small.fontFamily,
  },
  tabItem: {
    paddingTop: 10,
  },
  tabIconActive: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
    padding: 4,
  },
})
