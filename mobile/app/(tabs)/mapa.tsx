// app/(tabs)/mapa.tsx
// Mapa interactivo de productores orureños con buscador en tiempo real y visualización completa de qué vende cada productor

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Platform, Linking, Modal, ScrollView, Image,
} from 'react-native'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProductoresCercanos, useProductoresEnMapa, useCategorias } from '../../hooks/useProductos'
import MapRenderer from '../../components/MapRenderer'
import { obtenerProductosDeProductor } from '../../components/MapRenderer.web'

const VERDE = '#1a7a4a'
const VERDE_OSCURO = '#14532d'
// Coordenadas del centro de Oruro, Bolivia
const ORURO_CENTER = { latitude: -17.9833, longitude: -67.1500 }

// Mapeo limpio de emojis por slug para evitar "cheese Lácteos"
function getCategoriaIcono(cat: any) {
  const slug = (cat.slug || '').toLowerCase()
  const nombre = (cat.nombre || '').toLowerCase()
  if (slug.includes('lacteo') || nombre.includes('lácteo') || cat.icono === 'cheese') return '🧀'
  if (slug.includes('carne') || nombre.includes('carne') || cat.icono === 'food-steak') return '🥩'
  if (slug.includes('grano') || nombre.includes('grano') || cat.icono === 'grain') return '🌾'
  if (slug.includes('fruta') || nombre.includes('fruta') || cat.icono === 'food-apple') return '🍎'
  if (slug.includes('artesan') || nombre.includes('artesan')) return '🎨'
  if (slug.includes('textil') || nombre.includes('textil') || cat.icono === 'shirt') return '🧣'
  if (slug.includes('medicin') || nombre.includes('medicin')) return '🌿'
  if (slug.includes('alimento') || nombre.includes('alimento')) return '🍯'
  if (slug.includes('bebida') || nombre.includes('bebida')) return '🥤'
  return '🏷️'
}

export default function MapaScreen() {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [radio, setRadio] = useState(15)
  const [selectedCatId, setSelectedCatId] = useState<string | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductor, setSelectedProductor] = useState<any>(null)

  const { data: categorias = [] } = useCategorias()

  // En móvil usamos búsqueda por radio PostGIS, en Web podemos ver todos los del rubro
  const { data: cercanos, isLoading: loadCercanos } = useProductoresCercanos(
    userLocation?.latitude ?? ORURO_CENTER.latitude,
    userLocation?.longitude ?? ORURO_CENTER.longitude,
    radio,
    selectedCatId
  )
  const { data: enMapaAll, isLoading: loadAll } = useProductoresEnMapa(selectedCatId)

  const productoresRaw = Platform.OS === 'web' && (!cercanos || cercanos.length === 0)
    ? enMapaAll
    : cercanos
  const isLoading = loadCercanos || loadAll

  // Filtrado inteligente por el Buscador superior (Nombre de la empresa, Municipio o PRODUCTOS exactos que vende)
  const productores = (productoresRaw ?? []).filter((prod: any) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    const matchNombre = prod.nombre_empresa?.toLowerCase().includes(q)
    const matchMuni = prod.municipio?.toLowerCase().includes(q)
    const matchRubro = prod.rubro_categoria_nombre?.toLowerCase().includes(q)
    
    // Verificar también si algún producto que vende coincide con la búsqueda
    const productosVendidos = obtenerProductosDeProductor(prod)
    const matchProductos = productosVendidos.some(p => p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q))

    return matchNombre || matchMuni || matchRubro || matchProductos
  })

  useEffect(() => {
    requestLocation()
  }, [])

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setLocationError('Permiso de ubicación denegado. Mostrando Oruro.')
      return
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      })
    } catch {
      setLocationError('No se pudo obtener la ubicación. Mostrando Oruro.')
    }
  }

  const abrirWhatsApp = (numero: string) => {
    const url = `whatsapp://send?phone=${numero.replace(/\D/g, '')}`
    Linking.openURL(url)
  }

  const tipoColores: Record<string, string> = {
    'MYPE': '#3b82f6', 'PYME': '#8b5cf6', 'AGROPECUARIO': '#22c55e',
    'AGRICULTOR': '#10b981', 'GANADERO': '#f59e0b',
    'EMPRENDEDOR': '#f97316', 'ARTESANO': '#ec4899', 'COOPERATIVA': '#14b8a6',
  }

  // Lista de productos del productor seleccionado para el Modal
  const productosDelProductor = selectedProductor ? obtenerProductosDeProductor(selectedProductor) : []

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

      {/* Barra superior con Buscador en Tiempo Real y Controles de Radio */}
      <View style={styles.topHeaderWrap}>
        <View style={styles.searchBarRow}>
          <Ionicons name="search" size={20} color="#15803d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productor, rubro, municipio o producto..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={19} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.controles}>
          <View style={styles.controlesLeft}>
            <View style={styles.statsBadge}>
              <Text style={styles.contadorTexto}>
                📍 Georreferenciados: <Text style={{ fontWeight: '900', color: VERDE }}>{productores?.length ?? 0}</Text> productores
              </Text>
            </View>
            {locationError && (
              <Text style={styles.locationError}>⚠️ {locationError}</Text>
            )}
          </View>
          <View style={styles.radioControl}>
            <TouchableOpacity onPress={() => setRadio(r => Math.max(5, r - 5))} style={styles.radioBtn} activeOpacity={0.7}>
              <Ionicons name="remove" size={18} color={VERDE} />
            </TouchableOpacity>
            <Text style={styles.radioTexto}>{radio} km</Text>
            <TouchableOpacity onPress={() => setRadio(r => Math.min(50, r + 5))} style={styles.radioBtn} activeOpacity={0.7}>
              <Ionicons name="add" size={18} color={VERDE} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Barra de Filtro por Categoría del Consumidor con Emojis Limpios */}
      <View style={styles.catFilterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          <TouchableOpacity
            style={[styles.catChip, !selectedCatId && styles.catChipActivo]}
            onPress={() => setSelectedCatId(undefined)}
            activeOpacity={0.85}
          >
            <Text style={[styles.catChipTxt, !selectedCatId && styles.catChipTxtActivo]}>⭐ Todos los Rubros</Text>
          </TouchableOpacity>
          {categorias.map((cat: any) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, selectedCatId === cat.id && styles.catChipActivo]}
              onPress={() => setSelectedCatId(cat.id === selectedCatId ? undefined : cat.id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.catChipTxt, selectedCatId === cat.id && styles.catChipTxtActivo]}>
                {getCategoriaIcono(cat)} {cat.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Leyenda de colores por Tipo de Productor */}
      <View style={styles.leyenda}>
        <View style={styles.leyendaLabelBox}>
          <Text style={styles.leyendaLabel}>🏷️ Tipos:</Text>
        </View>
        {Object.entries(tipoColores).slice(0, 5).map(([tipo, color]) => (
          <View key={tipo} style={styles.leyendaItem}>
            <View style={[styles.leyendaPunto, { backgroundColor: color }]} />
            <Text style={styles.leyendaTexto}>{tipo}</Text>
          </View>
        ))}
      </View>

      {/* Mapa por plataforma (Web/Native) */}
      <MapRenderer
        productores={productores ?? []}
        userLocation={userLocation}
        oruroCenter={ORURO_CENTER}
        tipoColores={tipoColores}
        onSelectProductor={setSelectedProductor}
        verde={VERDE}
        radio={radio}
      />

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={VERDE} />
          <Text style={styles.loadingTexto}>Actualizando mapa georreferenciado...</Text>
        </View>
      )}

      {/* Modal / Panel de Detalle del Productor con Catálogo Exacto de lo que Vende */}
      <Modal
        visible={!!selectedProductor}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProductor(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setSelectedProductor(null)}
            activeOpacity={1}
          />
          <View style={styles.modalCard}>
            {selectedProductor && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                {/* Cabecera del Productor */}
                <View style={styles.modalHeader}>
                  <View style={[styles.modalTipoBadge, { backgroundColor: tipoColores[selectedProductor.tipo] ?? VERDE }]}>
                    <Text style={styles.modalTipoTexto}>{selectedProductor.tipo}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedProductor(null)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalNombre}>{selectedProductor.nombre_empresa}</Text>
                <View style={styles.modalLocRow}>
                  <Ionicons name="location" size={16} color={VERDE} />
                  <Text style={styles.modalMunicipio}>
                    {selectedProductor.municipio} {selectedProductor.direccion ? `· ${selectedProductor.direccion}` : ''}
                  </Text>
                </View>

                {!!selectedProductor.rubro_categoria_nombre && (
                  <View style={styles.modalRubroBox}>
                    <Text style={styles.modalRubroTxt}>🏷️ Especialidad y Rubro: <Text style={{ fontWeight: '800', color: VERDE }}>{selectedProductor.rubro_categoria_nombre}</Text></Text>
                  </View>
                )}

                {/* SECCIÓN DETALLADA: QUÉ PRODUCTOS EXACTOS VENDE ESTE PRODUCTOR */}
                <View style={styles.productosSection}>
                  <View style={styles.productosHeader}>
                    <Text style={styles.productosTitle}>📦 Catálogo de Productos que Vende este Productor:</Text>
                    <Text style={styles.productosSub}>{productosDelProductor.length} productos disponibles con entrega inmediata</Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productosScroll}>
                    {productosDelProductor.map((prodItem) => (
                      <TouchableOpacity
                        key={prodItem.id}
                        style={styles.productoCardMini}
                        onPress={() => {
                          const idProd = prodItem.id
                          setSelectedProductor(null)
                          router.push(`/producto/${idProd}`)
                        }}
                        activeOpacity={0.9}
                      >
                        <Image source={{ uri: prodItem.imagen_principal }} style={styles.productoMiniImg} />
                        <View style={styles.productoMiniInfo}>
                          <Text style={styles.productoMiniNombre} numberOfLines={2}>{prodItem.nombre}</Text>
                          <Text style={styles.productoMiniPrecio}>Bs. {prodItem.precio.toFixed(2)} <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748b' }}>/{prodItem.unidad}</Text></Text>
                          <View style={styles.productoMiniBtn}>
                            <Text style={styles.productoMiniBtnTxt}>Ver Producto →</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Botones de Acción Inmediata (Catálogo completo, WhatsApp y Ruta GPS) */}
                <Text style={styles.accionesLabel}>⚡ Acciones Directas con el Productor:</Text>
                <View style={styles.modalBotones}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: VERDE_OSCURO }]}
                    onPress={() => {
                      const nombre = selectedProductor.nombre_empresa
                      setSelectedProductor(null)
                      router.push(`/(tabs)/marketplace?query=${encodeURIComponent(nombre)}`)
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="storefront" size={18} color="#fff" />
                    <Text style={styles.modalBtnTexto}>🛍️ Catálogo</Text>
                  </TouchableOpacity>

                  {!!selectedProductor.whatsapp && (
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: '#25d366' }]}
                      onPress={() => abrirWhatsApp(selectedProductor.whatsapp)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                      <Text style={styles.modalBtnTexto}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                  )}

                  {selectedProductor.latitud != null && selectedProductor.longitud != null && (
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: '#3b82f6' }]}
                      onPress={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedProductor.latitud},${selectedProductor.longitud}`
                        Linking.openURL(url)
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="navigate" size={18} color="#fff" />
                      <Text style={styles.modalBtnTexto}>🧭 Ruta GPS</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  topHeaderWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  searchBarRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 14, height: 48, gap: 10, borderWidth: 1.5, borderColor: '#cbd5e1' },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', fontWeight: '600' },
  clearBtn: { padding: 4 },

  controles: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  controlesLeft: { flex: 1 },
  statsBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#86efac', alignSelf: 'flex-start' },
  contadorTexto: { fontSize: 13, fontWeight: '700', color: '#166534' },
  locationError: { fontSize: 11, color: '#d97706', fontWeight: '600', marginTop: 3 },
  radioControl: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1' },
  radioBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  radioTexto: { fontSize: 13, fontWeight: '800', color: VERDE, minWidth: 46, textAlign: 'center' },

  catFilterWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 12 },
  catScroll: { paddingHorizontal: 16, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 22, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#cbd5e1' },
  catChipActivo: { backgroundColor: '#15803d', borderColor: '#15803d' },
  catChipTxt: { fontSize: 12.5, fontWeight: '700', color: '#475569' },
  catChipTxtActivo: { color: '#ffffff', fontWeight: '800' },

  leyenda: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', marginHorizontal: 16, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', flexWrap: 'wrap', gap: 12 },
  leyendaLabelBox: { marginRight: 2 },
  leyendaLabel: { fontSize: 11.5, fontWeight: '800', color: '#334155' },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  leyendaPunto: { width: 10, height: 10, borderRadius: 5 },
  leyendaTexto: { fontSize: 11, color: '#475569', fontWeight: '700' },

  loadingOverlay: {
    position: 'absolute', top: '48%', left: '50%',
    transform: [{ translateX: -110 }, { translateY: -25 }],
    backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6, borderWidth: 1, borderColor: '#86efac',
    zIndex: 50,
  },
  loadingTexto: { fontSize: 13, fontWeight: '700', color: '#15803d' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, maxHeight: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTipoBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  modalTipoTexto: { color: '#fff', fontSize: 12, fontWeight: '800' },
  modalCloseBtn: { padding: 4, backgroundColor: '#f1f5f9', borderRadius: 16 },
  modalNombre: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
  modalLocRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  modalMunicipio: { fontSize: 13.5, color: '#475569', fontWeight: '600', flex: 1 },
  
  modalRubroBox: { backgroundColor: '#f0fdf4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#86efac', marginBottom: 16 },
  modalRubroTxt: { fontSize: 13, color: '#166534', fontWeight: '600' },

  // Sección Qué Productos Vende
  productosSection: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: '#cbd5e1', marginBottom: 18 },
  productosHeader: { marginBottom: 12 },
  productosTitle: { fontSize: 15, fontWeight: '900', color: '#0f172a' },
  productosSub: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '500' },
  productosScroll: { gap: 14, paddingBottom: 4 },
  productoCardMini: { width: 170, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  productoMiniImg: { width: '100%', height: 110, backgroundColor: '#f1f5f9' },
  productoMiniInfo: { padding: 10, justifyContent: 'space-between', flex: 1 },
  productoMiniNombre: { fontSize: 12.5, fontWeight: '800', color: '#1e293b', lineHeight: 16, height: 32 },
  productoMiniPrecio: { fontSize: 14, fontWeight: '900', color: VERDE, marginTop: 4 },
  productoMiniBtn: { marginTop: 8, backgroundColor: '#f0fdf4', paddingVertical: 6, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#86efac' },
  productoMiniBtnTxt: { fontSize: 11, fontWeight: '800', color: '#15803d' },

  accionesLabel: { fontSize: 13, fontWeight: '800', color: '#334155', marginBottom: 10 },
  modalBotones: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  modalBtn: { flex: 1, minWidth: 105, flexDirection: 'row', gap: 6, borderRadius: 16, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  modalBtnTexto: { color: '#fff', fontWeight: '800', fontSize: 13 },
})
