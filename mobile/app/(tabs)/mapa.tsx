// app/(tabs)/mapa.tsx
// Mapa de productores con PostGIS — muestra puntos de venta cercanos

import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Linking, Modal,
} from 'react-native'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { useProductoresCercanos } from '../../hooks/useProductos'
import MapRenderer from '../../components/MapRenderer'

const VERDE = '#1a7a4a'
// Coordenadas del centro de Oruro, Bolivia
const ORURO_CENTER = { latitude: -17.9833, longitude: -67.1500 }

export default function MapaScreen() {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [radio, setRadio] = useState(15)
  const [selectedProductor, setSelectedProductor] = useState<any>(null)

  const { data: productores, isLoading } = useProductoresCercanos(
    userLocation?.latitude ?? ORURO_CENTER.latitude,
    userLocation?.longitude ?? ORURO_CENTER.longitude,
    radio
  )

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

  return (
    <View style={styles.container}>

      {/* Controles del mapa */}
      <View style={styles.controles}>
        <View style={styles.controlesLeft}>
          <Text style={styles.contadorTexto}>
            {isLoading ? '...' : `${productores?.length ?? 0}`} productores
          </Text>
          {locationError && (
            <Text style={styles.locationError}>📍 {locationError}</Text>
          )}
        </View>
        <View style={styles.radioControl}>
          <TouchableOpacity onPress={() => setRadio(r => Math.max(5, r - 5))}>
            <Ionicons name="remove-circle-outline" size={22} color={VERDE} />
          </TouchableOpacity>
          <Text style={styles.radioTexto}>{radio}km</Text>
          <TouchableOpacity onPress={() => setRadio(r => Math.min(50, r + 5))}>
            <Ionicons name="add-circle-outline" size={22} color={VERDE} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Leyenda de colores */}
      <View style={styles.leyenda}>
        {Object.entries(tipoColores).slice(0, 4).map(([tipo, color]) => (
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
      />

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={VERDE} />
          <Text style={styles.loadingTexto}>Cargando productores...</Text>
        </View>
      )}

      {/* Modal de detalle del productor */}
      <Modal
        visible={!!selectedProductor}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProductor(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setSelectedProductor(null)}
          activeOpacity={1}
        >
          <View style={styles.modalCard}>
            {selectedProductor && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalTipoBadge, { backgroundColor: tipoColores[selectedProductor.tipo] ?? VERDE }]}>
                    <Text style={styles.modalTipoTexto}>{selectedProductor.tipo}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedProductor(null)}>
                    <Ionicons name="close" size={22} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalNombre}>{selectedProductor.nombre_empresa}</Text>
                <Text style={styles.modalMunicipio}>📍 {selectedProductor.municipio}</Text>
                <Text style={styles.modalDistancia}>
                  🚶 {selectedProductor.distancia_km.toFixed(1)} km de distancia
                </Text>
                <Text style={styles.modalProductos}>
                  📦 {selectedProductor.total_productos} productos disponibles
                </Text>

                <View style={styles.modalBotones}>
                  {selectedProductor.whatsapp && (
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: '#25d366' }]}
                      onPress={() => abrirWhatsApp(selectedProductor.whatsapp)}
                    >
                      <Text style={styles.modalBtnTexto}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: VERDE }]}
                    onPress={() => {
                      setSelectedProductor(null)
                    }}
                  >
                    <Text style={styles.modalBtnTexto}>👁️ Ver perfil</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  controles: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  controlesLeft: { flex: 1 },
  contadorTexto: { fontSize: 14, fontWeight: '700', color: '#111827' },
  locationError: { fontSize: 10, color: '#d97706', marginTop: 2 },
  radioControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioTexto: { fontSize: 14, fontWeight: '700', color: VERDE, minWidth: 40, textAlign: 'center' },

  leyenda: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 6, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leyendaPunto: { width: 8, height: 8, borderRadius: 4 },
  leyendaTexto: { fontSize: 10, color: '#6b7280', fontWeight: '600' },

  mapa: { flex: 1 },

  marcador: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  marcadorEmoji: { fontSize: 16 },

  btnUbicacion: {
    position: 'absolute', right: 16, bottom: 30,
    backgroundColor: '#fff', borderRadius: 28,
    width: 48, height: 48, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
    borderWidth: 1, borderColor: '#e5e7eb',
  },

  loadingOverlay: {
    position: 'absolute', top: '50%', left: '50%',
    transform: [{ translateX: -60 }, { translateY: -20 }],
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  loadingTexto: { fontSize: 13, color: '#374151' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTipoBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  modalTipoTexto: { color: '#fff', fontSize: 12, fontWeight: '700' },
  modalNombre: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  modalMunicipio: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  modalDistancia: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  modalProductos: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  modalBotones: { flexDirection: 'row', gap: 10 },
  modalBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  modalBtnTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
