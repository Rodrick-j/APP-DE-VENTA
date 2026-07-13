// app/productor/mis-productos.tsx
// Panel privado del productor para gestionar su catálogo de productos

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'

const VERDE = '#1a7a4a'

export default function MisProductosScreen() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  // 1. Obtener ID del productor del usuario actual
  const { data: productor, isLoading: loadingProductor } = useQuery({
    queryKey: ['mi-productor-id', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('productores')
        .select('id, nombre_empresa, estado')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  // 2. Obtener productos de este productor
  const { data: productos, isLoading: loadingProductos, refetch } = useQuery({
    queryKey: ['mis-productos-lista', productor?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('productos')
        .select(`
          *,
          categorias (nombre, color, icono)
        `)
        .eq('productor_id', productor!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!productor?.id,
  })

  // 3. Mutación para eliminar producto
  const deleteMutation = useMutation({
    mutationFn: async (productoId: string) => {
      const { error } = await (supabase as any)
        .from('productos')
        .delete()
        .eq('id', productoId)
        .eq('productor_id', productor!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos-lista'] })
      Alert.alert('✅ Eliminado', 'El producto fue eliminado de tu catálogo.')
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'No se pudo eliminar el producto.')
    },
  })

  // 4. Mutación para alternar disponibilidad (en stock vs agotado)
  const toggleDisponibleMutation = useMutation({
    mutationFn: async ({ id, disponible }: { id: string; disponible: boolean }) => {
      const { error } = await (supabase as any)
        .from('productos')
        .update({ disponible })
        .eq('id', id)
        .eq('productor_id', productor!.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos-lista'] })
    },
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const handleEliminar = (id: string, nombre: string) => {
    Alert.alert(
      'Eliminar Producto',
      `¿Estás seguro de que quieres eliminar "${nombre}" de tu catálogo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]
    )
  }

  if (loadingProductor || loadingProductos) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={VERDE} />
        <Text style={styles.loadingText}>Cargando catálogo...</Text>
      </View>
    )
  }

  if (!productor) {
    return (
      <View style={styles.centered}>
        <Ionicons name="warning-outline" size={60} color="#d97706" />
        <Text style={styles.errorTitulo}>Perfil incompleto</Text>
        <Text style={styles.errorSubtitulo}>Primero debes registrar tu empresa en la Gobernación para publicar productos.</Text>
        <TouchableOpacity
          style={styles.btnRegistrar}
          onPress={() => router.replace('/productor/registrar')}
        >
          <Text style={styles.btnRegistrarTexto}>Registrar mi empresa</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitulo}>Mis Productos</Text>
          <Text style={styles.headerSubtitulo}>{productor.nombre_empresa}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/productor/crear-producto')}
        >
          <Ionicons name="add" size={26} color={VERDE} />
        </TouchableOpacity>
      </View>

      {/* Lista de productos */}
      {!productos || productos.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 60 }}>📦</Text>
          <Text style={styles.emptyTitulo}>Tu catálogo está vacío</Text>
          <Text style={styles.emptySubtitulo}>Añade tu primer producto para que los compradores de toda la región de Oruro puedan encontrarte.</Text>
          <TouchableOpacity
            style={styles.btnCrearPrimero}
            onPress={() => router.push('/productor/crear-producto')}
          >
            <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnCrearTexto}>Crear mi primer producto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[VERDE]} />}
          renderItem={({ item }) => {
            const img = item.imagenes && item.imagenes.length > 0 ? item.imagenes[0] : null
            return (
              <View style={[styles.card, !item.disponible && styles.cardInactivo]}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.cardImg} />
                ) : (
                  <View style={[styles.cardImgPlaceholder, { backgroundColor: (item.categorias?.color ?? VERDE) + '22' }]}>
                    <Text style={{ fontSize: 32 }}>📦</Text>
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <View style={styles.tagRow}>
                    <Text style={styles.tagCat}>{item.categorias?.nombre ?? 'General'}</Text>
                    {!item.disponible && (
                      <View style={styles.badgeAgotado}>
                        <Text style={styles.badgeAgotadoTexto}>AGOTADO / OCULTO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.prodNombre} numberOfLines={2}>{item.nombre}</Text>
                  <Text style={styles.prodPrecio}>
                    {item.precio ? `Bs. ${item.precio.toFixed(2)} / ${item.unidad}` : 'A consultar'}
                  </Text>
                </View>

                {/* Acciones */}
                <View style={styles.accionesCol}>
                  <TouchableOpacity
                    style={[styles.btnAction, item.disponible ? styles.btnDisponible : styles.btnOculto]}
                    onPress={() => toggleDisponibleMutation.mutate({ id: item.id, disponible: !item.disponible })}
                  >
                    <Ionicons
                      name={item.disponible ? 'eye' : 'eye-off'}
                      size={20}
                      color={item.disponible ? VERDE : '#6b7280'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnAction, styles.btnEliminar]}
                    onPress={() => handleEliminar(item.id, item.nombre)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
  
  errorTitulo: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 12 },
  errorSubtitulo: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  btnRegistrar: { backgroundColor: VERDE, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 20 },
  btnRegistrarTexto: { color: '#fff', fontWeight: '800', fontSize: 15 },

  header: {
    backgroundColor: VERDE, flexDirection: 'row', alignItems: 'center',
    paddingTop: 44, paddingBottom: 16, paddingHorizontal: 16,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitleBox: { flex: 1 },
  headerTitulo: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSubtitulo: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  addBtn: {
    backgroundColor: '#fff', width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, elevation: 4,
  },

  lista: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2,
  },
  cardInactivo: { opacity: 0.6, backgroundColor: '#f3f4f6' },
  cardImg: { width: 90, height: 100 },
  cardImgPlaceholder: { width: 90, height: 100, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  tagCat: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },
  badgeAgotado: { backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeAgotadoTexto: { color: '#ef4444', fontSize: 9, fontWeight: '800' },
  prodNombre: { fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 18 },
  prodPrecio: { fontSize: 15, fontWeight: '800', color: VERDE, marginTop: 6 },

  accionesCol: { justifyContent: 'space-around', paddingRight: 12, paddingVertical: 8 },
  btnAction: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnDisponible: { backgroundColor: '#f0fdf4' },
  btnOculto: { backgroundColor: '#f3f4f6' },
  btnEliminar: { backgroundColor: '#fef2f2' },

  emptyTitulo: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 12 },
  emptySubtitulo: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  btnCrearPrimero: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: VERDE,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 20,
  },
  btnCrearTexto: { color: '#fff', fontWeight: '800', fontSize: 15 },
})
