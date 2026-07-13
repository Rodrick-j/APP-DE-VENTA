// app/(tabs)/favoritos.tsx
// Lista de productos guardados como favoritos por el usuario

import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { useFavoritos, useToggleFavorito } from '../../hooks/useProductos'

const VERDE = '#1a7a4a'

export default function FavoritosScreen() {
  const { user } = useAuthStore()
  const { data: favoritosIds } = useFavoritos(user?.id)
  const toggleFavorito = useToggleFavorito()

  // Obtener los productos completos de la lista de favoritos
  const { data: productos, isLoading } = useQuery({
    queryKey: ['favoritos', 'completos', favoritosIds],
    queryFn: async () => {
      if (!favoritosIds || favoritosIds.length === 0) return []
      const { data, error } = await supabase
        .from('vista_productos_completos' as any)
        .select('*')
        .in('id', favoritosIds)
      if (error) throw error
      return (data as any[]) ?? []
    },
    enabled: !!user && !!favoritosIds,
  })

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>❤️</Text>
        <Text style={styles.titulo}>Guarda tus favoritos</Text>
        <Text style={styles.subtitulo}>Inicia sesión para guardar productos</Text>
        <TouchableOpacity
          style={styles.btnLogin}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.btnLoginTexto}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={VERDE} />
      </View>
    )
  }

  if (!productos || productos.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>💔</Text>
        <Text style={styles.titulo}>Sin favoritos aún</Text>
        <Text style={styles.subtitulo}>
          Toca el ❤️ en cualquier producto para guardarlo aquí
        </Text>
        <TouchableOpacity
          style={styles.btnExplorar}
          onPress={() => router.push('/(tabs)/marketplace')}
        >
          <Text style={styles.btnExplorarTexto}>Explorar productos</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTexto}>{productos.length} productos guardados</Text>
      </View>
      <FlatList
        data={productos}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }: any) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/producto/${item.id}`)}
            activeOpacity={0.88}
          >
            {item.imagen_principal ? (
              <Image source={{ uri: item.imagen_principal }} style={styles.cardImg} resizeMode="cover" />
            ) : (
              <View style={[styles.cardImgPlaceholder, { backgroundColor: (item.categoria_color ?? '#1a7a4a') + '22' }]}>
                <Text style={{ fontSize: 32 }}>📦</Text>
              </View>
            )}

            <View style={styles.cardInfo}>
              <Text style={styles.cardCategoria}>{item.categoria_nombre}</Text>
              <Text style={styles.cardNombre} numberOfLines={2}>{item.nombre}</Text>
              <Text style={styles.cardEmpresa}>🌾 {item.nombre_empresa}</Text>
              <Text style={styles.cardMunicipio}>📍 {item.productor_municipio}</Text>
              <Text style={styles.cardPrecio}>
                {item.precio ? `Bs. ${item.precio.toFixed(2)}` : 'Precio a consultar'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() =>
                toggleFavorito.mutate({
                  userId: user.id,
                  productoId: item.id,
                  esFavorito: true,
                })
              }
            >
              <Ionicons name="heart" size={22} color="#ef4444" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  header: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  headerTexto: { fontSize: 14, color: '#6b7280', fontWeight: '600' },

  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 40, backgroundColor: '#f3f4f6',
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  titulo: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  btnLogin: {
    marginTop: 24, backgroundColor: VERDE, borderRadius: 16,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  btnLoginTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },

  btnExplorar: {
    marginTop: 24, borderWidth: 2, borderColor: VERDE, borderRadius: 16,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  btnExplorarTexto: { color: VERDE, fontWeight: '700', fontSize: 15 },

  lista: { padding: 12, gap: 10, paddingBottom: 80 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cardImg: { width: 100, height: 110 },
  cardImgPlaceholder: { width: 100, height: 110, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  cardCategoria: { fontSize: 10, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardNombre: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 3, lineHeight: 19 },
  cardEmpresa: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  cardMunicipio: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  cardPrecio: { fontSize: 15, fontWeight: '800', color: VERDE, marginTop: 6 },
  removeBtn: {
    padding: 14, justifyContent: 'center', alignItems: 'center',
  },
})
