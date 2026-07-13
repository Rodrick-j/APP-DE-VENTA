// components/MapRenderer.native.tsx
// Renderizador de mapa para iOS y Android utilizando react-native-maps y PostGIS

import React, { useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'

interface MapRendererProps {
  productores: any[]
  userLocation: { latitude: number; longitude: number } | null
  oruroCenter: { latitude: number; longitude: number }
  tipoColores: Record<string, string>
  onSelectProductor: (prod: any) => void
  verde: string
}

export default function MapRenderer({
  productores,
  userLocation,
  oruroCenter,
  tipoColores,
  onSelectProductor,
  verde,
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
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
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
            key={prod.productor_id}
            coordinate={{ latitude: prod.latitud, longitude: prod.longitud }}
            onPress={() => onSelectProductor(prod)}
          >
            <View style={[styles.marcador, { backgroundColor: tipoColores[prod.tipo] ?? verde }]}>
              <Text style={styles.marcadorEmoji}>🌾</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity style={[styles.btnUbicacion, { borderColor: verde }]} onPress={irAMiUbicacion}>
        <Ionicons name="locate" size={22} color={verde} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
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
  },
})
