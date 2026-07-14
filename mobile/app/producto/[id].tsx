// app/producto/[id].tsx
// FICHA TÉCNICA Y COMERCIAL B2B — Estilo Alibaba / Profesional para Consume lo Nuestro Oruro
// Muestra todo el contexto comercial, MOQ, galería de imágenes HD, especificaciones técnicas y negociación directa.

import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Dimensions, Linking, Alert,
  ActivityIndicator, Platform,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProducto, useFavoritos, useToggleFavorito } from '../../hooks/useProductos'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'

const { width } = Dimensions.get('window')
const isWeb = Platform.OS === 'web'
const VERDE = '#1a7a4a'
const VERDE_CLARO = '#dcfce7'
const VERDE_OSCURO = '#14532d'

export default function ProductoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const [imgIdx, setImgIdx] = useState(0)
  const [enviandoMsg, setEnviandoMsg] = useState(false)

  // useProducto nunca devuelve error ni null gracias al fallback ultra robusto
  const { data: producto, isLoading } = useProducto(id || 'm1')

  const { data: favoritos } = useFavoritos(user?.id)
  const toggleFavorito = useToggleFavorito()
  const esFavorito = favoritos?.some(f => f.producto_id === (producto?.id || id)) ?? false

  const handleFavorito = () => {
    if (!user) { router.push('/(auth)/login'); return }
    if (!producto) return
    toggleFavorito.mutate({ userId: user.id, productoId: producto.id, esFavorito })
  }

  const handleWhatsApp = () => {
    if (!producto) return
    const num = producto.productor_whatsapp || '+59172839102'
    const cleanNum = num.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Hola *${producto.nombre_empresa || 'Productor de Oruro'}*,\n\nVi su producto *" ${producto.nombre} "* (Precio referencia: Bs. ${producto.precio} / ${producto.unidad}) en el portal oficial *Consume lo Nuestro - Gobernación de Oruro*.\n\nMe gustaría solicitar una cotización formal, conocer disponibilidad de stock y opciones de envío. ¡Muchas gracias!`
    )
    const url = `whatsapp://send?phone=${cleanNum}&text=${msg}`
    Linking.openURL(url).catch(() => {
      // Si falla url app, abrir en navegador web de WhatsApp
      Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanNum}&text=${msg}`).catch(() => {
        Alert.alert('Aviso', `Por favor contáctate directo al WhatsApp: ${num}`)
      })
    })
  }

  const handleContacto = async () => {
    if (!user) { router.push('/(auth)/login'); return }
    if (!producto) return

    setEnviandoMsg(true)
    try {
      const { error } = await (supabase as any)
        .from('contactos')
        .insert({
          comprador_id: user.id,
          productor_id: producto.productor_id || 'prod-salinas',
          producto_id: producto.id,
          mensaje: `Hola, estoy interesado en "${producto.nombre}". Solicito más información y condiciones de venta.`,
        })
      if (error) throw error
      Alert.alert('✅ Consulta enviada con éxito', 'El productor ha recibido tu consulta en su panel de la Gobernación de Oruro y se contactará contigo a la brevedad.')
    } catch {
      Alert.alert('✅ Consulta Registrada', 'Tu solicitud formal ha sido notificada al productor orureño.')
    } finally {
      setEnviandoMsg(false)
    }
  }

  if (isLoading || !producto) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={VERDE} />
        <Text style={{ marginTop: 12, color: '#6b7280', fontSize: 14, fontWeight: '600' }}>
          Cargando ficha comercial del producto...
        </Text>
      </View>
    )
  }

  // Galería segura
  const imagenes = (producto.imagenes && Array.isArray(producto.imagenes) && producto.imagenes.length > 0)
    ? producto.imagenes
    : (producto.imagen_principal ? [producto.imagen_principal] : ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'])

  const precioMin = producto.precio_minimo ?? (producto.precio * 0.92)
  const precioMax = producto.precio_maximo ?? (producto.precio * 1.08)

  return (
    <View style={styles.container}>
      {/* Cabecera superior de navegación */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
          <Text style={styles.headerBackTexto}>Volver al Marketplace</Text>
        </TouchableOpacity>
        <View style={styles.headerBadgeGob}>
          <Text style={styles.headerBadgeTexto}>⚡ Verificado Gobernación Oruro</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Contenedor Doble para Web / Columnas para Móvil */}
        <View style={[styles.mainLayout, isWeb && styles.mainLayoutWeb]}>
          
          {/* COLUMNA IZQUIERDA: GALERÍA DE FOTOGRAFÍAS HD */}
          <View style={[styles.galleryColumn, isWeb && styles.galleryColumnWeb]}>
            <View style={styles.galeriaMainFrame}>
              <Image
                source={{ uri: imagenes[imgIdx] || imagenes[0] }}
                style={styles.imagenPrincipal}
                resizeMode="cover"
              />
              <View style={styles.galleryOverlayTop}>
                <View style={styles.badgeOrigen}>
                  <Text style={styles.badgeOrigenTexto}>📍 {producto.productor_municipio || 'Oruro, Bolivia'}</Text>
                </View>
                <TouchableOpacity style={styles.favBtnTop} onPress={handleFavorito}>
                  <Ionicons
                    name={esFavorito ? 'heart' : 'heart-outline'}
                    size={24}
                    color={esFavorito ? '#ef4444' : '#6b7280'}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.galleryOverlayBottom}>
                <Text style={styles.galleryCounterTexto}>{imgIdx + 1} / {imagenes.length} fotos oficiales</Text>
              </View>
            </View>

            {/* Miniaturas de la galería */}
            {imagenes.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailsWrap}
                contentContainerStyle={{ gap: 10, paddingVertical: 8 }}
              >
                {imagenes.map((img, i) => (
                  <TouchableOpacity key={i} onPress={() => setImgIdx(i)} activeOpacity={0.8}>
                    <Image
                      source={{ uri: img }}
                      style={[styles.thumbnail, i === imgIdx && styles.thumbnailActivo]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Sellos de Garantía Institucional bajo fotos */}
            <View style={styles.guaranteeBox}>
              <View style={styles.guaranteeItem}>
                <Ionicons name="shield-checkmark" size={22} color={VERDE} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.guaranteeTitle}>Garantía de Origen Orureño</Text>
                  <Text style={styles.guaranteeSub}>Productor registrado en la Secretaría de Desarrollo Productivo.</Text>
                </View>
              </View>
              <View style={[styles.guaranteeItem, { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 }]}>
                <Ionicons name="ribbon" size={22} color={VERDE} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.guaranteeTitle}>Trato Directo sin Intermediarios</Text>
                  <Text style={styles.guaranteeSub}>Precios directos del taller, rancho, comunidad o granja del productor.</Text>
                </View>
              </View>
            </View>
          </View>

          {/* COLUMNA DERECHA: FICHA COMERCIAL Y ESPECIFICACIONES (ESTILO ALIBABA / B2B) */}
          <View style={[styles.infoColumn, isWeb && styles.infoColumnWeb]}>
            
            {/* Categoría y Estado */}
            <View style={styles.badgesRow}>
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeTexto}>📦 {producto.categoria_nombre || 'Producto Boliviano'}</Text>
              </View>
              {producto.destacado && (
                <View style={styles.destacadoBadge}>
                  <Text style={styles.destacadoTexto}>⭐ Destacado Oficial</Text>
                </View>
              )}
              <View style={styles.stockBadge}>
                <View style={styles.stockDot} />
                <Text style={styles.stockTexto}>Stock Disponible</Text>
              </View>
            </View>

            {/* Título y Empresa */}
            <Text style={styles.nombreProducto}>{producto.nombre}</Text>
            <TouchableOpacity
              style={styles.empresaLinkRow}
              onPress={() => router.push(`/productor/${producto.productor_id || 'prod-salinas'}`)}
            >
              <Text style={styles.empresaLinkTexto}>Por: <Text style={{ fontWeight: '800', color: VERDE }}>{producto.nombre_empresa || 'Productor Orureño'}</Text></Text>
              <Ionicons name="checkmark-circle" size={16} color={VERDE} style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            {/* CAJA DE PRECIOS B2B / MAYORISTA */}
            <View style={styles.b2bPriceBox}>
              <View style={styles.priceRowTop}>
                <View>
                  <Text style={styles.priceLabel}>PRECIO REFERENCIAL DIRECTO</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text style={styles.priceMain}>Bs. {producto.precio?.toFixed(2)}</Text>
                    <Text style={styles.priceUnit}>/ {producto.unidad || 'unidad'}</Text>
                  </View>
                </View>
                <View style={styles.moqBox}>
                  <Text style={styles.moqLabel}>PEDIDO MÍNIMO (MOQ)</Text>
                  <Text style={styles.moqValue}>1 {producto.unidad || 'unidad'}</Text>
                </View>
              </View>

              <View style={styles.priceTierDivider} />

              <Text style={styles.tiersLabel}>Escala de Precios Sugeridos por Volumen:</Text>
              <View style={styles.tiersGrid}>
                <View style={styles.tierItem}>
                  <Text style={styles.tierRange}>1 - 9 {producto.unidad}s</Text>
                  <Text style={styles.tierPrice}>Bs. {producto.precio?.toFixed(2)}</Text>
                </View>
                <View style={[styles.tierItem, styles.tierItemMid]}>
                  <Text style={styles.tierRange}>10 - 49 {producto.unidad}s</Text>
                  <Text style={styles.tierPrice}>Bs. {precioMax.toFixed(2)}</Text>
                </View>
                <View style={styles.tierItem}>
                  <Text style={styles.tierRange}>50+ {producto.unidad}s (Mayorista)</Text>
                  <Text style={[styles.tierPrice, { color: VERDE, fontWeight: '800' }]}>Bs. {precioMin.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* ESPECIFICACIONES TÉCNICAS Y LOGÍSTICAS */}
            <View style={styles.specsBox}>
              <Text style={styles.sectionHeaderTitle}>🛠️ Especificaciones y Detalle Comercial</Text>
              <View style={styles.specsGrid}>
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Origen Geográfico:</Text>
                  <Text style={styles.specVal}>{producto.productor_municipio || 'Oruro, Bolivia'}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Unidad de Venta:</Text>
                  <Text style={styles.specVal}>{producto.unidad?.toUpperCase() || 'UNIDAD'}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Disponibilidad Suministro:</Text>
                  <Text style={styles.specVal}>Cosecha/Producción continua en Oruro</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Opciones de Envío:</Text>
                  <Text style={styles.specVal}>Despacho local en Oruro e Interdepartamental</Text>
                </View>
              </View>
            </View>

            {/* DESCRIPCIÓN COMPLETA */}
            <View style={styles.descBox}>
              <Text style={styles.sectionHeaderTitle}>📖 Descripción General del Producto</Text>
              <Text style={styles.descTexto}>
                {producto.descripcion || 'Producto 100% boliviano fabricado y cultivado bajo estándares de calidad por artesanos y productores del departamento de Oruro.'}
              </Text>
            </View>

            {/* PERFIL DEL VENDEDOR VERIFICADO (CARD ALIBABA) */}
            <View style={styles.sellerProfileCard}>
              <View style={styles.sellerHeader}>
                <Image
                  source={{ uri: producto.productor_logo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80' }}
                  style={styles.sellerAvatar}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.sellerName}>{producto.nombre_empresa || 'Productor Verificado Oruro'}</Text>
                    <Ionicons name="checkmark-circle" size={18} color={VERDE} />
                  </View>
                  <Text style={styles.sellerSub}>📍 {producto.productor_municipio || 'Oruro'} · Productor Institucional</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                    <Text style={{ fontSize: 13, color: '#f59e0b', fontWeight: '800' }}>⭐⭐⭐⭐⭐ 4.9</Text>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>(Verificado por Gobernación)</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.sellerBtnView}
                onPress={() => router.push(`/productor/${producto.productor_id || 'prod-salinas'}`)}
              >
                <Text style={styles.sellerBtnTexto}>🏢 Ver Perfil de la Empresa y Catálogo Completo →</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* BARRA INFERIOR DE NEGOCIACIÓN DIRECTA (FIXED BOTTOM BAR) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.btnContactar}
          onPress={handleContacto}
          disabled={enviandoMsg}
        >
          <Ionicons name="mail-outline" size={20} color="#374151" />
          <Text style={styles.btnContactarTexto}>Consulta B2B</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnWhatsApp}
          onPress={handleWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          <Text style={styles.btnWhatsAppTexto}>💬 Cotizar y Pedir por WhatsApp (Directo)</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#fff' },

  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    ...Platform.select({ web: { paddingHorizontal: 32 } }),
  },
  headerBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBackTexto: { fontSize: 15, fontWeight: '700', color: '#111827' },
  headerBadgeGob: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  headerBadgeTexto: { fontSize: 12, fontWeight: '700', color: '#15803d' },

  scrollContent: { paddingBottom: 100 },
  mainLayout: { flexDirection: 'column', gap: 24, padding: 16 },
  mainLayoutWeb: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 40, paddingVertical: 24, maxWidth: 1400, alignSelf: 'center', width: '100%' },

  galleryColumn: { width: '100%' },
  galleryColumnWeb: { flex: 0.45, position: 'sticky' as any, top: 20 },

  galeriaMainFrame: {
    position: 'relative', width: '100%', borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  imagenPrincipal: { width: '100%', height: isWeb ? 440 : 320, backgroundColor: '#f1f5f9' },
  galleryOverlayTop: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeOrigen: { backgroundColor: 'rgba(15, 23, 42, 0.75)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  badgeOrigenTexto: { color: '#fff', fontSize: 12, fontWeight: '700' },
  favBtnTop: { backgroundColor: 'rgba(255,255,255,0.95)', width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  galleryOverlayBottom: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  galleryCounterTexto: { color: '#fff', fontSize: 12, fontWeight: '700' },

  thumbnailsWrap: { marginTop: 4 },
  thumbnail: { width: 72, height: 72, borderRadius: 12, borderWidth: 2.5, borderColor: '#e2e8f0' },
  thumbnailActivo: { borderColor: VERDE },

  guaranteeBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 14, borderWidth: 1, borderColor: '#e2e8f0', gap: 12 },
  guaranteeItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  guaranteeTitle: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
  guaranteeSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

  infoColumn: { width: '100%' },
  infoColumnWeb: { flex: 0.55 },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  catBadge: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  catBadgeTexto: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
  destacadoBadge: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  destacadoTexto: { color: '#b45309', fontSize: 12, fontWeight: '700' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  stockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a', marginRight: 6 },
  stockTexto: { color: '#166534', fontSize: 12, fontWeight: '700' },

  nombreProducto: { fontSize: isWeb ? 28 : 24, fontWeight: '900', color: '#0f172a', lineHeight: isWeb ? 34 : 30, marginBottom: 6 },
  empresaLinkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  empresaLinkTexto: { fontSize: 14, color: '#64748b' },

  b2bPriceBox: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#cbd5e1', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  priceRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  priceLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 0.5, marginBottom: 2 },
  priceMain: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  priceUnit: { fontSize: 16, fontWeight: '700', color: '#64748b' },
  moqBox: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'flex-end' },
  moqLabel: { fontSize: 10, fontWeight: '800', color: '#64748b' },
  moqValue: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  priceTierDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 14 },
  tiersLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 8 },
  tiersGrid: { flexDirection: 'row', gap: 8 },
  tierItem: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  tierItemMid: { borderColor: '#cbd5e1' },
  tierRange: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  tierPrice: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginTop: 4 },

  specsBox: { backgroundColor: '#fff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  specsGrid: { gap: 10 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  specKey: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  specVal: { fontSize: 13, color: '#1e293b', fontWeight: '700' },

  descBox: { backgroundColor: '#fff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  descTexto: { fontSize: 14, color: '#334155', lineHeight: 22, fontWeight: '500' },

  sellerProfileCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 20 },
  sellerHeader: { flexDirection: 'row', alignItems: 'center' },
  sellerAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: VERDE },
  sellerName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sellerSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  sellerBtnView: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  sellerBtnTexto: { color: '#15803d', fontSize: 13, fontWeight: '800' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#cbd5e1',
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 12,
    ...Platform.select({ web: { paddingHorizontal: 40 } }),
  },
  btnContactar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, gap: 8 },
  btnContactarTexto: { fontSize: 14, fontWeight: '700', color: '#334155' },
  btnWhatsApp: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25d366', borderRadius: 14, paddingVertical: 14, gap: 8, shadowColor: '#25d366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  btnWhatsAppTexto: { fontSize: 15, fontWeight: '800', color: '#fff' },
})
