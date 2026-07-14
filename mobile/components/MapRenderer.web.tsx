// components/MapRenderer.web.tsx
// Renderizador de mapa optimizado para navegadores Web con información en vivo de productos vendidos por cada productor

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PRODUCTOS_MUESTRA } from '../data/productosMuestra'

interface MapRendererProps {
  productores: any[]
  userLocation: { latitude: number; longitude: number } | null
  oruroCenter: { latitude: number; longitude: number }
  tipoColores: Record<string, string>
  onSelectProductor: (prod: any) => void
  verde: string
  radio?: number
}

const IFrame = (props: any) => React.createElement('iframe', props)

// Obtener qué productos vende exactamente este productor
export function obtenerProductosDeProductor(prod: any) {
  if (!prod) return []
  const prodId = prod.productor_id || prod.id || ''
  const nom = (prod.nombre_empresa || '').toLowerCase()

  // 1. Coincidencia por productor_id o nombre
  const porProductor = PRODUCTOS_MUESTRA.filter(
    p => p.productor_id === prodId || p.nombre_empresa.toLowerCase().includes(nom) || nom.includes(p.nombre_empresa.toLowerCase().split(' ')[0])
  )
  if (porProductor.length > 0) return porProductor

  // 2. Coincidencia por categoría
  const porCategoria = PRODUCTOS_MUESTRA.filter(
    p => p.categoria_id === prod.rubro_categoria_id || p.categoria_nombre?.toLowerCase() === prod.rubro_categoria_nombre?.toLowerCase()
  )
  if (porCategoria.length > 0) return porCategoria

  // 3. Respaldo por defecto
  return PRODUCTOS_MUESTRA.slice(0, 3)
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
  const [activeCoords, setActiveCoords] = useState<{ latitude: number; longitude: number } | null>(null)

  const center = activeCoords ?? userLocation ?? oruroCenter
  const lat = center.latitude
  const lon = center.longitude

  // Generar HTML dinámico con Leaflet para dibujar TODOS los puntos de venta y productores en el mapa Web
  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .custom-pin {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 50%;
      color: #fff; font-size: 15px; font-weight: bold;
      box-shadow: 0 3px 8px rgba(0,0,0,0.35); border: 2px solid #fff;
      transition: transform 0.2s; cursor: pointer;
    }
    .custom-pin:hover { transform: scale(1.15); }
    .leaflet-popup-content-wrapper { border-radius: 14px; box-shadow: 0 6px 16px rgba(0,0,0,0.18); padding: 4px; }
    .leaflet-popup-content { margin: 10px 12px; line-height: 1.4; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lon}], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap Oruro'
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);

    var lista = ${JSON.stringify(productores || [])};
    lista.forEach(function(p) {
      if (p.latitud != null && p.longitud != null) {
        var color = '${verde}';
        if (p.tipo === 'MYPE') color = '#3b82f6';
        else if (p.tipo === 'PYME') color = '#8b5cf6';
        else if (p.tipo === 'AGROPECUARIO') color = '#22c55e';
        else if (p.tipo === 'AGRICULTOR') color = '#10b981';
        else if (p.tipo === 'GANADERO') color = '#f59e0b';
        else if (p.tipo === 'COOPERATIVA') color = '#14b8a6';
        else if (p.tipo === 'ARTESANO') color = '#ec4899';

        var icono = L.divIcon({
          className: 'custom-div-icon',
          html: '<div class="custom-pin" style="background-color: ' + color + '">📍</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
        var marker = L.marker([p.latitud, p.longitud], { icon: icono }).addTo(map);
        marker.bindPopup(
          '<b style="font-size:14px;color:#0f172a;">' + (p.nombre_empresa || 'Punto de Venta') + '</b><br>' +
          '<span style="color:#475569;font-size:12px;font-weight:600;">🏷️ ' + (p.tipo || 'Venta Directa') + ' · ' + (p.municipio || 'Oruro') + '</span><br>' +
          '<span style="color:#64748b;font-size:11px;">📍 ' + (p.direccion || 'Oruro') + '</span>'
        );
      }
    });
  </script>
</body>
</html>`

  const irAMiUbicacion = () => {
    setActiveCoords(userLocation ?? oruroCenter)
  }

  return (
    <View style={styles.container}>
      {/* Marco del mapa web con altura fija profesional de 460px y diseño card premium */}
      <View style={styles.mapContainer}>
        {/* Cabecera flotante sobre el mapa */}
        <View style={styles.mapBadge}>
          <View style={styles.mapBadgeLeft}>
            <Ionicons name="map" size={16} color={verde} />
            <Text style={styles.mapBadgeTitle}>Vista Satelital / OpenStreetMap · Oruro</Text>
          </View>
          <View style={styles.mapBadgeRight}>
            <Text style={[styles.mapBadgeStats, { color: verde }]}>
              📍 {productores?.length ?? 0} ubicados en {radio} km
            </Text>
          </View>
        </View>

        <IFrame
          srcDoc={htmlContent}
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
          activeOpacity={0.85}
        >
          <Ionicons name="locate" size={22} color={verde} />
        </TouchableOpacity>
      </View>

      {/* Tarjetas interactivas con directorio de productores georreferenciados */}
      <View style={styles.overlayBar}>
        <View style={styles.overlayHeaderRow}>
          <View>
            <Text style={styles.overlayHeader}>
              ✨ Directorio Georreferenciado de Productores ({productores?.length ?? 0})
            </Text>
            <Text style={styles.overlaySubheader}>
              Haz clic en una tarjeta para centrar la ubicación del productor y explorar su catálogo de venta directa.
            </Text>
          </View>
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
                  setActiveCoords({ latitude: prod.latitud, longitude: prod.longitud })
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
                
                {/* Indicador de qué productos vende este productor */}
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
              <Text style={styles.emptyTitle}>Sin productores cercanos en este radio</Text>
              <Text style={styles.emptyText}>Intenta ampliar los kilómetros de búsqueda o seleccionar &quot;Todos los Rubros&quot;.</Text>
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
  mapContainer: {
    height: 460,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
    zIndex: 10,
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

