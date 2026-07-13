// hooks/useProductos.ts
// TanStack Query hooks para productos y búsqueda
// Maneja caché, revalidación y estado de carga automáticamente

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ProductoCompleto } from '../types/database'

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
    cercanos: (lat: number, lng: number) => [...queryKeys.productores.all, 'cercanos', lat, lng] as const,
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
      // Incrementar vista (no bloqueante)
      ;(supabase as any).rpc('incrementar_vista_producto', { p_producto_id: id }).then(() => {}).catch(() => {})

      const { data, error } = await supabase
        .from('vista_productos_completos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ProductoCompleto
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
export function useProductoresCercanos(lat: number | null, lng: number | null, radioKm = 10) {
  return useQuery({
    queryKey: queryKeys.productores.cercanos(lat ?? 0, lng ?? 0),
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('productores_cercanos', {
        p_lat: lat!,
        p_lng: lng!,
        p_radio_km: radioKm,
        p_limit: 100,
      })

      if (error) throw error
      return (data ?? []) as any[]
    },
    enabled: lat !== null && lng !== null,
    staleTime: 1000 * 60 * 5,
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
