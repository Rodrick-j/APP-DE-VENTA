// app/productor/[id].tsx
// Perfil público de un productor — muestra información institucional, puntos de venta y catálogo completo

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, FlatList, ActivityIndicator, Linking,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

const VERDE = '#1a7a4a'

export default function ProductorPublicoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  // 1. Obtener datos del productor
  const { data: productor, isLoading: loadingProductor } = useQuery({
    queryKey: ['productor-publico', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('productores')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  // 2. Obtener productos activos de este productor
  const { data: productos, isLoading: loadingProductos } = useQuery({
    queryKey: ['productor-productos', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('vista_productos_completos')
        .select('*')
        .eq('productor_id', id)
      if (error) throw error
      return data ?? []
    },
    enabled: !!id,
  })

  // 3. Obtener puntos de venta
  const { data: puntosVenta } = useQuery({
    queryKey: ['productor-puntos', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('puntos_venta')
        .select('*')
        .eq('productor_id', id)
        .eq('activo', true)
      if (error) throw error
      return data ?? []
    },
    enabled: !!id,
  })

  if (loadingProductor) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={VERDE} />
      </View>
    )
  }

  if (!productor) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>😕</Text>
        <Text style={styles.tituloError}>Productor no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnTexto}>← Volver</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const abrirContacto = (tipo: 'whatsapp' | 'telefono' | 'facebook' | 'web') => {
    let url = ''
    if (tipo === 'whatsapp' && productor.whatsapp) {
      url = `whatsapp://send?phone=${productor.whatsapp.replace(/\D/g, '')}&text=Hola, vi su perfil en el marketplace Consume lo Nuestro.`
    } else if (tipo === 'telefono' && productor.telefono) {
      url = `tel:${productor.telefono}`
    } else if (tipo === 'facebook' && productor.facebook_url) {
      url = productor.facebook_url
    } else if (tipo === 'web' && productor.website_url) {
      url = productor.website_url
    }
    if (url) Linking.openURL(url).catch(() => {})
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Portada e Identidad */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          {productor.estado === 'verificado' && (
            <View style={styles.badgeVerificado}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.badgeVerificadoTexto}>Verificado por Gobernación</Text>
            </View>
          )}
        </View>

        <View style={styles.logoRow}>
          {productor.logo_url ? (
            <Image source={{ uri: productor.logo_url }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoEmoji}>🌾</Text>
            </View>
          )}
          <View style={styles.infoHeader}>
            <Text style={styles.nombreEmpresa}>{productor.nombre_empresa}</Text>
            <View style={styles.tipoRow}>
              <View style={styles.tipoTag}>
                <Text style={styles.tipoTexto}>{productor.tipo}</Text>
              </View>
              <Text style={styles.municipioTexto}>📍 {productor.municipio}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.contenido}>
        {/* Descripción */}
        {productor.descripcion && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Acerca del Productor</Text>
            <Text style={styles.descripcion}>{productor.descripcion}</Text>
          </View>
        )}

        {/* Canales de Contacto Rápidos */}
        <View style={styles.contactoRow}>
          {productor.whatsapp && (
            <TouchableOpacity style={[styles.contactoBtn, { backgroundColor: '#25d366' }]} onPress={() => abrirContacto('whatsapp')}>
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.contactoBtnTexto}>WhatsApp</Text>
            </TouchableOpacity>
          )}
          {productor.telefono && (
            <TouchableOpacity style={[styles.contactoBtn, { backgroundColor: VERDE }]} onPress={() => abrirContacto('telefono')}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.contactoBtnTexto}>Llamar</Text>
            </TouchableOpacity>
          )}
          {productor.facebook_url && (
            <TouchableOpacity style={[styles.contactoIconBtn, { backgroundColor: '#1877f2' }]} onPress={() => abrirContacto('facebook')}>
              <Ionicons name="logo-facebook" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          {productor.website_url && (
            <TouchableOpacity style={[styles.contactoIconBtn, { backgroundColor: '#64748b' }]} onPress={() => abrirContacto('web')}>
              <Ionicons name="globe-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Puntos de Venta */}
        {puntosVenta && puntosVenta.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>📍 Puntos de Venta y Atención</Text>
            {puntosVenta.map((punto: any) => (
              <View key={punto.id} style={styles.puntoCard}>
                <View style={styles.puntoHeader}>
                  <Text style={styles.puntoNombre}>{punto.nombre}</Text>
                  {punto.es_principal && <View style={styles.tagPrincipal}><Text style={styles.tagPrincipalTexto}>Principal</Text></View>}
                </View>
                <Text style={styles.puntoDireccion}>{punto.direccion}</Text>
                {punto.referencia && <Text style={styles.puntoRef}>Nota: {punto.referencia}</Text>}
                {punto.horario_texto && <Text style={styles.puntoHorario}>⏰ {punto.horario_texto}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Catálogo de Productos */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>
            📦 Catálogo de Productos ({productos?.length ?? 0})
          </Text>

          {loadingProductos ? (
            <ActivityIndicator color={VERDE} style={{ marginVertical: 20 }} />
          ) : productos && productos.length > 0 ? (
            <View style={styles.gridProductos}>
              {productos.map((prod: any) => (
                <TouchableOpacity
                  key={prod.id}
                  style={styles.cardProducto}
                  onPress={() => router.push(`/producto/${prod.id}`)}
                >
                  {prod.imagen_principal ? (
                    <Image source={{ uri: prod.imagen_principal }} style={styles.prodImg} />
                  ) : (
                    <View style={[styles.prodImgPlaceholder, { backgroundColor: (prod.categoria_color ?? VERDE) + '22' }]}>
                      <Text style={{ fontSize: 32 }}>📦</Text>
                    </View>
                  )}
                  <View style={styles.prodInfo}>
                    <Text style={styles.prodNombre} numberOfLines={2}>{prod.nombre}</Text>
                    <Text style={styles.prodPrecio}>
                      {prod.precio ? `Bs. ${prod.precio.toFixed(2)}` : 'Consultar'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyProductos}>
              <Text style={{ fontSize: 36 }}>🏷️</Text>
              <Text style={styles.emptyTexto}>Este productor aún no tiene productos publicados.</Text>
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emoji: { fontSize: 48, marginBottom: 10 },
  tituloError: { fontSize: 18, fontWeight: '700', color: '#374151' },
  backBtn: { marginTop: 16, padding: 10 },
  backBtnTexto: { color: VERDE, fontWeight: '700' },

  header: {
    backgroundColor: VERDE, padding: 20, paddingTop: 44,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  circleBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  badgeVerificado: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  badgeVerificadoTexto: { color: '#fff', fontSize: 12, fontWeight: '700' },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logo: { width: 74, height: 74, borderRadius: 37, borderWidth: 3, borderColor: '#fff' },
  logoPlaceholder: {
    width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff',
  },
  logoEmoji: { fontSize: 36 },
  infoHeader: { flex: 1 },
  nombreEmpresa: { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 28 },
  tipoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  tipoTag: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  tipoTexto: { color: VERDE, fontSize: 11, fontWeight: '800' },
  municipioTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },

  contenido: { padding: 16, paddingBottom: 60 },
  seccion: { marginBottom: 24 },
  seccionTitulo: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  descripcion: { fontSize: 14, color: '#4b5563', lineHeight: 22 },

  contactoRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  contactoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14,
    justifyContent: 'center', flex: 1,
  },
  contactoBtnTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  contactoIconBtn: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },

  puntoCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb',
  },
  puntoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  puntoNombre: { fontSize: 15, fontWeight: '700', color: '#111827' },
  tagPrincipal: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tagPrincipalTexto: { color: VERDE, fontSize: 10, fontWeight: '700' },
  puntoDireccion: { fontSize: 13, color: '#4b5563', marginBottom: 4 },
  puntoRef: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginBottom: 4 },
  puntoHorario: { fontSize: 12, color: VERDE, fontWeight: '600' },

  gridProductos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardProducto: {
    width: '48%', backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2,
  },
  prodImg: { width: '100%', height: 120 },
  prodImgPlaceholder: { width: '100%', height: 120, justifyContent: 'center', alignItems: 'center' },
  prodInfo: { padding: 10 },
  prodNombre: { fontSize: 13, fontWeight: '700', color: '#111827', lineHeight: 18 },
  prodPrecio: { fontSize: 14, fontWeight: '800', color: VERDE, marginTop: 6 },

  emptyProductos: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderRadius: 14 },
  emptyTexto: { color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 8 },
})
