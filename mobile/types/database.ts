// types/database.ts
// Tipos TypeScript auto-generados del schema de Supabase
// Representa cada tabla, vista y función de la base de datos

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================
// ENUMS — coinciden con los tipos definidos en 02_types_enums.sql
// ============================================================
export type TipoProductor =
  | 'MYPE'
  | 'PYME'
  | 'AGROPECUARIO'
  | 'AGRICULTOR'
  | 'GANADERO'
  | 'EMPRENDEDOR'
  | 'ARTESANO'
  | 'COOPERATIVA'

export type RolUsuario = 'comprador' | 'productor' | 'admin' | 'moderador'

export type EstadoProductor = 'pendiente' | 'verificado' | 'suspendido' | 'rechazado'

export type EstadoContacto = 'nuevo' | 'leido' | 'respondido' | 'archivado'

export type TipoReporte =
  | 'productores_municipio'
  | 'estadisticas_mensuales'
  | 'catalogo_productos'
  | 'exportacion_excel'

export type UnidadMedida =
  | 'unidad'
  | 'kg'
  | 'gramo'
  | 'litro'
  | 'ml'
  | 'caja'
  | 'bolsa'
  | 'metro'
  | 'docena'
  | 'arroba'

// ============================================================
// FILAS DE TABLAS
// ============================================================
export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string
          user_id: string
          nombre_completo: string | null
          telefono: string | null
          avatar_url: string | null
          rol: RolUsuario
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nombre_completo?: string | null
          telefono?: string | null
          avatar_url?: string | null
          rol?: RolUsuario
          created_at?: string
          updated_at?: string
        }
        Update: {
          nombre_completo?: string | null
          telefono?: string | null
          avatar_url?: string | null
          rol?: RolUsuario
          updated_at?: string
        }
      }
      categorias: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          icono: string | null
          color: string
          slug: string
          orden: number
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          icono?: string | null
          color?: string
          slug: string
          orden?: number
          activo?: boolean
        }
        Update: {
          nombre?: string
          descripcion?: string | null
          icono?: string | null
          color?: string
          slug?: string
          orden?: number
          activo?: boolean
        }
      }
      productores: {
        Row: {
          id: string
          user_id: string | null
          nombre_empresa: string
          descripcion: string | null
          tipo: TipoProductor
          estado: EstadoProductor
          ci_nit: string
          ci_nit_url: string | null
          departamento: string
          municipio: string
          direccion: string | null
          ubicacion: string | null  // PostGIS devuelve como string en JSON
          telefono: string | null
          whatsapp: string | null
          email_contacto: string | null
          facebook_url: string | null
          website_url: string | null
          logo_url: string | null
          motivo_rechazo: string | null
          revisado_por: string | null
          revisado_at: string | null
          total_productos: number
          total_vistas: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          nombre_empresa: string
          descripcion?: string | null
          tipo?: TipoProductor
          estado?: EstadoProductor
          ci_nit: string
          municipio: string
          direccion?: string | null
          telefono?: string | null
          whatsapp?: string | null
          email_contacto?: string | null
          logo_url?: string | null
        }
        Update: {
          nombre_empresa?: string
          descripcion?: string | null
          tipo?: TipoProductor
          municipio?: string
          direccion?: string | null
          telefono?: string | null
          whatsapp?: string | null
          email_contacto?: string | null
          facebook_url?: string | null
          website_url?: string | null
          logo_url?: string | null
        }
      }
      productos: {
        Row: {
          id: string
          productor_id: string
          categoria_id: string
          nombre: string
          descripcion: string | null
          precio: number | null
          precio_minimo: number | null
          precio_maximo: number | null
          precio_por_mayor: number | null
          cantidad_minima_mayor: number | null
          unidad: UnidadMedida
          stock: number | null
          imagenes: string[]
          video_url: string | null
          disponible: boolean
          destacado: boolean
          total_vistas: number
          total_favoritos: number
          total_contactos: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          productor_id: string
          categoria_id: string
          nombre: string
          descripcion?: string | null
          precio?: number | null
          precio_por_mayor?: number | null
          cantidad_minima_mayor?: number | null
          unidad?: UnidadMedida
          stock?: number | null
          imagenes?: string[]
          video_url?: string | null
          disponible?: boolean
        }
        Update: {
          nombre?: string
          descripcion?: string | null
          precio?: number | null
          precio_minimo?: number | null
          precio_maximo?: number | null
          precio_por_mayor?: number | null
          cantidad_minima_mayor?: number | null
          unidad?: UnidadMedida
          stock?: number | null
          imagenes?: string[]
          video_url?: string | null
          disponible?: boolean
        }
      }
      puntos_venta: {
        Row: {
          id: string
          productor_id: string
          nombre: string
          direccion: string
          referencia: string | null
          ubicacion: string  // PostGIS
          horario_texto: string | null
          horario_json: Json | null
          telefono: string | null
          es_principal: boolean
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          productor_id: string
          nombre: string
          direccion: string
          referencia?: string | null
          horario_texto?: string | null
          horario_json?: Json | null
          telefono?: string | null
          es_principal?: boolean
        }
        Update: {
          nombre?: string
          direccion?: string
          referencia?: string | null
          horario_texto?: string | null
          horario_json?: Json | null
          activo?: boolean
        }
      }
      favoritos: {
        Row: {
          id: string
          user_id: string
          producto_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          producto_id: string
        }
        Update: never
      }
      contactos: {
        Row: {
          id: string
          comprador_id: string | null
          comprador_nombre: string | null
          comprador_tel: string | null
          productor_id: string
          producto_id: string | null
          mensaje: string
          estado: EstadoContacto
          respuesta: string | null
          respondido_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          comprador_id?: string | null
          comprador_nombre?: string | null
          comprador_tel?: string | null
          productor_id: string
          producto_id?: string | null
          mensaje: string
          estado?: EstadoContacto
        }
        Update: {
          estado?: EstadoContacto
          respuesta?: string | null
          respondido_at?: string | null
        }
      }
    }
    Views: {
      vista_productos_completos: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          precio: number | null
          imagenes: string[]
          imagen_principal: string | null
          unidad: UnidadMedida
          destacado: boolean
          total_vistas: number
          total_favoritos: number
          total_contactos: number
          created_at: string
          categoria_id: string
          categoria_nombre: string
          categoria_icono: string | null
          categoria_color: string
          categoria_slug: string
          productor_id: string
          nombre_empresa: string
          productor_tipo: TipoProductor
          productor_municipio: string
          productor_logo: string | null
          productor_whatsapp: string | null
          productor_telefono: string | null
        }
      }
      vista_mapa_puntos_venta: {
        Row: {
          id: string
          punto_nombre: string
          direccion: string
          referencia: string | null
          punto_telefono: string | null
          horario_texto: string | null
          es_principal: boolean
          latitud: number
          longitud: number
          productor_id: string
          nombre_empresa: string
          productor_tipo: TipoProductor
          productor_logo: string | null
          productor_whatsapp: string | null
          municipio: string
          total_productos: number
        }
      }
      vista_dashboard_stats: {
        Row: {
          total_productores: number
          productores_verificados: number
          productores_pendientes: number
          total_productos: number
          total_contactos: number
          total_favoritos: number
          total_mypes: number
          total_pymes: number
          total_agropecuarios: number
          total_emprendedores: number
          nuevos_este_mes: number
          productos_destacados: number
        }
      }
    }
    Functions: {
      buscar_productos: {
        Args: {
          p_query?: string | null
          p_categoria_id?: string | null
          p_municipio?: string | null
          p_precio_min?: number | null
          p_precio_max?: number | null
          p_limit?: number
          p_offset?: number
        }
        Returns: Array<{
          id: string
          nombre: string
          descripcion: string | null
          precio: number | null
          imagenes: string[]
          imagen_principal: string | null
          unidad: UnidadMedida
          destacado: boolean
          total_favoritos: number
          categoria_nombre: string
          categoria_icono: string | null
          categoria_color: string
          productor_id: string
          nombre_empresa: string
          municipio: string
          productor_logo: string | null
          whatsapp: string | null
          rank: number
        }>
      }
      productores_cercanos: {
        Args: {
          p_lat: number
          p_lng: number
          p_radio_km?: number
          p_limit?: number
        }
        Returns: Array<{
          productor_id: string
          nombre_empresa: string
          tipo: TipoProductor
          municipio: string
          logo_url: string | null
          whatsapp: string | null
          total_productos: number
          distancia_km: number
          latitud: number
          longitud: number
        }>
      }
      incrementar_vista_producto: {
        Args: { p_producto_id: string }
        Returns: void
      }
    }
  }
}

// ============================================================
// TIPOS HELPER — para uso en componentes
// ============================================================
export type Perfil = Database['public']['Tables']['perfiles']['Row']
export type Categoria = Database['public']['Tables']['categorias']['Row']
export type Productor = Database['public']['Tables']['productores']['Row']
export type Producto = Database['public']['Tables']['productos']['Row']
export type PuntoVenta = Database['public']['Tables']['puntos_venta']['Row']
export type Favorito = Database['public']['Tables']['favoritos']['Row']
export type Contacto = Database['public']['Tables']['contactos']['Row']

// Tipos de vistas (ya con joins)
export type ProductoCompleto = Database['public']['Views']['vista_productos_completos']['Row']
export type PuntoVentaMapa = Database['public']['Views']['vista_mapa_puntos_venta']['Row']
export type DashboardStats = Database['public']['Views']['vista_dashboard_stats']['Row']
