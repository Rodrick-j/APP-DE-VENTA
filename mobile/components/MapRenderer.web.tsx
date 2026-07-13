// components/MapRenderer.web.tsx
// Renderizador de mapa optimizado para navegadores Web (sin dependencias nativas de react-native-maps)

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface MapRendererProps {
  productores: any[]
  userLocation: { latitude: number; longitude: number } | null
  oruroCenter: { latitude: number; longitude: number }
  tipoColores: Record<string, string>
  onSelectProductor: (prod: any) => void
  verde: string
}

const IFrame = (props: any) => React.createElement('iframe', props)

export default function MapRenderer({
  productores,
  userLocation,
  oruroCenter,
  tipoColores,
  onSelectProductor,
  verde,
}: MapRendererProps) {
  const [activeCoords, setActiveCoords] = useState<{ latitude: number; longitude: number } | null>(null)

  const center = activeCoords ?? userLocation ?? oruroCenter
  const lat = center.latitude
  const lon = center.longitude
  const delta = 0.08

  // URL del mapa OpenStreetMap embed
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}&layer=mapnik&marker=${lat},${lon}`

  const irAMiUbicacion = () => {
    setActiveCoords(userLocation ?? oruroCenter)
  }

  return (
    <View style={styles.container}>
      {/* Marco del mapa web */}
      <View style={styles.mapContainer}>
        <IFrame
          src={mapUrl}
          style={{
            width: '100%',
            height: '100%',
            border: '0px',
          }}
          title="Mapa de Productores Oruro"
        />

        {/* Botón flotante: ir a ubicación / centro */}
        <TouchableOpacity
          style={[styles.btnUbicacion, { borderColor: verde }]}
          onPress={irAMiUbicacion}
        >
          <Ionicons name="locate" size={22} color={verde} />
        </TouchableOpacity>
      </View>

      {/* Tarjetas interactivas flotantes sobre el mapa (para Web) */}
      <View style={styles.overlayBar}>
        <Text style={styles.overlayHeader}>
          📍 {productores?.length ?? 0} Productores disponibles en esta zona (haz clic para ver detalles o centrar):
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
          {productores?.map((prod: any) => (
            <TouchableOpacity
              key={prod.productor_id}
              style={[styles.card, { borderLeftColor: tipoColores[prod.tipo] ?? verde }]}
              onPress={() => {
                setActiveCoords({ latitude: prod.latitud, longitude: prod.longitud })
                onSelectProductor(prod)
              }}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: tipoColores[prod.tipo] ?? verde }]}>
                  <Text style={styles.badgeText}>{prod.tipo}</Text>
                </View>
                <Text style={styles.distText}>🚶 {prod.distancia_km?.toFixed(1) ?? '0.0'} km</Text>
              </View>
              <Text style={styles.empresaText} numberOfLines={1}>{prod.nombre_empresa}</Text>
              <Text style={styles.muniText} numberOfLines={1}>📍 {prod.municipio}</Text>
            </TouchableOpacity>
          ))}
          {(!productores || productores.length === 0) && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay productores registrados en este radio geográfico.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  btnUbicacion: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#ffffff',
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    zIndex: 10,
  },
  overlayBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    maxHeight: 140,
  },
  overlayHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  cardsScroll: {
    gap: 10,
    paddingRight: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    width: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  distText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  empresaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  muniText: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 2,
  },
  emptyCard: {
    padding: 12,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
})
