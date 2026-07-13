// app/productor/registrar.tsx
// Formulario de registro y verificación para productores de la Gobernación de Oruro

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import type { TipoProductor } from '../../types/database'

const VERDE = '#1a7a4a'

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

export default function RegistrarProductorScreen() {
  const { user } = useAuthStore()

  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [ciNit, setCiNit] = useState('')
  const [tipo, setTipo] = useState<TipoProductor>('MYPE')
  const [municipio, setMunicipio] = useState('Oruro')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [descripcion, setDescripcion] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validar = () => {
    const e: Record<string, string> = {}
    if (!nombreEmpresa.trim()) e.nombreEmpresa = 'El nombre del emprendimiento es requerido'
    if (!ciNit.trim()) e.ciNit = 'El CI o NIT es obligatorio para verificar'
    if (!direccion.trim()) e.direccion = 'Indica la dirección principal'
    if (!whatsapp.trim() && !telefono.trim()) e.whatsapp = 'Al menos un teléfono o WhatsApp es requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleEnviar = async () => {
    if (!validar()) return
    if (!user) {
      Alert.alert('Error', 'Debes haber iniciado sesión')
      return
    }

    setLoading(true)

    try {
      const { error } = await (supabase as any)
        .from('productores')
        .insert({
          user_id: user.id,
          nombre_empresa: nombreEmpresa.trim(),
          ci_nit: ciNit.trim(),
          tipo: tipo,
          departamento: 'ORURO',
          municipio: municipio,
          direccion: direccion.trim(),
          telefono: telefono.trim() || null,
          whatsapp: whatsapp.trim() || null,
          descripcion: descripcion.trim() || null,
          estado: 'pendiente', // Gobernación debe aprobar
        })

      if (error) throw error

      Alert.alert(
        '¡Registro enviado! 🎉',
        'Tu solicitud fue enviada a la Secretaría de Desarrollo Productivo de Oruro para su verificación. Mientras tanto, puedes configurar tus puntos de venta y preparar tu catálogo.',
        [{ text: 'Entendido', onPress: () => router.replace('/(tabs)/perfil') }]
      )
    } catch (err: any) {
      Alert.alert('Error al registrar', err.message || 'Ocurrió un error al guardar los datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        {/* Encabezado */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={VERDE} />
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Completar Perfil de Productor</Text>
        </View>

        <View style={styles.avisoBox}>
          <Ionicons name="shield-checkmark" size={24} color="#0d5c35" />
          <View style={styles.avisoInfo}>
            <Text style={styles.avisoTitulo}>Verificación Institucional</Text>
            <Text style={styles.avisoTexto}>
              Los datos que proporciones aquí serán validados por el personal del GADOR para otorgarte la credencial de Productor Oficial de Oruro.
            </Text>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.sectionLabel}>1. Identidad Productiva</Text>

          <Campo
            label="Nombre de la Empresa o Emprendimiento *"
            value={nombreEmpresa}
            onChangeText={setNombreEmpresa}
            placeholder="Ej: Lácteos del Altiplano Mamani"
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

          <Text style={styles.label}>Rubro productivo *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {TIPOS_PRODUCTOR.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.tipoChip, tipo === item.id && styles.tipoChipActivo]}
                onPress={() => setTipo(item.id)}
              >
                <Text style={styles.tipoChipEmoji}>{item.emoji}</Text>
                <Text style={[styles.tipoChipTexto, tipo === item.id && styles.tipoChipTextoActivo]}>
                  {item.id}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Campo
            label="Descripción o reseña de tu producción"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Cuenta qué producen, sus especialidades y origen de su materia prima..."
            multiline
            numberOfLines={3}
            icon="document-text-outline"
          />

          <Text style={[styles.sectionLabel, { marginTop: 12 }]}>2. Ubicación y Contacto en Oruro</Text>

          <Text style={styles.label}>Municipio *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {MUNICIPIOS_ORURO.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.munChip, municipio === m && styles.munChipActivo]}
                onPress={() => setMunicipio(m)}
              >
                <Text style={[styles.munChipTexto, municipio === m && styles.munChipTextoActivo]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Campo
            label="Dirección / Zona principal *"
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Ej: Av. Brasil #1234 casi Ejército, Zona Sur"
            error={errors.direccion}
            icon="location-outline"
          />

          <Campo
            label="Número de WhatsApp para ventas *"
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

          <TouchableOpacity
            style={[styles.btnEnviar, loading && styles.btnDisabled]}
            onPress={handleEnviar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.btnEnviarTexto}>Enviar a Verificación</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
        multiline && { height: 90, alignItems: 'flex-start', paddingTop: 10 },
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 60 },
  
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  backBtn: { padding: 4 },
  headerTitulo: { fontSize: 20, fontWeight: '800', color: '#111827' },

  avisoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#dcfce7', padding: 16, borderRadius: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#86efac',
  },
  avisoInfo: { flex: 1 },
  avisoTitulo: { fontSize: 14, fontWeight: '800', color: '#0d5c35' },
  avisoTexto: { fontSize: 12, color: '#146c43', marginTop: 2, lineHeight: 18 },

  form: { gap: 12 },
  sectionLabel: { fontSize: 16, fontWeight: '800', color: VERDE, marginBottom: 4 },
  
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  chipsScroll: { marginBottom: 12 },
  tipoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', marginRight: 8,
  },
  tipoChipActivo: { borderColor: VERDE, backgroundColor: '#f0fdf4' },
  tipoChipEmoji: { fontSize: 16 },
  tipoChipTexto: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  tipoChipTextoActivo: { color: VERDE, fontWeight: '800' },

  munChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', marginRight: 8,
  },
  munChipActivo: { borderColor: VERDE, backgroundColor: VERDE },
  munChipTexto: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  munChipTextoActivo: { color: '#fff', fontWeight: '800' },

  campoContainer: { marginBottom: 8 },
  campoLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  campoInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 14, paddingHorizontal: 14, height: 52,
  },
  campoError: { borderColor: '#ef4444' },
  campoInput: { flex: 1, fontSize: 15, color: '#111827' },
  campoErrorTexto: { color: '#ef4444', fontSize: 12, marginTop: 4 },

  btnEnviar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: VERDE, borderRadius: 16, paddingVertical: 18,
    marginTop: 16, shadowColor: VERDE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnDisabled: { opacity: 0.65 },
  btnEnviarTexto: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
