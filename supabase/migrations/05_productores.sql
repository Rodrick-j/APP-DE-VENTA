-- ============================================================
-- 05_productores.sql
-- Tabla principal de productores (MYPEs, PYMEs, agropecuarios, etc.)
-- Es el corazón del sistema — todo gira alrededor del productor.
-- ============================================================

CREATE TABLE public.productores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Vinculado al usuario autenticado
    user_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Datos de la empresa / emprendimiento
    nombre_empresa  TEXT NOT NULL,
    descripcion     TEXT,
    tipo            tipo_productor NOT NULL DEFAULT 'EMPRENDEDOR',
    estado          estado_productor NOT NULL DEFAULT 'pendiente',

    -- Documento de identidad (clave de negocio única)
    ci_nit          TEXT NOT NULL UNIQUE,
    ci_nit_url      TEXT,   -- Foto del CI/NIT subida a Storage

    -- Ubicación administrativa
    departamento    TEXT NOT NULL DEFAULT 'Oruro',
    municipio       TEXT NOT NULL,
    direccion       TEXT,

    -- Geolocalización para el mapa (PostGIS)
    -- GEOGRAPHY almacena coordenadas reales de la Tierra (más preciso que GEOMETRY)
    ubicacion       GEOGRAPHY(POINT, 4326),

    -- Contacto
    telefono        TEXT,
    whatsapp        TEXT,
    email_contacto  TEXT,
    facebook_url    TEXT,
    website_url     TEXT,

    -- Imagen
    logo_url        TEXT,   -- URL de Supabase Storage

    -- Motivo de rechazo (si estado = 'rechazado')
    motivo_rechazo  TEXT,

    -- Quién aprobó/rechazó (FK a admin)
    revisado_por    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    revisado_at     TIMESTAMPTZ,

    -- Métricas (se actualizan con triggers)
    total_productos INTEGER NOT NULL DEFAULT 0,
    total_vistas    INTEGER NOT NULL DEFAULT 0,

    -- Metadatos
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES — para consultas rápidas
-- ============================================================
CREATE INDEX idx_productores_user_id   ON public.productores(user_id);
CREATE INDEX idx_productores_estado    ON public.productores(estado);
CREATE INDEX idx_productores_tipo      ON public.productores(tipo);
CREATE INDEX idx_productores_municipio ON public.productores(municipio);
CREATE INDEX idx_productores_ci_nit    ON public.productores(ci_nit);

-- Índice espacial para consultas de mapa (el más importante para el mapa)
CREATE INDEX idx_productores_ubicacion ON public.productores USING GIST(ubicacion);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE TRIGGER trg_productores_updated_at
    BEFORE UPDATE ON public.productores
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================
COMMENT ON TABLE  public.productores              IS 'Productores registrados: MYPEs, PYMEs, agropecuarios y emprendedores del dpto. de Oruro';
COMMENT ON COLUMN public.productores.ci_nit       IS 'CI o NIT del productor/empresa — debe ser único en el sistema';
COMMENT ON COLUMN public.productores.ubicacion    IS 'Punto geográfico PostGIS (EPSG:4326) para el mapa de productores';
COMMENT ON COLUMN public.productores.estado       IS 'pendiente → verificado → activo en la app. Solo verificados aparecen en el marketplace';
COMMENT ON COLUMN public.productores.revisado_por IS 'Admin de la Gobernación que aprobó o rechazó el registro';
