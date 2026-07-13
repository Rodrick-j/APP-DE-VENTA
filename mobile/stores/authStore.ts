// stores/authStore.ts
// Estado global de autenticación — Zustand
// Maneja el usuario, sesión y perfil en toda la app

import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import type { Perfil } from '../types/database'

interface AuthState {
  // Estado
  session: Session | null
  user: User | null
  perfil: Perfil | null
  isLoading: boolean
  isInitialized: boolean

  // Acciones
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: (idToken: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, nombre: string, rol?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updatePerfil: (data: Partial<Perfil>) => Promise<{ error: string | null }>
  refreshPerfil: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  perfil: null,
  isLoading: false,
  isInitialized: false,

  // Inicializar: recuperar sesión guardada al abrir la app
  initialize: async () => {
    set({ isLoading: true })

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        set({ session, user: session.user, perfil, isInitialized: true })
      } else {
        set({ session: null, user: null, perfil: null, isInitialized: true })
      }
    } catch {
      set({ isInitialized: true })
    } finally {
      set({ isLoading: false })
    }

    // Escuchar cambios de sesión en tiempo real (login, logout, refresh)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        set({ session, user: session.user, perfil })

        // Si justo acaba de iniciar sesión, navegar al marketplace
        if (event === 'SIGNED_IN') {
          try { router.replace('/(tabs)/marketplace') } catch {}
        }
      } else {
        set({ session: null, user: null, perfil: null })

        // Al cerrar sesión, redirigir siempre a la pantalla de bienvenida
        if (event === 'SIGNED_OUT') {
          try { router.replace('/(auth)/bienvenida') } catch {}
        }
      }
    })
  },

  // Iniciar sesión
  signIn: async (email, password) => {
    set({ isLoading: true })

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    set({ isLoading: false })
    return { error: error?.message ?? null }
  },

  // Iniciar sesión con Google
  signInWithGoogle: async (idToken) => {
    set({ isLoading: true })
    console.log('--- ENVIANDO ID TOKEN A SUPABASE ---', idToken?.substring(0, 25))
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    })
    if (error) {
      console.error('--- ERROR SUPABASE SIGN IN WITH ID TOKEN ---', error)
    }
    set({ isLoading: false })
    return { error: error?.message ?? null }
  },

  // Registrarse
  signUp: async (email, password, nombre, rol = 'comprador') => {
    set({ isLoading: true })

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: nombre, rol }  // el trigger lo usa para crear el perfil
      }
    })

    set({ isLoading: false })
    return { error: error?.message ?? null }
  },

  // Cerrar sesión
  signOut: async () => {
    set({ isLoading: true })
    try {
      await supabase.auth.signOut()   // dispara SIGNED_OUT → onAuthStateChange
    } catch (e) {
      console.warn("Error al intentar cerrar sesión en Supabase:", e)
    }
    set({ session: null, user: null, perfil: null, isLoading: false })
    // Redirigir de forma inmediata (doble seguro por si onAuthStateChange tarda o no se dispara)
    try {
      router.replace('/(auth)/bienvenida')
    } catch (err) {
      console.error("Error al redirigir:", err)
    }
  },

  // Actualizar perfil
  updatePerfil: async (data) => {
    const { user } = get()
    if (!user) return { error: 'No autenticado' }

    const { error } = await (supabase as any)
      .from('perfiles')
      .update(data)
      .eq('user_id', user.id)

    if (!error) {
      await get().refreshPerfil()
    }

    return { error: error?.message ?? null }
  },

  // Refrescar perfil desde la DB
  refreshPerfil: async () => {
    const { user } = get()
    if (!user) return

    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) set({ perfil: data })
  },
}))
