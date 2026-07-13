// app/producto/[id].tsx
// Detalle completo de un producto

import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Dimensions, Linking, Alert,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProducto, useFavoritos, useToggleFavorito } from '../../hooks/useProductos'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'

const { width } = Dimensions.get('window')
const VERDE = '#1a7a4a'

export default function ProductoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const [imgIdx, setImgIdx] = useState(0)
  const [enviandoMsg, setEnviandoMsg] = useState(false)

  const { data: producto, isLoading, error } = useProducto(id)
  const { data: favoritos } = useFavoritos(user?.id)
  const toggleFavorito = useToggleFavorito()

  const esFavorito = favoritos?.includes(id) ?? false

  const handleFavorito = () => {
    if (!user) { router.push('/(auth)/login'); return }
    toggleFavorito.mutate({ userId: user.id, productoId: id, esFavorito })
  }

  const handleWhatsApp = () => {
    if (!producto?.productor_whatsapp) return
    const msg = encodeURIComponent(
      `Hola, vi tu producto "${producto.nombre}" en la app *Consume lo Nuestro* y me interesa. ¿Podrías darme más información?`
    )
    const url = `whatsapp://send?phone=${producto.productor_whatsapp.replace(/\D/g, '')}&text=${msg}`
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir WhatsApp')
    )
  }

  const handleContacto = async () => {
    if (!user) { router.push('/(auth)/login'); return }
    if (!producto) return

    setEnviandoMsg(true)
    const { error } = await (supabase as any)
      .from('contactos')
      .insert({
        comprador_id: user.id,
        productor_id: producto.productor_id,
        producto_id: id,
        mensaje: `Hola, estoy interesado en "${producto.nombre}". ¿Podría darme más información?`,
      })
    setEnviandoMsg(false)

    if (error) {
      Alert.alert('Error', 'No se pudo enviar el mensaje')
    } else {
      Alert.alert('✅ Mensaje enviado', 'El productor recibirá tu consulta.')
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={VERDE} />
      </View>
    )
  }

  if (error || !producto) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTexto}>Producto no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Volver</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const imagenes = producto.imagenes.length > 0 ? producto.imagenes : []

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Galería de imágenes */}
        <View style={styles.galeriaContainer}>
          {imagenes.length > 0 ? (
            <>
              <Image
                source={{ uri: imagenes[imgIdx] }}
                style={styles.imagenPrincipal}
                resizeMode="cover"
              />
              {imagenes.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbnails}
                  contentContainerStyle={{ gap: 8, padding: 8 }}
                >
                  {imagenes.map((img, i) => (
                    <TouchableOpacity key={i} onPress={() => setImgIdx(i)}>
                      <Image
                        source={{ uri: img }}
                        style={[styles.thumbnail, i === imgIdx && styles.thumbnailActivo]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={[styles.imagenPrincipal, styles.imagenPlaceholder]}>
              <Text style={{ fontSize: 60 }}>📦</Text>
            </View>
          )}

          {/* Botón favorito */}
          <TouchableOpacity style={styles.favBtn} onPress={handleFavorito}>
            <Ionicons
              name={esFavorito ? 'heart' : 'heart-outline'}
              size={24}
              color={esFavorito ? '#ef4444' : '#6b7280'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.contenido}>

          {/* Categoría y badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.catBadge, { backgroundColor: producto.categoria_color + '22' }]}>
              <Text style={[styles.catBadgeTexto, { color: producto.categoria_color }]}>
                {producto.categoria_nombre}
              </Text>
            </View>
            {producto.destacado && (
              <View style={styles.destacadoBadge}>
                <Text style={styles.destacadoTexto}>⭐ Destacado</Text>
              </View>
            )}
          </View>

          {/* Nombre y precio */}
          <Text style={styles.nombre}>{producto.nombre}</Text>
          <Text style={styles.precio}>
            {producto.precio
              ? `Bs. ${producto.precio.toFixed(2)} / ${producto.unidad}`
              : 'Precio a consultar con el productor'}
          </Text>

          {/* Descripción */}
          {producto.descripcion && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Descripción</Text>
              <Text style={styles.descripcion}>{producto.descripcion}</Text>
            </View>
          )}

          {/* Estadísticas */}
          <View style={styles.statsRow}>
            <StatItem emoji="👁️" valor={producto.total_vistas} label="vistas" />
            <StatItem emoji="❤️" valor={producto.total_favoritos} label="favoritos" />
            <StatItem emoji="💬" valor={producto.total_contactos} label="consultas" />
          </View>

          {/* Productor */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Productor</Text>
            <TouchableOpacity
              style={styles.productorCard}
              onPress={() => router.push(`/productor/${producto.productor_id}`)}
              activeOpacity={0.85}
            >
              {producto.productor_logo ? (
                <Image source={{ uri: producto.productor_logo }} style={styles.productorLogo} />
              ) : (
                <View style={styles.productorLogoPlaceholder}>
                  <Text style={{ fontSize: 24 }}>🌾</Text>
                </View>
              )}
              <View style={styles.productorInfo}>
                <Text style={styles.productorNombre}>{producto.nombre_empresa}</Text>
                <Text style={styles.productorTipo}>{producto.productor_tipo}</Text>
                <Text style={styles.productorMunicipio}>📍 {producto.productor_municipio}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* Barra de acciones inferior */}
      <View style={styles.accionesBarra}>
        {producto.productor_whatsapp && (
          <TouchableOpacity
            style={[styles.btnAccion, { backgroundColor: '#25d366' }]}
            onPress={handleWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.btnAccionTexto}>WhatsApp</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btnAccion, { backgroundColor: VERDE, flex: 1 }]}
          onPress={handleContacto}
          disabled={enviandoMsg}
        >
          {enviandoMsg ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              <Text style={styles.btnAccionTexto}>Contactar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

function StatItem({ emoji, valor, label }: { emoji: string; valor: number; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValor}>{valor}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorEmoji: { fontSize: 52, marginBottom: 12 },
  errorTexto: { fontSize: 18, fontWeight: '700', color: '#374151' },
  backLink: { color: VERDE, marginTop: 12, fontSize: 15, fontWeight: '600' },

  galeriaContainer: { position: 'relative' },
  imagenPrincipal: { width, height: 280, backgroundColor: '#f3f4f6' },
  imagenPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  thumbnails: { backgroundColor: '#f3f4f6', maxHeight: 76 },
  thumbnail: { width: 60, height: 60, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbnailActivo: { borderColor: VERDE },
  favBtn: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#fff', borderRadius: 24,
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },

  contenido: { padding: 20, paddingBottom: 100 },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  catBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  catBadgeTexto: { fontSize: 12, fontWeight: '700' },
  destacadoBadge: {
    backgroundColor: '#fef3c7', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  destacadoTexto: { fontSize: 12, fontWeight: '700', color: '#d97706' },

  nombre: { fontSize: 24, fontWeight: '900', color: '#111827', lineHeight: 30 },
  precio: { fontSize: 20, fontWeight: '800', color: VERDE, marginTop: 8 },

  seccion: { marginTop: 24 },
  seccionTitulo: { fontSize: 14, fontWeight: '800', color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  descripcion: { fontSize: 15, color: '#4b5563', lineHeight: 24 },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#f9fafb',
    borderRadius: 16, padding: 16, marginTop: 20, justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statEmoji: { fontSize: 20 },
  statValor: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },

  productorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
    borderRadius: 16, padding: 14, gap: 12,
  },
  productorLogo: { width: 52, height: 52, borderRadius: 26 },
  productorLogoPlaceholder: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center',
  },
  productorInfo: { flex: 1 },
  productorNombre: { fontSize: 15, fontWeight: '700', color: '#111827' },
  productorTipo: { fontSize: 12, color: VERDE, fontWeight: '600', marginTop: 2 },
  productorMunicipio: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  accionesBarra: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 32,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  btnAccion: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, paddingHorizontal: 16,
  },
  btnAccionTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
