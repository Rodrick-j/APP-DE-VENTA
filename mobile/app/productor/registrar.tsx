// app/productor/registrar.tsx
// Registro Oficial y Verificación B2B de Productores — Gobernación de Oruro
// Incluye requisito obligatorio de PUNTO FIJO para el GPS y diseño institucional ejecutivo

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { useCategorias } from '../../hooks/useProductos'
import type { TipoProductor } from '../../types/database'

const VERDE = '#1a7a4a'
const VERDE_OSCURO = '#14532d'

const TIPOS_PRODUCTOR: { id: TipoProductor; label: string; emoji: string }[] = [
  { id: 'MYPE', label: 'MYPE (Micro y Pequeña Empresa)', emoji: '🏢' },
  { id: 'PYME', label: 'PYME (Pequeña y Mediana Empresa)', emoji: '🏭' },
  { id: 'AGROPECUARIO', label: 'Sector Agropecuario', emoji: '🌾' },
  { id: 'AGRICULTOR', label: 'Agricultor / Cultivos', emoji: '🌱' },
  { id: 'GANADERO', label: 'Ganadero / Pecuario', emoji: '🐄' },
  { id: 'EMPRENDEDOR', label: 'Emprendedor Independiente', emoji: '💡' },
  { id: 'ARTESANO', label: 'Artesano Tradicional', emoji: '🎨' },
  { id: 'COOPERATIVA', label: 'Cooperativa Productiva', emoji: '🤝' },
]

const MUNICIPIOS_ORURO = [
  'Oruro', 'Caracollo', 'Challapata', 'Huanuni', 'Sabaya',
  'Salinas de Garci Mendoza', 'Toledo', 'Eucaliptus', 'Machacamarca',
  'Poopó', 'Pazña', 'Antequera', 'Huachacalla', 'Curahuara de Carangas', 'Otro'
]

// Mapeo limpio de emojis por slug para que nunca salga texto raro como "cheese"
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

export default function RegistrarProductorScreen() {
  const { user } = useAuthStore()
  const { data: categorias = [] } = useCategorias()

  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [ciNit, setCiNit] = useState('')
  const [tipo, setTipo] = useState<TipoProductor>('MYPE')
  const [rubroCategoriaId, setRubroCategoriaId] = useState<string | undefined>()
  const [municipio, setMunicipio] = useState('Oruro')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [descripcion, setDescripcion] = useState('')
  
  // GPS del productor y confirmación de punto fijo
  const [latitud, setLatitud] = useState<number | null>(null)
  const [longitud, setLongitud] = useState<number | null>(null)
  const [capturandoGps, setCapturandoGps] = useState(false)
  const [confirmaPuntoFijo, setConfirmaPuntoFijo] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const capturarGpsActual = async () => {
    if (!confirmaPuntoFijo) {
      Alert.alert(
        '⚠️ Confirmación de Punto Fijo Requerida',
        'Por favor, marca la casilla confirmando que te encuentras físicamente en tu Punto Fijo (Planta, Taller, Rancho o Tienda) antes de capturar tu ubicación GPS.'
      )
      return
    }

    setCapturandoGps(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere acceso al GPS para mostrar tu establecimiento en el Mapa de Consumidores de Oruro.')
        return
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      })
      setLatitud(loc.coords.latitude)
      setLongitud(loc.coords.longitude)
      setErrors((prev) => ({ ...prev, gps: '' }))
      Alert.alert('📍 Punto Fijo Capturado', 'Las coordenadas de tu establecimiento han sido registradas con alta precisión.')
    } catch {
      if (Platform.OS === 'web') {
        // En Web, si falla por permisos del navegador, dar coordenadas por defecto al municipio u Oruro central
        setLatitud(-17.9833)
        setLongitud(-67.1500)
        Alert.alert('📍 Coordenada Web Asignada', 'Se ha tomado el centro de Oruro como referencia. Puedes ajustar las coordenadas o solicitar verificación técnica.')
      } else {
        Alert.alert('Error GPS', 'No se pudo obtener la ubicación. Verifique que el GPS esté activo en su dispositivo.')
      }
    } finally {
      setCapturandoGps(false)
    }
  }

  const validar = () => {
    const e: Record<string, string> = {}
    if (!nombreEmpresa.trim()) e.nombreEmpresa = 'El nombre de la empresa es obligatorio'
    if (!ciNit.trim()) e.ciNit = 'El CI o NIT es obligatorio para verificación institucional'
    if (!direccion.trim()) e.direccion = 'La dirección del punto fijo es obligatoria'
    if (!whatsapp.trim()) e.whatsapp = 'El WhatsApp es obligatorio para recibir pedidos directos'
    if (!rubroCategoriaId) e.rubroCategoriaId = 'Debes seleccionar la categoría principal de tus productos'
    if (!confirmaPuntoFijo) e.confirmaPuntoFijo = 'Debes confirmar la veracidad del punto fijo de tu empresa'
    if (latitud === null || longitud === null) e.gps = 'Debes capturar la ubicación GPS en tu punto fijo para el mapa oficial'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleEnviar = async () => {
    if (!validar()) {
      Alert.alert('⚠️ Formulario Incompleto', 'Por favor revisa los campos obligatorios y confirma la captura de tu Punto Fijo GPS.')
      return
    }

    if (!user) {
      Alert.alert(
        '⚠️ Iniciar Sesión Requerido',
        'Para vincular el perfil de tu empresa, tu ubicación en el mapa y gestionar tu catálogo de productos, necesitas tu cuenta oficial.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión / Registro Gratis', onPress: () => router.push('/(auth)/login') }
        ]
      )
      return
    }

    setLoading(true)

    try {
      const latFinal = latitud ?? -17.9833
      const lngFinal = longitud ?? -67.1500

      const { error } = await (supabase as any)
        .from('productores')
        .insert({
          user_id: user.id,
          nombre_empresa: nombreEmpresa.trim(),
          ci_nit: ciNit.trim(),
          tipo: tipo,
          rubro_categoria_id: rubroCategoriaId || null,
          departamento: 'ORURO',
          municipio: municipio,
          direccion: direccion.trim(),
          telefono: telefono.trim() || null,
          whatsapp: whatsapp.trim() || null,
          descripcion: descripcion.trim() || null,
          latitud: latFinal,
          longitud: lngFinal,
          estado: 'pendiente', // Gobernación debe verificar y aprobar
        })

      if (error) throw error

      Alert.alert(
        '🎉 ¡Expediente de Productor Enviado!',
        'Tu solicitud y las coordenadas de tu Punto Fijo fueron enviadas a la Secretaría de Desarrollo Productivo de la Gobernación de Oruro para su verificación oficial.\n\nMientras tanto, puedes preparar las fotos y descripciones de tu catálogo de productos.',
        [{ text: 'Ir a mi Panel', onPress: () => router.replace('/(tabs)/perfil') }]
      )
    } catch (err: any) {
      Alert.alert('Error al registrar', err.message || 'Ocurrió un error al enviar el formulario a la base de datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Encabezado Institucional */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>GOBERNACIÓN DE ORURO — GADOR</Text>
            <Text style={styles.headerTitulo}>Acreditación de Productor Oficial</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={{ fontSize: 18 }}>🏢</Text>
          </View>
        </View>

        {/* Banner de Verificación */}
        <View style={styles.avisoBox}>
          <Ionicons name="shield-checkmark" size={26} color="#15803d" />
          <View style={styles.avisoInfo}>
            <Text style={styles.avisoTitulo}>Verificación Institucional y Sello Oficial</Text>
            <Text style={styles.avisoTexto}>
              Al completar este expediente, tu empresa obtendrá el sello <Text style={{ fontWeight: '800' }}>"Consume lo Nuestro Oruro"</Text> y visibilidad en el Mapa Oficial de Consumidores.
            </Text>
          </View>
        </View>

        {!user && (
          <View style={[styles.avisoBox, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
            <Ionicons name="person-circle" size={26} color="#b45309" />
            <View style={styles.avisoInfo}>
              <Text style={[styles.avisoTitulo, { color: '#92400e' }]}>👤 Cuenta de Usuario Requerida</Text>
              <Text style={[styles.avisoTexto, { color: '#78350f' }]}>
                Puedes completar los datos y capturar tu Punto Fijo GPS ahora mismo. Al presionar enviar, te solicitaremos iniciar sesión o crear tu cuenta gratuita en 1 paso para guardar el perfil.
              </Text>
            </View>
          </View>
        )}

        {/* PASO 1: IDENTIDAD PRODUCTIVA */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeTxt}>PASO 1</Text></View>
            <Text style={styles.stepTitle}>Identidad Productiva y Legal</Text>
          </View>

          <Campo
            label="Nombre de la Empresa, Taller o Emprendimiento *"
            value={nombreEmpresa}
            onChangeText={setNombreEmpresa}
            placeholder="Ej: Lácteos del Altiplano Challapata"
            error={errors.nombreEmpresa}
            icon="business-outline"
          />

          <Campo
            label="CI del Titular o NIT de la Empresa *"
            value={ciNit}
            onChangeText={setCiNit}
            placeholder="Ej: 7283910 OR o 1029384021"
            error={errors.ciNit}
            icon="card-outline"
          />

          <Text style={styles.label}>Tipo de Organización Productiva *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {TIPOS_PRODUCTOR.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.tipoChip, tipo === item.id && styles.tipoChipActivo]}
                onPress={() => setTipo(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.tipoChipEmoji}>{item.emoji}</Text>
                <Text style={[styles.tipoChipTexto, tipo === item.id && styles.tipoChipTextoActivo]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Campo
            label="Reseña y Capacidad Productiva"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Cuenta qué productos fabrican, su especialidad, capacidad de entrega y origen 100% orureño de la materia prima..."
            multiline
            numberOfLines={3}
            icon="document-text-outline"
          />
        </View>

        {/* PASO 2: UBICACIÓN Y CONTACTO DE VENTAS */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeTxt}>PASO 2</Text></View>
            <Text style={styles.stepTitle}>Contacto Comercial y Municipio</Text>
          </View>

          <Text style={styles.label}>Municipio Orureño *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {MUNICIPIOS_ORURO.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.munChip, municipio === m && styles.munChipActivo]}
                onPress={() => setMunicipio(m)}
                activeOpacity={0.8}
              >
                <Text style={[styles.munChipTexto, municipio === m && styles.munChipTextoActivo]}>
                  📍 {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Campo
            label="Dirección descriptiva del establecimiento *"
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Ej: Av. 6 de Agosto #1234, Zona Industrial Norte"
            error={errors.direccion}
            icon="location-outline"
          />

          <Campo
            label="Número de WhatsApp para Pedidos y Cotizaciones *"
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="+591 7XXXXXXX"
            keyboardType="phone-pad"
            error={errors.whatsapp}
            icon="logo-whatsapp"
          />

          <Campo
            label="Teléfono fijo o celular secundario"
            value={telefono}
            onChangeText={setTelefono}
            placeholder="Ej: 252-45678"
            keyboardType="phone-pad"
            icon="call-outline"
          />
        </View>

        {/* PASO 3: RUBRO Y REQUISITO OBLIGATORIO DE PUNTO FIJO GPS */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, { backgroundColor: '#1e3a8a' }]}><Text style={styles.stepBadgeTxt}>PASO 3</Text></View>
            <Text style={styles.stepTitle}>Rubro y Geolocalización en Punto Fijo</Text>
          </View>

          <Text style={styles.label}>Selecciona tu Rubro o Categoría Principal *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {categorias.map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.munChip, rubroCategoriaId === cat.id && styles.munChipActivo]}
                onPress={() => { setRubroCategoriaId(cat.id); setErrors(prev => ({ ...prev, rubroCategoriaId: '' })) }}
                activeOpacity={0.8}
              >
                <Text style={[styles.munChipTexto, rubroCategoriaId === cat.id && styles.munChipTextoActivo]}>
                  {getCategoriaIcono(cat)} {cat.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {!!errors.rubroCategoriaId && <Text style={styles.campoErrorTexto}>{errors.rubroCategoriaId}</Text>}

          {/* CAJA DE ADVERTENCIA INSTITUCIONAL DE PUNTO FIJO OBLIGATORIO */}
          <View style={styles.puntoFijoWarningBox}>
            <View style={styles.puntoFijoWarningHeader}>
              <Ionicons name="alert-circle" size={24} color="#b45309" />
              <Text style={styles.puntoFijoWarningTitle}>REQUISITO OBLIGATORIO: PUNTO FIJO</Text>
            </View>
            <Text style={styles.puntoFijoWarningTexto}>
              Por normativa de la Secretaría de Desarrollo Productivo y para garantizar la seriedad del catálogo B2B, la captura de coordenadas GPS <Text style={{ fontWeight: '800', color: '#92400e' }}>DEBE REALIZARSE OBLIGATORIAMENTE EN UN PUNTO FIJO</Text> (tu Planta de Producción, Rancho, Taller Artesanal, Puesto de Venta o Tienda en Oruro).
            </Text>
            <View style={styles.puntoFijoDivider} />
            <Text style={styles.puntoFijoInstruction}>
              🚫 <Text style={{ fontWeight: '700' }}>Prohibido:</Text> No captures tu ubicación si estás viajando, en un bus o fuera de tu establecimiento oficial, ya que los compradores y flotas de transporte usarán este punto para despachos.
            </Text>

            {/* Checkbox de Confirmación Física del Punto Fijo */}
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => { setConfirmaPuntoFijo(!confirmaPuntoFijo); setErrors(prev => ({ ...prev, confirmaPuntoFijo: '' })) }}
              activeOpacity={0.85}
            >
              <View style={[styles.checkBox, confirmaPuntoFijo && styles.checkBoxActive]}>
                {confirmaPuntoFijo && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkTexto}>
                Confirmo bajo declaración jurada que me encuentro físicamente en el <Text style={{ fontWeight: '800', color: '#0f172a' }}>PUNTO FIJO OFICIAL</Text> de mi empresa/taller en este momento.
              </Text>
            </TouchableOpacity>
            {!!errors.confirmaPuntoFijo && <Text style={styles.campoErrorTexto}>{errors.confirmaPuntoFijo}</Text>}
          </View>

          {/* Botón de Captura GPS de Alta Precisión */}
          <TouchableOpacity
            style={[styles.btnGps, !confirmaPuntoFijo && styles.btnGpsDisabled]}
            onPress={capturarGpsActual}
            disabled={capturandoGps || !confirmaPuntoFijo}
            activeOpacity={0.85}
          >
            {capturandoGps ? (
              <ActivityIndicator color={VERDE} />
            ) : (
              <>
                <Ionicons name={latitud && longitud ? "checkmark-circle" : "location"} size={22} color={latitud && longitud ? "#15803d" : VERDE} style={{ marginRight: 8 }} />
                <Text style={[styles.btnGpsTexto, latitud && longitud && { color: '#15803d' }]}>
                  {latitud && longitud ? '✓ Coordenada del Punto Fijo Capturada (Actualizar)' : '📍 Obtener mi GPS actual en este Punto Fijo'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {latitud !== null && longitud !== null && (
            <View style={styles.gpsConfirmBox}>
              <Ionicons name="navigate-circle" size={26} color="#15803d" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#15803d' }}>📍 ESTABLECIMIENTO PUNTO FIJO VERIFICADO</Text>
                <Text style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>Latitud: {latitud.toFixed(6)} | Longitud: {longitud.toFixed(6)}</Text>
                <Text style={{ fontSize: 11, color: '#15803d', marginTop: 3 }}>✓ Listo para el Mapa Oficial de Consumidores de Oruro</Text>
              </View>
            </View>
          )}
          {!!errors.gps && <Text style={styles.campoErrorTexto}>{errors.gps}</Text>}
        </View>

        {/* Botón Final de Envío */}
        <TouchableOpacity
          style={[styles.btnEnviar, loading && styles.btnDisabled]}
          onPress={handleEnviar}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.btnEnviarTexto}>Enviar Expediente a Verificación del GADOR</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Campo({ label, value, onChangeText, placeholder, error, icon, keyboardType, multiline, numberOfLines }: any) {
  return (
    <View style={styles.campoContainer}>
      <Text style={styles.campoLabel}>{label}</Text>
      <View style={[
        styles.campoInputWrapper,
        multiline && { height: 96, alignItems: 'flex-start', paddingTop: 12 },
        error && styles.campoError
      ]}>
        <Ionicons name={icon} size={20} color="#6b7280" style={{ marginRight: 10 }} />
        <TextInput
          style={[styles.campoInput, multiline && { textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          keyboardType={keyboardType || 'default'}
          multiline={multiline || false}
          numberOfLines={numberOfLines || 1}
        />
      </View>
      {error && <Text style={styles.campoErrorTexto}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { flexGrow: 1, padding: 16, paddingBottom: 80, gap: 18, maxWidth: 860, alignSelf: 'center', width: '100%' },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { padding: 4 },
  headerSub: { fontSize: 11, fontWeight: '800', color: '#16a34a', letterSpacing: 0.5 },
  headerTitulo: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#86efac' },

  avisoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#f0fdf4', padding: 16, borderRadius: 18,
    borderWidth: 1.5, borderColor: '#86efac',
  },
  avisoInfo: { flex: 1 },
  avisoTitulo: { fontSize: 14, fontWeight: '800', color: '#15803d', marginBottom: 2 },
  avisoTexto: { fontSize: 12.5, color: '#166534', lineHeight: 18 },

  stepCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#cbd5e1', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 4 },
  stepBadge: { backgroundColor: VERDE, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  stepBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },

  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 4 },
  chipsScroll: { marginBottom: 6 },
  tipoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22,
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#cbd5e1', marginRight: 8,
  },
  tipoChipActivo: { borderColor: VERDE, backgroundColor: '#f0fdf4' },
  tipoChipEmoji: { fontSize: 17 },
  tipoChipTexto: { fontSize: 13, fontWeight: '600', color: '#475569' },
  tipoChipTextoActivo: { color: VERDE, fontWeight: '800' },

  munChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#cbd5e1', marginRight: 8,
  },
  munChipActivo: { borderColor: VERDE, backgroundColor: VERDE },
  munChipTexto: { fontSize: 13, fontWeight: '600', color: '#475569' },
  munChipTextoActivo: { color: '#fff', fontWeight: '800' },

  campoContainer: { marginBottom: 4 },
  campoLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  campoInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#cbd5e1',
    borderRadius: 14, paddingHorizontal: 14, height: 52,
  },
  campoError: { borderColor: '#ef4444' },
  campoInput: { flex: 1, fontSize: 15, color: '#0f172a' },
  campoErrorTexto: { color: '#ef4444', fontSize: 12, fontWeight: '600', marginTop: 4 },

  // Punto Fijo Warning Box
  puntoFijoWarningBox: { backgroundColor: '#fffbeb', borderWidth: 1.5, borderColor: '#fde68a', borderRadius: 16, padding: 16, gap: 10, marginTop: 4 },
  puntoFijoWarningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  puntoFijoWarningTitle: { fontSize: 14, fontWeight: '900', color: '#b45309' },
  puntoFijoWarningTexto: { fontSize: 13, color: '#78350f', lineHeight: 19 },
  puntoFijoDivider: { height: 1, backgroundColor: '#fde68a', marginVertical: 4 },
  puntoFijoInstruction: { fontSize: 12, color: '#92400e', lineHeight: 18 },
  
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6, backgroundColor: 'rgba(255,255,255,0.7)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#fde68a' },
  checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#b45309', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', marginTop: 2 },
  checkBoxActive: { backgroundColor: '#b45309', borderColor: '#b45309' },
  checkTexto: { flex: 1, fontSize: 12.5, color: '#78350f', lineHeight: 18 },

  btnGps: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: VERDE,
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18, marginTop: 4,
  },
  btnGpsDisabled: { opacity: 0.5, borderColor: '#9ca3af', backgroundColor: '#f3f4f6' },
  btnGpsTexto: { color: VERDE, fontSize: 14, fontWeight: '800' },
  
  gpsConfirmBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4',
    borderWidth: 1.5, borderColor: '#86efac', borderRadius: 16, padding: 16, marginTop: 4,
  },

  btnEnviar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: VERDE_OSCURO, borderRadius: 18, paddingVertical: 18,
    marginTop: 10, shadowColor: VERDE_OSCURO, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  btnDisabled: { opacity: 0.65 },
  btnEnviarTexto: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
