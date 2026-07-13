// app/admin/index.tsx
// 🏛️ PANEL DE CONTROL DE LA GOBERNACIÓN — Consume lo Nuestro
// Permite aprobar o rechazar productores y visualizar las métricas clave de Oruro

import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, TextInput,
  Alert, StatusBar, Modal, FlatList,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

const VERDE = '#1a7a4a'
const VERDE_DEEP = '#0a4f2e'
const ROJO = '#ef4444'
const GRIS_TEXTO = '#6b7280'
const GOLD = '#f59e0b'

interface Stats {
  total_productores: number
  productores_verificados: number
  productores_pendientes: number
  total_productos: number
  total_contactos: number
}

export default function AdminScreen() {
  const { user, perfil } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activoTab, setActivoTab] = useState<'pendientes' | 'todos'>('pendientes')
  const [busqueda, setBusqueda] = useState('')

  // Datos
  const [stats, setStats] = useState<Stats | null>(null)
  const [productores, setProductores] = useState<any[]>([])

  // Modal para rechazar
  const [rechazarModalVisible, setRechazarModalVisible] = useState(false)
  const [productorARechazar, setProductorARechazar] = useState<any>(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [accionLoading, setAccionLoading] = useState(false)

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // 1. Cargar estadísticas generales desde la vista
      const { data: statsData, error: statsErr } = await supabase
        .from('vista_dashboard_stats')
        .select('*')
        .single()

      if (!statsErr && statsData) {
        setStats(statsData as Stats)
      }

      // 2. Cargar productores según tab
      let query = supabase
        .from('vista_productores_stats')
        .select('*')
        .order('created_at', { ascending: false })

      if (activoTab === 'pendientes') {
        query = query.eq('estado', 'pendiente')
      }

      const { data: prodData, error: prodErr } = await query

      if (prodErr) throw prodErr
      setProductores(prodData || [])

    } catch (e: any) {
      console.error('Error al cargar datos de admin:', e)
      Alert.alert('Error', 'No se pudieron cargar los datos del panel.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await cargarDatos()
    setRefreshing(false)
  }

  useEffect(() => {
    if (!user || (perfil?.rol !== 'admin' && perfil?.rol !== 'moderador')) {
      Alert.alert('Acceso Denegado', 'Solo personal autorizado de la Gobernación puede ver esta sección.')
      router.replace('/(tabs)/marketplace')
      return
    }
    cargarDatos()
  }, [activoTab])

  // Aprobar productor
  const handleAprobar = async (id: string, nombreEmpresa: string) => {
    Alert.alert(
      'Aprobar Productor',
      `¿Confirmas la verificación de "${nombreEmpresa}"? Esto activará su catálogo en la app.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Verificar',
          onPress: async () => {
            setAccionLoading(true)
            try {
              const { error } = await supabase
                .from('productores')
                .update({
                  estado: 'verificado',
                  revisado_por: user!.id,
                  revisado_at: new Date().toISOString(),
                })
                .eq('id', id)

              if (error) throw error

              // Actualizar rol del perfil asociado a 'productor' por si acaso
              const prod = productores.find(p => p.id === id)
              if (prod?.user_id) {
                await supabase
                  .from('perfiles')
                  .update({ rol: 'productor' })
                  .eq('user_id', prod.user_id)
              }

              Alert.alert('Éxito', `"${nombreEmpresa}" ha sido verificado con éxito.`)
              cargarDatos()
            } catch (err: any) {
              Alert.alert('Error', 'No se pudo verificar al productor: ' + err.message)
            } finally {
              setAccionLoading(false)
            }
          }
        }
      ]
    )
  }

  // Confirmar rechazo
  const handleRechazarConfirmar = async () => {
    if (!motivoRechazo.trim()) {
      Alert.alert('Atención', 'Debes ingresar un motivo para el rechazo.')
      return
    }

    setAccionLoading(true)
    try {
      const { error } = await supabase
        .from('productores')
        .update({
          estado: 'rechazado',
          motivo_rechazo: motivoRechazo.trim(),
          revisado_por: user!.id,
          revisado_at: new Date().toISOString(),
        })
        .eq('id', productorARechazar.id)

      if (error) throw error

      Alert.alert('Rechazado', `Se ha rechazado la solicitud de "${productorARechazar.nombre_empresa}".`)
      setRechazarModalVisible(false)
      setMotivoRechazo('')
      setProductorARechazar(null)
      cargarDatos()
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo rechazar la solicitud: ' + err.message)
    } finally {
      setAccionLoading(false)
    }
  }

  const productoresFiltrados = productores.filter(p =>
    p.nombre_empresa?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.usuario_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.ci_nit?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const estadoColores: Record<string, string> = {
    pendiente: GOLD,
    verificado: VERDE,
    rechazado: ROJO,
    suspendido: '#374151',
  }

  const estadoLabels: Record<string, string> = {
    pendiente: 'Pendiente',
    verificado: 'Verificado',
    rechazado: 'Rechazado',
    suspendido: 'Suspendido',
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* HEADER DE LA GOBERNACIÓN */}
      <LinearGradient colors={[VERDE_DEEP, VERDE]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Gobernación Autónoma</Text>
            <Text style={styles.headerSub}>Secretaría de Desarrollo Productivo</Text>
          </View>
        </View>
        <Text style={styles.bannerTxt}>🏛️ Panel de Control "Consume lo Nuestro"</Text>
      </LinearGradient>

      {/* ESTADÍSTICAS MUNICIPALES */}
      {stats && (
        <View style={styles.statsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
            <View style={[styles.statCard, { borderLeftColor: GOLD }]}>
              <Text style={styles.statValor}>{stats.productores_pendientes ?? 0}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: VERDE }]}>
              <Text style={styles.statValor}>{stats.productores_verificados ?? 0}</Text>
              <Text style={styles.statLabel}>Verificados</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
              <Text style={styles.statValor}>{stats.total_productores ?? 0}</Text>
              <Text style={styles.statLabel}>Productores</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#8b5cf6' }]}>
              <Text style={styles.statValor}>{stats.total_productos ?? 0}</Text>
              <Text style={styles.statLabel}>Productos</Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* SEGMENTED TABS */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activoTab === 'pendientes' && styles.tabButtonActivo]}
          onPress={() => setActivoTab('pendientes')}
        >
          <Text style={[styles.tabText, activoTab === 'pendientes' && styles.tabTextActivo]}>
            Solicitudes ({stats?.productores_pendientes ?? 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activoTab === 'todos' && styles.tabButtonActivo]}
          onPress={() => setActivoTab('todos')}
        >
          <Text style={[styles.tabText, activoTab === 'todos' && styles.tabTextActivo]}>
            Todos ({stats?.total_productores ?? 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* FILTRO DE BÚSQUEDA */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={GRIS_TEXTO} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por empresa, CI/NIT o representante..."
          placeholderTextColor="#9ca3af"
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={18} color="#adb5bd" />
          </TouchableOpacity>
        )}
      </View>

      {/* LISTADO */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={VERDE} />
          <Text style={styles.loadingTxt}>Cargando datos del servidor...</Text>
        </View>
      ) : productoresFiltrados.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[VERDE]} />}
        >
          <Ionicons name="folder-open-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Sin solicitudes</Text>
          <Text style={styles.emptySub}>
            {busqueda ? 'No encontramos registros que coincidan con la búsqueda.' : 'No hay productores para mostrar en este segmento.'}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={productoresFiltrados}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[VERDE]} />}
          renderItem={({ item }) => (
            <View style={styles.producerCard}>
              <View style={styles.cardHeader}>
                <View style={styles.logoWrap}>
                  {item.logo_url ? (
                    <Image source={{ uri: item.logo_url }} style={styles.logoImg} />
                  ) : (
                    <View style={styles.logoLetraWrap}>
                      <Text style={styles.logoLetra}>{(item.nombre_empresa ?? '?')[0].toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={styles.empresaNombre}>{item.nombre_empresa}</Text>
                  <Text style={styles.representante}>Por: {item.usuario_nombre || 'Sin nombre'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: estadoColores[item.estado] + '18' }]}>
                  <Text style={[styles.statusText, { color: estadoColores[item.estado] }]}>
                    {estadoLabels[item.estado]}
                  </Text>
                </View>
              </View>

              {/* Información */}
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag-outline" size={14} color={GRIS_TEXTO} />
                  <Text style={styles.infoTxt}>Tipo: <Text style={styles.negrita}>{item.tipo}</Text></Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="card-outline" size={14} color={GRIS_TEXTO} />
                  <Text style={styles.infoTxt}>CI/NIT: <Text style={styles.negrita}>{item.ci_nit}</Text></Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={14} color={GRIS_TEXTO} />
                  <Text style={styles.infoTxt}>Municipio: <Text style={styles.negrita}>{item.municipio}</Text></Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={14} color={GRIS_TEXTO} />
                  <Text style={styles.infoTxt}>Teléfono: {item.telefono || 'No registrado'}</Text>
                </View>
                {item.motivo_rechazo && (
                  <View style={styles.rechazoBox}>
                    <Text style={styles.rechazoBoxTitle}>Motivo de rechazo:</Text>
                    <Text style={styles.rechazoBoxTxt}>{item.motivo_rechazo}</Text>
                  </View>
                )}
              </View>

              {/* Acciones */}
              {item.estado === 'pendiente' && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.btnAccion, styles.btnRechazar]}
                    disabled={accionLoading}
                    onPress={() => {
                      setProductorARechazar(item)
                      setRechazarModalVisible(true)
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={ROJO} />
                    <Text style={styles.btnAccionTextRechazar}>Rechazar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnAccion, styles.btnAprobar]}
                    disabled={accionLoading}
                    onPress={() => handleAprobar(item.id, item.nombre_empresa)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                    <Text style={styles.btnAccionTextAprobar}>Verificar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* MODAL DE RECHAZO */}
      <Modal visible={rechazarModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={24} color={ROJO} />
              <Text style={styles.modalTitle}>Rechazar Solicitud</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Ingresa el motivo del rechazo para "{productorARechazar?.nombre_empresa}". El productor recibirá este mensaje.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: CI/NIT no es válido, fotos poco claras, datos incompletos..."
              multiline
              numberOfLines={4}
              value={motivoRechazo}
              onChangeText={setMotivoRechazo}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => {
                  setRechazarModalVisible(false)
                  setProductorARechazar(null)
                  setMotivoRechazo('')
                }}
              >
                <Text style={styles.modalBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, !motivoRechazo.trim() && styles.btnDisabled]}
                onPress={handleRechazarConfirmar}
                disabled={!motivoRechazo.trim() || accionLoading}
              >
                <Text style={styles.modalBtnConfirmTxt}>Confirmar Rechazo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  // Header
  header: { paddingTop: 50, paddingBottom: 22, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 19, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  bannerTxt: { fontSize: 13, color: '#fff', fontWeight: '700', marginTop: 4 },

  // Estadísticas
  statsContainer: { marginTop: -14 },
  statsScroll: { paddingHorizontal: 16, gap: 10, paddingBottom: 10 },
  statCard: {
    backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 16, minWidth: 105, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  statValor: { fontSize: 18, fontWeight: '900', color: '#111827' },
  statLabel: { fontSize: 10, color: GRIS_TEXTO, fontWeight: '600', marginTop: 2 },

  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 14, marginHorizontal: 16, marginVertical: 12, padding: 3 },
  tabButton: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 11 },
  tabButtonActivo: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  tabText: { fontSize: 13, color: GRIS_TEXTO, fontWeight: '700' },
  tabTextActivo: { color: VERDE, fontWeight: '800' },

  // Búsqueda
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 12, height: 46, borderWidth: 1.5, borderColor: '#e2e8f0', marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 13, color: '#111827', marginLeft: 8 },

  // Listado
  listContent: { paddingHorizontal: 16, paddingBottom: 50 },
  producerCard: { backgroundColor: '#fff', borderRadius: 20, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 },
  logoWrap: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden' },
  logoImg: { width: '100%', height: '100%' },
  logoLetraWrap: { width: '100%', height: '100%', backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  logoLetra: { fontSize: 18, color: VERDE, fontWeight: '800' },
  cardHeaderInfo: { flex: 1 },
  empresaNombre: { fontSize: 14, fontWeight: '800', color: '#111827' },
  representante: { fontSize: 11, color: GRIS_TEXTO, marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },

  // Body Card
  cardBody: { paddingVertical: 10, gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoTxt: { fontSize: 12, color: '#374151' },
  negrita: { fontWeight: '700', color: '#111827' },
  rechazoBox: { backgroundColor: '#fef2f2', borderLeftWidth: 3, borderLeftColor: ROJO, padding: 8, borderRadius: 8, marginTop: 6 },
  rechazoBoxTitle: { fontSize: 11, color: ROJO, fontWeight: '800' },
  rechazoBoxTxt: { fontSize: 11, color: '#7f1d1d', marginTop: 2 },

  // Acciones Card
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  btnAccion: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  btnRechazar: { borderWidth: 1.5, borderColor: ROJO, backgroundColor: '#fef2f2' },
  btnAprobar: { backgroundColor: VERDE },
  btnAccionTextRechazar: { color: ROJO, fontSize: 12, fontWeight: '700' },
  btnAccionTextAprobar: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Estados
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingTxt: { fontSize: 13, color: GRIS_TEXTO, marginTop: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#374151', marginTop: 14 },
  emptySub: { fontSize: 12, color: GRIS_TEXTO, textAlign: 'center', marginTop: 6, lineHeight: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, width: '100%', maxWidth: 360, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '900', color: '#111827' },
  modalSubtitle: { fontSize: 12, color: GRIS_TEXTO, lineHeight: 18, marginBottom: 14 },
  modalInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, padding: 12, fontSize: 13, height: 90, textAlignVertical: 'top', color: '#111827', marginBottom: 18 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtnCancel: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0' },
  modalBtnCancelTxt: { fontSize: 13, color: GRIS_TEXTO, fontWeight: '700' },
  modalBtnConfirm: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, backgroundColor: ROJO },
  modalBtnConfirmTxt: { fontSize: 13, color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
})
