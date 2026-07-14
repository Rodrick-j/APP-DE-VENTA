// app/(tabs)/marketplace.tsx
// MARKETPLACE LEGENDARIO — Consume lo Nuestro
// Hero slider animado, glassmorphism, skeleton loading, press animations con Reanimated 4

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, RefreshControl,
  ScrollView, StatusBar, Platform, useWindowDimensions,
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
import { PRODUCTOS_MUESTRA } from '../../data/productosMuestra'

const categoriasIconos: Record<string, string> = {
  'lacteos': '🧀', 'carnes': '🥩', 'frutas-verduras': '🍎',
  'granos-cereales': '🌾', 'artesanias': '🎨', 'alimentos-procesados': '🍯',
  'bebidas': '🥤', 'plantas-medicinales': '🌿', 'textiles': '🧣',
  'cuero-calzado': '👞', 'flores-plantas': '🌸', 'madera': '🪵', 'otros': '📦',
}


const HERO_SLIDES = [
  { id: 'h1', titulo: 'Productos 100% Bolivianos', subtitulo: 'Directamente del campo a tu mesa', gradient: gradients.hero as [string, string], emoji: '🏔️' },
  { id: 'h2', titulo: 'Artesanías Orureñas Únicas', subtitulo: 'Cultura y tradición en cada pieza', gradient: gradients.heroBlue as [string, string], emoji: '🦙' },
  { id: 'h3', titulo: 'Carnes y Lácteos Frescos', subtitulo: 'Verificados por la Gobernación de Oruro', gradient: gradients.heroPurple as [string, string], emoji: '✅' },
]

const AnimatedTouchable = Animated.createAnimatedComponent(View)

export default function MarketplaceScreen() {
  const { user, perfil } = useAuthStore()
  const { width: windowWidth } = useWindowDimensions()
  const numCols = Platform.OS === 'web'
    ? (windowWidth > 1300 ? 5 : windowWidth > 1000 ? 4 : windowWidth > 640 ? 3 : 2)
    : 2
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
      heroOpacity.value = withTiming(0, { duration: 200 })
      setTimeout(() => {
        setHeroIdx(prev => (prev + 1) % HERO_SLIDES.length)
        heroOpacity.value = withTiming(1, { duration: 400 })
      }, 200)
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
      {/* ALIBABA TOP NAV BAR (WEB & DESKTOP) */}
      {Platform.OS === 'web' && (
        <View style={styles.alibabaTopNav}>
          <View style={styles.alibabaTopLeft}>
            <TouchableOpacity style={styles.alibabaTopLinkWrap}>
              <Ionicons name="menu-outline" size={16} color="#374151" />
              <Text style={styles.alibabaTopLinkTxtBold}>Todas las categorías</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alibabaTopLinkWrap}>
              <Ionicons name="shield-checkmark" size={14} color="#1a7a4a" />
              <Text style={styles.alibabaTopLinkTxt}>Fabricantes verificados</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alibabaTopLinkWrap}>
              <Ionicons name="shield" size={14} color="#0066ff" />
              <Text style={styles.alibabaTopLinkTxt}>Protecciones del pedido</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.alibabaTopLinkWrap, { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#86efac' }]}
              onPress={() => router.push('/productor/registrar')}
            >
              <Ionicons name="business" size={15} color="#15803d" />
              <Text style={[styles.alibabaTopLinkTxtBold, { color: '#15803d' }]}>✨ Vender en Oruro (Registro Productor)</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.alibabaTopRight}>
            <View style={styles.alibabaTopFlagRow}>
              <Text style={{ fontSize: 13 }}>🇧🇴</Text>
              <Text style={styles.alibabaTopLinkTxt}>Entregar en: <Text style={{ fontWeight: '700', color: '#111827' }}>Oruro, BO</Text></Text>
            </View>
            <Text style={styles.alibabaTopLinkTxt}>Español-BOB</Text>
            <TouchableOpacity style={styles.alibabaTopLinkWrap} onPress={() => router.push('/(tabs)/favoritos')}>
              <Ionicons name="cart-outline" size={16} color="#374151" />
              <Text style={styles.alibabaTopLinkTxt}>Carrito</Text>
            </TouchableOpacity>
            {!user ? (
              <TouchableOpacity style={styles.alibabaTopAuthBtn} onPress={() => router.push('/(auth)/login')}>
                <Ionicons name="person-circle-outline" size={16} color="#ffffff" />
                <Text style={styles.alibabaTopAuthTxt}>Iniciar sesión / Crear cuenta</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.alibabaTopAuthBtn} onPress={() => router.push('/(tabs)/perfil')}>
                <Ionicons name="person-circle-outline" size={16} color="#ffffff" />
                <Text style={styles.alibabaTopAuthTxt}>Mi Cuenta ({perfil?.nombre_completo?.split(' ')[0] ?? 'Oruro'})</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

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

      {/* BANNER OFICIAL DE ADHESIÓN PARA PRODUCTORES B2B */}
      <View style={styles.productorBannerBox}>
        <LinearGradient
          colors={['#14532d', '#1a7a4a', '#15803d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.productorBannerGrad}
        >
          <View style={styles.productorBannerHeader}>
            <View style={styles.productorBannerTag}>
              <Text style={styles.productorBannerTagTxt}>⚡ CONVOCATORIA OFICIAL GOBERNACIÓN</Text>
            </View>
            <Text style={styles.productorBannerEmoji}>🏢</Text>
          </View>
          <Text style={styles.productorBannerTitle}>¿Eres Productor, Artesano o MYPE de Oruro?</Text>
          <Text style={styles.productorBannerSub}>
            Regístrate gratis con tu GPS oficial, obtén el sello "Consume lo Nuestro" y publica tus productos directo a miles de compradores y mayoristas sin intermediarios.
          </Text>
          <View style={styles.productorBannerBtns}>
            <TouchableOpacity
              style={styles.productorBtnAction}
              onPress={() => router.push('/productor/registrar')}
              activeOpacity={0.9}
            >
              <Text style={styles.productorBtnActionTxt}>🚀 Registrar mi Empresa y GPS Ahora →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.productorBtnInfo}
              onPress={() => router.push('/productor/registrar')}
              activeOpacity={0.8}
            >
              <Text style={styles.productorBtnInfoTxt}>📋 Ver Requisitos</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
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
          key={`alibaba-grid-${numCols}`}
          data={productos}
          keyExtractor={item => item.id}
          numColumns={numCols}
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

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
    };
  })

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      'worklet';
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 })
    })
    .onFinalize(() => {
      'worklet';
      scale.value = withSpring(1, { damping: 15, stiffness: 400 })
    })

  const precioMin = producto.precio ? producto.precio : 25.00
  const precioMax = (precioMin * 1.68).toFixed(2)
  const moq = producto.unidad ? `1 ${producto.unidad}` : '1 unidad'
  const vendidos = (index * 42 + 38).toLocaleString()
  const anios = (index % 5) + 1

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.94} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* HEADER ALIBABA B2B (Arriba de la imagen) */}
          <View style={styles.cardHeaderAlibaba}>
            <Text style={styles.priceRangeTxt}>Bs {precioMin.toFixed(2)} - {precioMax}</Text>
            <View style={styles.moqSoldRow}>
              <Text style={styles.moqTxt}>MOQ: {moq}</Text>
              <Text style={styles.soldTxt}>{vendidos} vendidos</Text>
            </View>
            <View style={styles.verifiedRow}>
              <View style={styles.verifiedIconBadge}>
                <Ionicons name="checkmark-sharp" size={9} color="#fff" />
              </View>
              <Text style={styles.verifiedTxt}>Verified</Text>
              <Text style={styles.yearsCountryTxt}> · {anios} {anios === 1 ? 'año' : 'años'} · Oruro, BO</Text>
            </View>
          </View>

          {/* CONTENEDOR IMAGEN CUADRADA ALIBABA */}
          <View style={styles.cardImgWrap}>
            {producto.imagen_principal
              ? <Image source={{ uri: producto.imagen_principal }} style={styles.cardImg} resizeMode="cover" />
              : <View style={styles.cardImgEmpty}><Text style={{ fontSize: 44 }}>{categoriasIconos[producto.categoria_slug] ?? '🏷️'}</Text></View>
            }
            {/* Botón Lente/Zoom inferior izquierdo estilo Alibaba */}
            <View style={styles.alibabaScanBtn}>
              <Ionicons name="scan-outline" size={13} color="#374151" />
            </View>
            {/* Botón Favorito superior derecho */}
            <TouchableOpacity style={styles.favBtn} onPress={onFavorito}>
              <Ionicons name={esFavorito ? 'heart' : 'heart-outline'} size={15} color={esFavorito ? colors.error : '#4b5563'} />
            </TouchableOpacity>
            {producto.destacado && (
              <View style={styles.expressBadge}>
                <Text style={styles.expressTxt}>Gobernación Express</Text>
              </View>
            )}
          </View>

          {/* CUERPO Y TITULO ALIBABA */}
          <View style={styles.cardBody}>
            <Text style={styles.cardCat}>{producto.categoria_nombre}</Text>
            <Text style={styles.cardNombre} numberOfLines={2}>{producto.nombre}</Text>
            
            <View style={styles.alibabaFeatureRow}>
              <Ionicons name="checkmark-circle" size={13} color="#16a34a" />
              <Text style={styles.alibabaFeatureTxt} numberOfLines={1}>Trato directo · {producto.nombre_empresa}</Text>
            </View>

            <View style={styles.alibabaBottomPriceRow}>
              <Text style={styles.alibabaUnitPrecio}>Bs {precioMin.toFixed(2)} / {producto.unidad || 'und.'}</Text>
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
  searchWrap: { paddingHorizontal: spacing.lg, marginTop: -18, marginBottom: spacing.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.xl, paddingHorizontal: spacing.lg, height: 54, ...shadows.green },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary },
  searchBtn: { borderRadius: radius.md, overflow: 'hidden' },
  searchBtnGrad: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  // Banner Productor Home
  productorBannerBox: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  productorBannerGrad: { borderRadius: 20, padding: 20, ...shadows.heavy },
  productorBannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productorBannerTag: { backgroundColor: 'rgba(255, 255, 255, 0.22)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)' },
  productorBannerTagTxt: { color: '#ffffff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  productorBannerEmoji: { fontSize: 28 },
  productorBannerTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff', marginBottom: 6, lineHeight: 26 },
  productorBannerSub: { fontSize: 13, color: 'rgba(255, 255, 255, 0.88)', lineHeight: 19, fontWeight: '500', marginBottom: 16 },
  productorBannerBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  productorBtnAction: { backgroundColor: '#ffffff', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, ...shadows.light },
  productorBtnActionTxt: { color: '#14532d', fontSize: 13, fontWeight: '800' },
  productorBtnInfo: { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.6)', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14 },
  productorBtnInfoTxt: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

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

  // Alibaba Top Nav Bar (Web)
  alibabaTopNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingHorizontal: spacing.xl, paddingVertical: 10, flexWrap: 'wrap', gap: spacing.md },
  alibabaTopLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' },
  alibabaTopRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' },
  alibabaTopLinkWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alibabaTopLinkTxt: { fontSize: 13, color: '#4b5563' },
  alibabaTopLinkTxtBold: { fontSize: 13, color: '#111827', fontWeight: '700' },
  alibabaTopFlagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alibabaTopAuthBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ff6a00', paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  alibabaTopAuthTxt: { fontSize: 13, fontWeight: '700', color: '#ffffff' },

  // Card Vertical (Alibaba style)
  card: { flex: 1, minWidth: Platform.OS === 'web' ? 220 : 165, maxWidth: Platform.OS === 'web' ? 290 : '48.5%', backgroundColor: '#ffffff', borderRadius: 14, marginBottom: spacing.lg, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', ...shadows.medium },
  cardHeaderAlibaba: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, backgroundColor: '#ffffff' },
  priceRangeTxt: { fontSize: 17, fontWeight: '900', color: '#111827', letterSpacing: -0.3 },
  moqSoldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  moqTxt: { fontSize: 11, color: '#4b5563', fontWeight: '600' },
  soldTxt: { fontSize: 11, color: '#6b7280' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  verifiedIconBadge: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#0066ff', justifyContent: 'center', alignItems: 'center' },
  verifiedTxt: { fontSize: 11, fontWeight: '800', color: '#0066ff', marginLeft: 4 },
  yearsCountryTxt: { fontSize: 11, color: '#6b7280', fontWeight: '500' },

  cardImgWrap: { position: 'relative', width: '100%', aspectRatio: 1, backgroundColor: '#f8fafc', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  cardImg: { width: '100%', height: '100%' },
  cardImgEmpty: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  alibabaScanBtn: { position: 'absolute', bottom: spacing.sm, left: spacing.sm, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center', alignItems: 'center', ...shadows.light },
  favBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center', alignItems: 'center', ...shadows.light },
  expressBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm, backgroundColor: '#ff6a00', borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 3 },
  expressTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },

  cardBody: { padding: spacing.md, flex: 1, justifyContent: 'space-between' },
  cardCat: { fontSize: 10, color: colors.primary, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.8 },
  cardNombre: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 3, lineHeight: 18 },
  alibabaFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  alibabaFeatureTxt: { fontSize: 11, color: '#4b5563', flex: 1 },
  alibabaBottomPriceRow: { marginTop: spacing.sm, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  alibabaUnitPrecio: { fontSize: 12, fontWeight: '800', color: '#16a34a' },

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
