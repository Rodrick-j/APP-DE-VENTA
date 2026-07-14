// components/MapRenderer.native.tsx
// Renderizador de mapa para iOS y Android utilizando react-native-maps y PostGIS con visualización de productos vendidos

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { obtenerProductosDeProductor } from './MapRenderer.web'

interface MapRendererProps {
  productores: any[]
  userLocation: { latitude: number; longitude: number } | null
  oruroCenter: { latitude: number; longitude: number }
  tipoColores: Record<string, string>
  onSelectProductor: (prod: any) => void
  verde: string
  radio?: number
}

export default function MapRenderer({
  productores,
  userLocation,
  oruroCenter,
  tipoColores,
  onSelectProductor,
  verde,
  radio = 15,
}: MapRendererProps) {
  const mapRef = useRef<MapView>(null)

  const irAMiUbicacion = () => {
    const coords = userLocation ?? oruroCenter
    mapRef.current?.animateToRegion({
      ...coords,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 800)
  }

  return (
    <View style={styles.container}>
      {/* Marco de mapa nativo */}
      <View style={styles.mapContainerWrap}>
        <View style={styles.mapBadge}>
          <View style={styles.mapBadgeLeft}>
            <Ionicons name="map" size={16} color={verde} />
            <Text style={styles.mapBadgeTitle}>Mapa Interactivo Georreferenciado</Text>
          </View>
          <View style={styles.mapBadgeRight}>
            <Text style={[styles.mapBadgeStats, { color: verde }]}>
              📍 {productores?.length ?? 0} ubicados
            </Text>
          </View>
        </View>

        <MapView
          ref={mapRef}
          style={styles.mapContainer}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude: oruroCenter.latitude,
            longitude: oruroCenter.longitude,
            latitudeDelta: 0.15,
            longitudeDelta: 0.15,
          }}
          showsUserLocation={!!userLocation}
          showsMyLocationButton={false}
          showsCompass={true}
        >
          {productores?.map((prod: any) => (
            <Marker
              key={prod.productor_id || prod.id}
              coordinate={{ latitude: prod.latitud, longitude: prod.longitud }}
              onPress={() => onSelectProductor(prod)}
            >
              <View style={[styles.marcador, { backgroundColor: tipoColores[prod.tipo] ?? verde }]}>
                <Text style={styles.marcadorEmoji}>📍</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        <TouchableOpacity style={[styles.btnUbicacion, { borderColor: verde }]} onPress={irAMiUbicacion} activeOpacity={0.85}>
          <Ionicons name="locate" size={22} color={verde} />
        </TouchableOpacity>
      </View>

      {/* Tarjetas inferiores con qué productos vende cada uno en Móvil */}
      <View style={styles.overlayBar}>
        <View style={styles.overlayHeaderRow}>
          <Text style={styles.overlayHeader}>
            ✨ Directorio Georreferenciado de Productores ({productores?.length ?? 0})
          </Text>
          <Text style={styles.overlaySubheader}>
            Toca una tarjeta para centrar y explorar su catálogo de productos.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
          {productores?.map((prod: any) => {
            const productosVendidos = obtenerProductosDeProductor(prod)
            const nombresProductos = productosVendidos.map(p => p.nombre.split(' (')[0]).slice(0, 2).join(', ')

            return (
              <TouchableOpacity
                key={prod.productor_id || prod.id}
                style={[styles.card, { borderLeftColor: tipoColores[prod.tipo] ?? verde }]}
                onPress={() => {
                  mapRef.current?.animateToRegion({
                    latitude: prod.latitud,
                    longitude: prod.longitud,
                    latitudeDelta: 0.03,
                    longitudeDelta: 0.03,
                  }, 600)
                  onSelectProductor(prod)
                }}
                activeOpacity={0.9}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: tipoColores[prod.tipo] ?? verde }]}>
                    <Text style={styles.badgeText}>{prod.tipo}</Text>
                  </View>
                  <View style={styles.distBadge}>
                    <Text style={styles.distText}>🚶 {prod.distancia_km?.toFixed(1) ?? '1.0'} km</Text>
                  </View>
                </View>

                <Text style={styles.empresaText} numberOfLines={1}>{prod.nombre_empresa}</Text>
                
                <View style={styles.muniRow}>
                  <Ionicons name="location-sharp" size={13} color="#64748b" />
                  <Text style={styles.muniText} numberOfLines={1}>{prod.municipio}</Text>
                </View>
                
                {/* Indicador de qué vende */}
                <View style={styles.vendeBox}>
                  <Text style={styles.vendeLabel}>📦 Catálogo en venta:</Text>
                  <Text style={styles.vendeList} numberOfLines={2}>
                    {nombresProductos || 'Catálogo de especialidad disponible'}
                  </Text>
                </View>

                <View style={styles.verDetalleRow}>
                  <View style={[styles.verDetalleBtn, { borderColor: '#86efac' }]}>
                    <Text style={[styles.verDetalleTxt, { color: verde }]}>Ver Catálogo y Contacto →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
          {(!productores || productores.length === 0) && (
            <View style={styles.emptyCard}>
              <Ionicons name="search-outline" size={36} color="#9ca3af" />
              <Text style={styles.emptyTitle}>Sin productores en este radio</Text>
              <Text style={styles.emptyText}>Intenta ampliar el radio de kilómetros arriba.</Text>
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
  },
  mapContainerWrap: {
    height: 420,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  mapContainer: {
    flex: 1,
  },
  mapBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  mapBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapBadgeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  mapBadgeRight: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  mapBadgeStats: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  marcador: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  marcadorEmoji: {
    fontSize: 16,
  },
  btnUbicacion: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#ffffff',
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1.5,
  },
  overlayBar: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    marginHorizontal: 16,
    marginBottom: 30,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 5,
  },
  overlayHeaderRow: {
    marginBottom: 14,
  },
  overlayHeader: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  overlaySubheader: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
  },
  cardsScroll: {
    gap: 14,
    paddingRight: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    width: 275,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  distBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  distText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '700',
  },
  empresaText: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#0f172a',
  },
  muniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  muniText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  vendeBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  vendeLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  vendeList: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
    marginTop: 2,
    fontWeight: '600',
  },
  verDetalleRow: {
    marginTop: 12,
  },
  verDetalleBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  verDetalleTxt: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: 320,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#334155',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
})

