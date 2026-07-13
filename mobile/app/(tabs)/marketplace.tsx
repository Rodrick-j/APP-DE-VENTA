// app/(tabs)/marketplace.tsx
// MARKETPLACE LEGENDARIO — Consume lo Nuestro
// Hero slider animado, glassmorphism, skeleton loading, press animations con Reanimated 4

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, RefreshControl,
  ScrollView, StatusBar,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import {
  useBuscarProductos, useProductosDestacados,
  useCategorias, useFavoritos, useToggleFavorito,
} from '../../hooks/useProductos'
import { useAuthStore } from '../../stores/authStore'
import { colors, typography, spacing, radius, shadows, gradients } from '../../lib/theme'
import { Avatar, Badge, SectionHeader, Skeleton } from '../../components/ui'

const categoriasIconos: Record<string, string> = {
  'lacteos': '🧀', 'carnes': '🥩', 'frutas-verduras': '🍎',
  'granos-cereales': '🌾', 'artesanias': '🎨', 'alimentos-procesados': '🍯',
  'bebidas': '🥤', 'plantas-medicinales': '🌿', 'textiles': '🧣',
  'cuero-calzado': '👞', 'flores-plantas': '🌸', 'madera': '🪵', 'otros': '📦',
}

const PRODUCTOS_MUESTRA = [
  { id: 'm1', nombre: 'Quinua Real Orgánica Blanca Premium (Bolsa 1Kg)', precio: 28.50, imagen_principal: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', categoria_nombre: 'Granos y Cereales', categoria_slug: 'granos-cereales', nombre_empresa: 'Asociación APQUISA — Salinas', destacado: true },
  { id: 'm2', nombre: 'Charque de Llama Deshidratado Especial (500g)', precio: 45.00, imagen_principal: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80', categoria_nombre: 'Carnes y Derivados', categoria_slug: 'carnes', nombre_empresa: 'Productores Turco — Oruro', destacado: true },
  { id: 'm3', nombre: 'Queso Fresco Artesanal Challapata (Pieza Grande)', precio: 32.00, imagen_principal: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80', categoria_nombre: 'Lácteos y Derivados', categoria_slug: 'lacteos', nombre_empresa: 'Lácteos Challapata MYPE', destacado: true },
  { id: 'm4', nombre: 'Poncho Artesanal de Alpaca 100% Nativa', precio: 250.00, imagen_principal: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=600&q=80', categoria_nombre: 'Textiles y Artesanías', categoria_slug: 'textiles', nombre_empresa: 'Artesanías Curahuara de Carangas', destacado: false },
  { id: 'm5', nombre: 'Miel de Abeja Pura Orgánica del Valle (500ml)', precio: 38.00, imagen_principal: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=600&q=80', categoria_nombre: 'Alimentos Procesados', categoria_slug: 'alimentos-procesados', nombre_empresa: 'Agroecológica Soracachi', destacado: false },
  { id: 'm6', nombre: 'Infusión de Wira Wira y Eucalipto (Caja 25u)', precio: 15.00, imagen_principal: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80', categoria_nombre: 'Plantas Medicinales', categoria_slug: 'plantas-medicinales', nombre_empresa: 'Medicina Natural Oruro', destacado: false },
]

const HERO_SLIDES = [
  { id: 'h1', titulo: 'Productos 100% Bolivianos', subtitulo: 'Directamente del campo a tu mesa', gradient: gradients.hero as [string, string], emoji: '🏔️' },
  { id: 'h2', titulo: 'Artesanías Orureñas Únicas', subtitulo: 'Cultura y tradición en cada pieza', gradient: gradients.heroBlue as [string, string], emoji: '🦙' },
  { id: 'h3', titulo: 'Carnes y Lácteos Frescos', subtitulo: 'Verificados por la Gobernación de Oruro', gradient: gradients.heroPurple as [string, string], emoji: '✅' },
]

const AnimatedTouchable = Animated.createAnimatedComponent(View)

export default function MarketplaceScreen() {
  const { user, perfil } = useAuthStore()
  const [busqueda, setBusqueda] = useState('')
  const [query, setQuery] = useState('')
  const [categoriaId, setCategoriaId] = useState<string | undefined>()
  const [refreshing, setRefreshing] = useState(false)
  const [heroIdx, setHeroIdx] = useState(0)

  // Pulse animation para badge de verificación
  const pulseScale = useSharedValue(1)
  const pulseOpacity = useSharedValue(1)

  // Hero slide animations
  const heroOpacity = useSharedValue(1)

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 900, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(1, { duration: 900, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      false
    )
    const interval = setInterval(() => {
      heroOpacity.value = withTiming(0, { duration: 200 }, () => {
        setHeroIdx(prev => (prev + 1) % HERO_SLIDES.length)
        heroOpacity.value = withTiming(1, { duration: 400 })
      })
    }, 4200)
    return () => clearInterval(interval)
  }, [])

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
  }))

  const { data: categorias } = useCategorias()
  const { data: destacadosDB } = useProductosDestacados()
  const { data: favoritos } = useFavoritos(user?.id)
  const toggleFavorito = useToggleFavorito()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useBuscarProductos({ query, categoriaId })

  const productosDB = data?.pages.flatMap(p => p) ?? []
  const productos = (productosDB.length === 0 && !query && !categoriaId) ? PRODUCTOS_MUESTRA : productosDB
  const destacados = (destacadosDB && destacadosDB.length > 0) ? destacadosDB : PRODUCTOS_MUESTRA.filter(p => p.destacado)

  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false) }, [refetch])
  const handleBuscar = () => setQuery(busqueda.trim())
  const isFavorito = (id: string) => favoritos?.includes(id) ?? false
  const handleFavorito = (productoId: string) => {
    if (!user) { router.push('/(auth)/login'); return }
    toggleFavorito.mutate({ userId: user.id, productoId, esFavorito: isFavorito(productoId) })
  }

  const nombreUsuario = perfil?.nombre_completo?.split(' ')[0] ?? (user ? 'amigo' : null)
  const slide = HERO_SLIDES[heroIdx]

  const ListHeader = (
    <View>
      {/* HERO SLIDER */}
      <Animated.View style={heroAnimatedStyle}>
        <LinearGradient colors={slide.gradient} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.heroBg}><Text style={styles.heroBgEmoji}>{slide.emoji}</Text></View>

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerGreet}>{nombreUsuario ? `Hola, ${nombreUsuario}! ` : 'Bienvenido! '}</Text>
              <Text style={styles.headerSub}>Marketplace Oruro - Bolivia</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
              <Avatar
                size="md"
                imageUrl={perfil?.avatar_url}
                name={perfil?.nombre_completo ?? user?.email}
                ring
              />
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitulo}>{slide.titulo}</Text>
            <Text style={styles.heroSub}>{slide.subtitulo}</Text>
            <View style={styles.dots}>
              {HERO_SLIDES.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setHeroIdx(i)}>
                  <View style={[styles.dot, i === heroIdx && styles.dotActivo]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Animated.View style={[styles.veriBadge, pulseAnimatedStyle]}>
            <Ionicons name="shield-checkmark" size={12} color="#fff" />
            <Text style={styles.veriTxt}>Gobernación de Oruro</Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* BUSQUEDA */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos orureños..."
            placeholderTextColor={colors.textPlaceholder}
            value={busqueda}
            onChangeText={setBusqueda}
            onSubmitEditing={handleBuscar}
            returnKeyType="search"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => { setBusqueda(''); setQuery('') }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.searchBtn} onPress={handleBuscar}>
            <LinearGradient colors={gradients.greenButton} style={styles.searchBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="arrow-forward" size={15} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* ESTADISTICAS */}
      <View style={styles.statsRow}>
        {[
          { icon: 'storefront' as const, valor: '120+', label: 'Empresas', color: colors.primary },
          { icon: 'cube' as const, valor: '500+', label: 'Productos', color: colors.blue },
          { icon: 'map' as const, valor: '16', label: 'Municipios', color: colors.purple },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: s.color + '15' }]}>
              <Ionicons name={s.icon} size={18} color={s.color} />
            </View>
            <Text style={[styles.statValor, { color: s.color }]}>{s.valor}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* CATEGORIAS */}
      <SectionHeader title="Categorías" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsContent}>
        <TouchableOpacity style={[styles.catChip, !categoriaId && styles.catChipActivo]} onPress={() => setCategoriaId(undefined)}>
          {!categoriaId && <View style={styles.catChipDot} />}
          <Text style={[styles.catTxt, !categoriaId && styles.catTxtActivo]}>Todo</Text>
        </TouchableOpacity>
        {(categorias as any[])?.map((cat: any) => (
          <TouchableOpacity key={cat.id} style={[styles.catChip, categoriaId === cat.id && styles.catChipActivo]} onPress={() => setCategoriaId(cat.id === categoriaId ? undefined : cat.id)}>
            {categoriaId === cat.id && <View style={styles.catChipDot} />}
            <Text style={styles.catEmoji}>{categoriasIconos[cat.slug] ?? '🏷️'}</Text>
            <Text style={[styles.catTxt, categoriaId === cat.id && styles.catTxtActivo]}>{cat.nombre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* DESTACADOS */}
      {!query && !categoriaId && destacados && destacados.length > 0 && (
        <View>
          <SectionHeader title="Destacados" actionLabel="Ver todos" onAction={() => {}} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
            {destacados.map((p: any) => (
              <CardHorizontal key={p.id} producto={p} esFavorito={isFavorito(p.id)} onFavorito={() => handleFavorito(p.id)} onPress={() => router.push(`/producto/${p.id}`)} />
            ))}
          </ScrollView>
          <SectionHeader title="Todos los productos" />
        </View>
      )}
    </View>
  )

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {isLoading ? (
        <>{ListHeader}<SkeletonGrid /></>
      ) : productos.length === 0 ? (
        <>{ListHeader}<EmptyStateComponent query={query} /></>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={ListHeader}
          renderItem={({ item, index }) => (
            <CardVertical
              producto={item}
              esFavorito={isFavorito(item.id)}
              onFavorito={() => handleFavorito(item.id)}
              onPress={() => router.push(`/producto/${item.id}`)}
              index={index}
            />
          )}
          onEndReached={() => { if (hasNextPage) fetchNextPage() }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={{ padding: 20 }} /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

// ─── Card Vertical con Reanimated ─────────────────────────

const CardVertical = React.memo(function CardVertical({ producto, esFavorito, onFavorito, onPress, index }: any) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 400 })
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 })
    })

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <TouchableOpacity onPress={onPress} activeOpacity={1}>
          <View style={styles.cardImgWrap}>
            {producto.imagen_principal
              ? <Image source={{ uri: producto.imagen_principal }} style={styles.cardImg} resizeMode="cover" />
              : <View style={styles.cardImgEmpty}><Text style={{ fontSize: 40 }}>{categoriasIconos[producto.categoria_slug] ?? '🏷️'}</Text></View>
            }
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.cardImgGrad} />
            <View style={styles.cardPrecioFloat}>
              <Text style={styles.cardPrecioTxt}>{producto.precio ? `Bs. ${producto.precio.toFixed(2)}` : 'Consultar'}</Text>
            </View>
            <TouchableOpacity style={styles.favBtn} onPress={onFavorito}>
              <Ionicons name={esFavorito ? 'heart' : 'heart-outline'} size={17} color={esFavorito ? colors.error : '#fff'} />
            </TouchableOpacity>
            {producto.destacado && (
              <Badge variant="gold" size="sm" label="TOP" style={styles.badgeStar} />
            )}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardCat}>{producto.categoria_nombre}</Text>
            <Text style={styles.cardNombre} numberOfLines={2}>{producto.nombre}</Text>
            <View style={styles.cardEmpRow}>
              <View style={styles.cardEmpDot} />
              <Text style={styles.cardEmp} numberOfLines={1}>{producto.nombre_empresa}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  )
})

// ─── Card Horizontal con Reanimated ───────────────────────

function CardHorizontal({ producto, esFavorito, onFavorito, onPress }: any) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 400 })
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 })
    })

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[styles.cardH, animatedStyle]}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
          {producto.imagen_principal
            ? <Image source={{ uri: producto.imagen_principal }} style={styles.cardHImg} resizeMode="cover" />
            : <View style={styles.cardHImgEmpty}><Text style={{ fontSize: 28 }}>{categoriasIconos[producto.categoria_slug] ?? '🏷️'}</Text></View>
          }
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={styles.cardHGrad} />
          <View style={styles.cardHInfo}>
            <Text style={styles.cardHNombre} numberOfLines={2}>{producto.nombre}</Text>
            <View style={styles.cardHPriceRow}>
              <Text style={styles.cardHPrecio}>{producto.precio ? `Bs. ${producto.precio.toFixed(2)}` : 'Consultar'}</Text>
              {producto.destacado && <Badge variant="gold" size="sm" label="TOP" />}
            </View>
          </View>
          <TouchableOpacity style={styles.cardHFav} onPress={onFavorito}>
            <Ionicons name={esFavorito ? 'heart' : 'heart-outline'} size={15} color={esFavorito ? colors.error : '#fff'} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  )
}

// ─── Skeleton Grid ────────────────────────────────────────

function SkeletonGrid() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.md, marginTop: spacing.sm }}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[styles.card, { marginBottom: 0 }]}>
          <Skeleton variant="rect" height={150} borderRadius={radius.xl} />
          <View style={{ padding: spacing.md, gap: spacing.sm }}>
            <Skeleton variant="text" width="50%" height={9} />
            <Skeleton variant="text" width="90%" height={12} />
            <Skeleton variant="text" width="65%" height={10} />
          </View>
        </View>
      ))}
    </View>
  )
}

// ─── Empty State ──────────────────────────────────────────

function EmptyStateComponent({ query }: { query: string }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="search-outline" size={48} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitulo}>Sin resultados</Text>
      <Text style={styles.emptySub}>{query ? `No encontramos "${query}"` : 'Aún no hay productos aquí'}</Text>
    </View>
  )
}

// ─── Estilos ──────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceSecondary },

  // Hero
  hero: { paddingTop: 54, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, position: 'relative', overflow: 'hidden' },
  heroBg: { position: 'absolute', right: -20, top: -10, opacity: 0.07 },
  heroBgEmoji: { fontSize: 170 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxl },
  headerGreet: { ...typography.hero, color: '#fff' },
  headerSub: { ...typography.small, color: 'rgba(255,255,255,0.6)', marginTop: spacing.xxs },
  heroContent: { marginBottom: spacing.md },
  heroTitulo: { fontSize: 23, fontWeight: '900', color: '#fff', lineHeight: 30, fontFamily: typography.h1.fontFamily },
  heroSub: { ...typography.caption, color: 'rgba(255,255,255,0.75)', marginTop: spacing.sm },
  dots: { flexDirection: 'row', gap: 7, marginTop: spacing.lg },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.32)' },
  dotActivo: { width: 20, backgroundColor: '#fff' },
  veriBadge: { position: 'absolute', top: 58, right: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  veriTxt: { ...typography.small, color: '#fff', fontWeight: '700' },

  // Busqueda
  searchWrap: { paddingHorizontal: spacing.lg, marginTop: -18, marginBottom: spacing.lg },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.xl, paddingHorizontal: spacing.lg, height: 54, ...shadows.green },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary },
  searchBtn: { borderRadius: radius.md, overflow: 'hidden' },
  searchBtnGrad: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  // Estadisticas
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginBottom: spacing.xs, gap: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: radius.xl, paddingVertical: spacing.lg, alignItems: 'center', ...shadows.light },
  statIconBox: { width: 36, height: 36, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  statValor: { fontSize: 16, fontWeight: '900', fontFamily: typography.h3.fontFamily },
  statLabel: { ...typography.small, color: colors.textMuted, marginTop: spacing.xxs },

  // Categorias
  catsContent: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.md },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.borderLight },
  catChipActivo: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  catChipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 1 },
  catEmoji: { fontSize: 13 },
  catTxt: { ...typography.captionMedium, color: colors.textTertiary },
  catTxtActivo: { color: colors.primary, fontWeight: '800' },

  // Lista
  lista: { paddingHorizontal: spacing.xs + 2, paddingBottom: 130 },
  row: { justifyContent: 'space-between', paddingHorizontal: spacing.sm + 2 },

  // Card Vertical
  card: { width: '48.5%', backgroundColor: colors.white, borderRadius: radius.xl, marginBottom: spacing.lg, overflow: 'hidden', ...shadows.light },
  cardImgWrap: { position: 'relative', height: 160 },
  cardImg: { width: '100%', height: '100%' },
  cardImgEmpty: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryTint },
  cardImgGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  cardPrecioFloat: { position: 'absolute', bottom: spacing.sm, left: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.sm + 1, paddingVertical: spacing.xs + 1 },
  cardPrecioTxt: { color: '#fff', ...typography.tiny, fontWeight: '800' },
  favBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.overlayLight, justifyContent: 'center', alignItems: 'center' },
  badgeStar: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  cardBody: { padding: spacing.md },
  cardCat: { ...typography.tiny, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 },
  cardNombre: { ...typography.captionBold, color: colors.textPrimary, marginTop: spacing.xs, lineHeight: 18 },
  cardEmpRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm - 1, gap: 5 },
  cardEmpDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary },
  cardEmp: { ...typography.small, color: colors.textMuted, flex: 1 },

  // Card Horizontal
  cardH: { width: 178, height: 148, borderRadius: radius.xl, overflow: 'hidden', ...shadows.medium },
  cardHImg: { width: '100%', height: '100%', position: 'absolute' },
  cardHImgEmpty: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryTint },
  cardHGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%' },
  cardHInfo: { position: 'absolute', bottom: spacing.xl, left: spacing.xl, right: 42 },
  cardHNombre: { ...typography.captionBold, color: '#fff', lineHeight: 16 },
  cardHPriceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs + 1, gap: spacing.sm },
  cardHPrecio: { fontSize: 14, fontWeight: '900', color: '#86efac', fontFamily: typography.h3.fontFamily },
  cardHFav: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.overlayLight, justifyContent: 'center', alignItems: 'center' },

  // Estados
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl, minHeight: 300 },
  emptyIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitulo: { ...typography.h3, color: colors.textSecondary },
  emptySub: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
})
