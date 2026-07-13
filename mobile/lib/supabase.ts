// lib/supabase.ts
// Cliente de Supabase configurado para React Native con Expo SecureStore

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import type { Database } from '../types/database'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Adaptador de storage seguro:
// - En dispositivos reales: usa SecureStore (encriptado en el hardware)
// - En web/emulador: usa AsyncStorage (fallback)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key)
    }
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value)
    }
    return SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key)
    }
    return SecureStore.deleteItemAsync(key)
  },
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // importante para React Native
  },
})

// Helper: obtener el usuario actual de forma segura
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}

// Helper: obtener el perfil del usuario actual
export const getCurrentPerfil = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}
