// hooks/useProductos.ts
// TanStack Query hooks para productos y búsqueda
// Maneja caché, revalidación y estado de carga automáticamente

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ProductoCompleto } from '../types/database'
import { PRODUCTOS_MUESTRA } from '../data/productosMuestra'
import { PRODUCTORES_MUESTRA } from '../data/productoresMuestra'

// ============================================================
// KEYS de caché — para invalidar de forma precisa
// ============================================================
export const queryKeys = {
  productos: {
    all: ['productos'] as const,
    lists: () => [...queryKeys.productos.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.productos.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.productos.all, 'detail', id] as const,
  },
  categorias: {
    all: ['categorias'] as const,
  },
  productores: {
    all: ['productores'] as const,
    cercanos: (lat: number, lng: number, radio: number, catId?: string) => [...queryKeys.productores.all, 'cercanos', lat, lng, radio, catId] as const,
    mapaAll: (catId?: string, q?: string) => [...queryKeys.productores.all, 'mapaAll', catId, q] as const,
    detail: (id: string) => [...queryKeys.productores.all, 'detail', id] as const,
  },
  favoritos: {
    all: ['favoritos'] as const,
    list: (userId: string) => [...queryKeys.favoritos.all, userId] as const,
  },
}

// ============================================================
// HOOK: Buscar productos con filtros
// ============================================================
interface BuscarProductosParams {
  query?: string
  categoriaId?: string
  municipio?: string
  precioMin?: number
  precioMax?: number
}

export function useBuscarProductos(params: BuscarProductosParams) {
  return useInfiniteQuery({
    queryKey: queryKeys.productos.list(params),
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await (supabase as any).rpc('buscar_productos', {
        p_query: params.query || null,
        p_categoria_id: params.categoriaId || null,
        p_municipio: params.municipio || null,
        p_precio_min: params.precioMin || null,
        p_precio_max: params.precioMax || null,
        p_limit: 20,
        p_offset: pageParam,
      })

      if (error) throw error
      return (data ?? []) as any[]
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any[], allPages: any[][]) => {
      if (!lastPage || lastPage.length < 20) return undefined
      return allPages.length * 20
    },
    staleTime: 1000 * 60 * 2, // 2 minutos de caché
  })
}

// ============================================================
// HOOK: Productos destacados (para la pantalla Home)
// ============================================================
export function useProductosDestacados() {
  return useQuery({
    queryKey: [...queryKeys.productos.lists(), 'destacados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vista_productos_completos')
        .select('*')
        .eq('destacado', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data as ProductoCompleto[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  })
}

// ============================================================
// HOOK: Detalle de un producto
// ============================================================
export function useProducto(id: string) {
  return useQuery({
    queryKey: queryKeys.productos.detail(id),
    queryFn: async () => {
      if (id.startsWith('m')) {
        const muestra = PRODUCTOS_MUESTRA.find(p => p.id === id)
        if (muestra) return muestra as any
      }

      // Incrementar vista (no bloqueante)
      ;(supabase as any).rpc('incrementar_vista_producto', { p_producto_id: id }).then(() => {}).catch(() => {})

      try {
        const { data, error } = await supabase
          .from('vista_productos_completos')
          .select('*')
          .eq('id', id)
          .single()

        if (error || !data) throw error
        return data as ProductoCompleto
      } catch {
        const muestra = PRODUCTOS_MUESTRA.find(p => p.id === id) || PRODUCTOS_MUESTRA[0]
        return muestra as any
      }
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// ============================================================
// HOOK: Categorías
// ============================================================
export function useCategorias() {
  return useQuery({
    queryKey: queryKeys.categorias.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('activo', true)
        .order('orden')

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 30, // 30 minutos — las categorías cambian poco
  })
}

// ============================================================
// HOOK: Productores cercanos (para el MAPA)
// ============================================================
export function useProductoresCercanos(lat: number | null, lng: number | null, radioKm = 15, categoriaId?: string) {
  return useQuery({
    queryKey: queryKeys.productores.cercanos(lat ?? 0, lng ?? 0, radioKm, categoriaId),
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any).rpc('productores_cercanos', {
          p_lat: lat!,
          p_lng: lng!,
          p_radio_km: radioKm,
          p_limit: 100,
          p_categoria_id: categoriaId || null,
        })

        if (error || !data || data.length === 0) {
          throw new Error('Fallback a muestra o local query')
        }
        return data as any[]
      } catch {
        // Fallback local
        try {
          const { data, error: err2 } = await (supabase as any)
            .from('productores')
            .select('id, nombre_empresa, tipo, municipio, direccion, logo_url, whatsapp, total_productos, latitud, longitud, rubro_categoria_id')
            .eq('estado', 'verificado')
          if (!err2 && data && data.length > 0) {
            const list = data.map((p: any) => ({
              ...p,
              productor_id: p.id,
              distancia_km: lat && lng && p.latitud && p.longitud
                ? Math.sqrt(Math.pow(p.latitud - lat, 2) + Math.pow(p.longitud - lng, 2)) * 111
                : 0
            }))
            return categoriaId ? list.filter((x: any) => x.rubro_categoria_id === categoriaId) : list
          }
        } catch {}

        // Fallback final: PRODUCTORES_MUESTRA de Oruro con coordenadas GPS precisas
        const listMuestra = PRODUCTORES_MUESTRA.map(p => ({
          ...p,
          distancia_km: lat && lng
            ? Math.sqrt(Math.pow(p.latitud - lat, 2) + Math.pow(p.longitud - lng, 2)) * 111
            : p.distancia_km
        }))
        return categoriaId ? listMuestra.filter(x => x.rubro_categoria_id === categoriaId) : listMuestra
      }
    },
    enabled: lat !== null && lng !== null,
    staleTime: 1000 * 60 * 3,
  })
}

// ============================================================
// HOOK: Todos los Productores para el MAPA (incluso sin GPS local)
// ============================================================
export function useProductoresEnMapa(categoriaId?: string, query?: string) {
  return useQuery({
    queryKey: queryKeys.productores.mapaAll(categoriaId, query),
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any).rpc('productores_en_mapa', {
          p_categoria_id: categoriaId || null,
          p_query: query || null,
        })
        if (error || !data || data.length === 0) throw new Error('Fallback')
        return data as any[]
      } catch {
        try {
          let q = (supabase as any)
            .from('productores')
            .select('id, nombre_empresa, tipo, municipio, direccion, logo_url, whatsapp, total_productos, latitud, longitud, rubro_categoria_id')
            .eq('estado', 'verificado')
          if (categoriaId) q = q.eq('rubro_categoria_id', categoriaId)
          if (query) q = q.ilike('nombre_empresa', `%${query}%`)
          const { data } = await q
          if (data && data.length > 0) {
            return data.map((p: any) => ({ ...p, productor_id: p.id, distancia_km: 0 }))
          }
        } catch {}

        // Fallback final: PRODUCTORES_MUESTRA
        let list = [...PRODUCTORES_MUESTRA]
        if (categoriaId) list = list.filter(p => p.rubro_categoria_id === categoriaId)
        if (query) list = list.filter(p => p.nombre_empresa.toLowerCase().includes(query.toLowerCase()))
        return list
      }
    },
    staleTime: 1000 * 60 * 3,
  })
}

// ============================================================
// HOOK: Favoritos del usuario
// ============================================================
export function useFavoritos(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.favoritos.list(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favoritos' as any)
        .select('producto_id')
        .eq('user_id', userId!)

      if (error) throw error
      return (data as any[]).map((f: any) => f.producto_id as string)
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  })
}

// ============================================================
// MUTATION: Agregar/quitar favorito
// ============================================================
export function useToggleFavorito() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, productoId, esFavorito }: {
      userId: string
      productoId: string
      esFavorito: boolean
    }) => {
      if (esFavorito) {
        // Quitar favorito
        const { error } = await supabase
          .from('favoritos' as any)
          .delete()
          .eq('user_id', userId)
          .eq('producto_id', productoId)
        if (error) throw error
      } else {
        // Agregar favorito
        const { error } = await (supabase as any)
          .from('favoritos')
          .insert({ user_id: userId, producto_id: productoId })
        if (error) throw error
      }
    },
    onSuccess: (_, { userId }) => {
      // Invalidar el caché de favoritos para refrescar la lista
      queryClient.invalidateQueries({ queryKey: queryKeys.favoritos.list(userId) })
    },
  })
}
