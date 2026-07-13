// app/productor/crear-producto.tsx
// Formulario para crear o publicar un nuevo producto en el catálogo

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import type { UnidadMedida } from '../../types/database'

const VERDE = '#1a7a4a'

const UNIDADES: { id: UnidadMedida; label: string }[] = [
  { id: 'unidad', label: 'Unidad / Pieza' },
  { id: 'kg', label: 'Kilogramo (kg)' },
  { id: 'gramo', label: 'Gramo (g)' },
  { id: 'arroba', label: 'Arroba' },
  { id: 'litro', label: 'Litro (L)' },
  { id: 'ml', label: 'Mililitro (ml)' },
  { id: 'caja', label: 'Caja' },
  { id: 'bolsa', label: 'Bolsa / Paquete' },
  { id: 'docena', label: 'Docena' },
  { id: 'metro', label: 'Metro (m)' },
]

export default function CrearProductoScreen() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('10')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [unidad, setUnidad] = useState<UnidadMedida>('unidad')
  const [imagenes, setImagenes] = useState<string[]>([])
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 1. Obtener ID del productor
  const { data: productor } = useQuery({
    queryKey: ['mi-productor-crear', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('productores')
        .select('id, estado')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  // 2. Obtener categorías
  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('categorias')
        .select('*')
        .eq('activo', true)
        .order('orden')
      if (error) throw error
      return data ?? []
    },
  })

  const seleccionarImagen = async (fuente: 'camara' | 'galeria') => {
    try {
      let result
      if (fuente === 'camara') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar la foto.')
          return
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        })
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: false,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        })
      }

      if (!result.canceled && result.assets[0].uri) {
        if (imagenes.length >= 4) {
          Alert.alert('Límite alcanzado', 'Puedes subir hasta 4 imágenes por producto.')
          return
        }
        setImagenes([...imagenes, result.assets[0].uri])
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar la imagen.')
    }
  }

  const removerImagen = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index))
  }

  const validar = () => {
    const e: Record<string, string> = {}
    if (!nombre.trim()) e.nombre = 'Ponle un nombre a tu producto'
    if (!categoriaId) e.categoria = 'Selecciona una categoría para que lo encuentren en el buscador'
    if (!precio.trim() || isNaN(Number(precio))) e.precio = 'Ingresa un precio válido en Bolivianos'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePublicar = async () => {
    if (!validar()) return
    if (!productor?.id) {
      Alert.alert('Error', 'No se encontró tu registro de productor.')
      return
    }

    setLoading(true)

    try {
      // 1. Subir imágenes a Supabase Storage (bucket: productos)
      const urlsSubidas: string[] = []

      for (const uri of imagenes) {
        const fileExt = uri.split('.').pop() || 'jpg'
        const fileName = `${productor.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        
        // Convertir URI de local a ArrayBuffer para subir
        const res = await fetch(uri)
        const arrayBuffer = await res.arrayBuffer()

        const { error: uploadErr } = await supabase.storage
          .from('productos')
          .upload(fileName, arrayBuffer, {
            contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
            upsert: false,
          })

        if (uploadErr) {
          console.warn('Error al subir imagen:', uploadErr.message)
          continue
        }

        const { data: publicUrlData } = supabase.storage
          .from('productos')
          .getPublicUrl(fileName)

        if (publicUrlData.publicUrl) {
          urlsSubidas.push(publicUrlData.publicUrl)
        }
      }

      // 2. Insertar en tabla productos
      const { error: insertErr } = await (supabase as any)
        .from('productos')
        .insert({
          productor_id: productor.id,
          categoria_id: categoriaId,
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          precio: Number(precio),
          unidad: unidad,
          stock: Number(stock) || 0,
          imagenes: urlsSubidas,
          disponible: true,
        })

      if (insertErr) throw insertErr

      queryClient.invalidateQueries({ queryKey: ['mis-productos-lista'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })

      Alert.alert(
        '¡Producto Publicado! 🎉',
        `"${nombre}" se agregó exitosamente a tu catálogo y ya está disponible en el marketplace de Oruro.`,
        [{ text: 'Ver mi catálogo', onPress: () => router.back() }]
      )
    } catch (err: any) {
      Alert.alert('Error al publicar', err.message || 'Ocurrió un error al guardar tu producto.')
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
        
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={VERDE} />
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Publicar Nuevo Producto</Text>
        </View>

        {/* Galería de fotos del producto */}
        <View style={styles.fotosSection}>
          <Text style={styles.label}>Fotos del producto ({imagenes.length}/4)</Text>
          <Text style={styles.sublabel}>Las fotos claras y con buena luz venden mucho más rápido.</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotosScroll}>
            {/* Botones para añadir foto */}
            {imagenes.length < 4 && (
              <>
                <TouchableOpacity
                  style={styles.btnAddFoto}
                  onPress={() => seleccionarImagen('camara')}
                >
                  <Ionicons name="camera" size={28} color={VERDE} />
                  <Text style={styles.btnAddFotoTexto}>Cámara</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnAddFoto}
                  onPress={() => seleccionarImagen('galeria')}
                >
                  <Ionicons name="images" size={28} color={VERDE} />
                  <Text style={styles.btnAddFotoTexto}>Galería</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Thumbnails de fotos seleccionadas */}
            {imagenes.map((uri, index) => (
              <View key={index} style={styles.fotoThumbBox}>
                <Image source={{ uri }} style={styles.fotoThumb} />
                <TouchableOpacity
                  style={styles.btnRemoveFoto}
                  onPress={() => removerImagen(index)}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
                {index === 0 && (
                  <View style={styles.portadaBadge}>
                    <Text style={styles.portadaTexto}>PORTADA</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Campo
            label="Nombre o título del producto *"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Queso fresco artesanal de oveja (1kg)"
            error={errors.nombre}
            icon="cube-outline"
          />

          <Text style={styles.label}>Categoría *</Text>
          {errors.categoria && <Text style={styles.campoErrorTexto}>{errors.categoria}</Text>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {categorias?.map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catChip,
                  categoriaId === cat.id && { backgroundColor: cat.color + '22', borderColor: cat.color }
                ]}
                onPress={() => setCategoriaId(cat.id)}
              >
                <Text style={[styles.catTexto, categoriaId === cat.id && { color: cat.color, fontWeight: '800' }]}>
                  {cat.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.rowTwo}>
            <View style={{ flex: 1 }}>
              <Campo
                label="Precio en Bs. *"
                value={precio}
                onChangeText={setPrecio}
                placeholder="0.00"
                keyboardType="numeric"
                error={errors.precio}
                icon="pricetag-outline"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Campo
                label="Stock o cantidad estimada"
                value={stock}
                onChangeText={setStock}
                placeholder="10"
                keyboardType="numeric"
                icon="layers-outline"
              />
            </View>
          </View>

          <Text style={styles.label}>Unidad de medida *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {UNIDADES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.unChip, unidad === item.id && styles.unChipActivo]}
                onPress={() => setUnidad(item.id)}
              >
                <Text style={[styles.unChipTexto, unidad === item.id && styles.unChipTextoActivo]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Campo
            label="Descripción detallada"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Explica las características, ingredientes, origen o beneficios de tu producto..."
            multiline
            numberOfLines={4}
            icon="document-text-outline"
          />

          <TouchableOpacity
            style={[styles.btnPublicar, loading && styles.btnDisabled]}
            onPress={handlePublicar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.btnPublicarTexto}>Publicar en el Marketplace</Text>
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
        styles.campoWrapper,
        multiline && { height: 100, alignItems: 'flex-start', paddingTop: 10 },
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

  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  backBtn: { padding: 4 },
  headerTitulo: { fontSize: 20, fontWeight: '800', color: '#111827' },

  fotosSection: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 4 },
  sublabel: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
  fotosScroll: { flexDirection: 'row' },
  
  btnAddFoto: {
    width: 96, height: 96, borderRadius: 16,
    borderWidth: 2, borderColor: VERDE, borderStyle: 'dashed',
    backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  btnAddFotoTexto: { fontSize: 12, fontWeight: '700', color: VERDE, marginTop: 4 },

  fotoThumbBox: { position: 'relative', width: 96, height: 96, marginRight: 10 },
  fotoThumb: { width: 96, height: 96, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  btnRemoveFoto: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.9)', width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  portadaBadge: {
    position: 'absolute', bottom: 6, left: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingVertical: 2,
  },
  portadaTexto: { color: '#fff', fontSize: 8, fontWeight: '800', textAlign: 'center' },

  form: { gap: 12 },
  rowTwo: { flexDirection: 'row', gap: 12 },
  chipsScroll: { marginBottom: 8 },
  
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', marginRight: 8,
  },
  catTexto: { fontSize: 13, fontWeight: '600', color: '#4b5563' },

  unChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', marginRight: 8,
  },
  unChipActivo: { borderColor: VERDE, backgroundColor: VERDE },
  unChipTexto: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  unChipTextoActivo: { color: '#fff', fontWeight: '800' },

  campoContainer: { marginBottom: 8 },
  campoLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  campoWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 14, paddingHorizontal: 14, height: 52,
  },
  campoError: { borderColor: '#ef4444' },
  campoInput: { flex: 1, fontSize: 15, color: '#111827' },
  campoErrorTexto: { color: '#ef4444', fontSize: 12, marginTop: 4 },

  btnPublicar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: VERDE, borderRadius: 16, paddingVertical: 18,
    marginTop: 16, shadowColor: VERDE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnDisabled: { opacity: 0.65 },
  btnPublicarTexto: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
