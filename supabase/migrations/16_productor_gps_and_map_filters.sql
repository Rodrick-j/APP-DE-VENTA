-- ============================================================
-- 16_productor_gps_and_map_filters.sql
-- Integración de coordenadas explícitas (latitud, longitud), rubro de categoría
-- y filtrado por categoría en el mapa de consumidores.
-- ============================================================

-- 1. Agregar columnas latitud, longitud y rubro_categoria_id a productores si no existen
ALTER TABLE public.productores
  ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS rubro_categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_productores_rubro_cat ON public.productores(rubro_categoria_id);
CREATE INDEX IF NOT EXISTS idx_productores_lat_lng ON public.productores(latitud, longitud);

-- 2. Trigger para sincronizar automáticamente latitud/longitud con ubicacion (PostGIS GEOGRAPHY)
CREATE OR REPLACE FUNCTION public.sync_productor_gps()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se enviaron latitud y longitud explícitas, calcular la ubicacion PostGIS
    IF NEW.latitud IS NOT NULL AND NEW.longitud IS NOT NULL THEN
        NEW.ubicacion := ST_SetSRID(ST_MakePoint(NEW.longitud, NEW.latitud), 4326)::GEOGRAPHY;
    -- O si se insertó ubicacion directamente y latitud/longitud están vacías, extraerlos
    ELSIF NEW.ubicacion IS NOT NULL AND (NEW.latitud IS NULL OR NEW.longitud IS NULL) THEN
        NEW.latitud := ST_Y(NEW.ubicacion::GEOMETRY);
        NEW.longitud := ST_X(NEW.ubicacion::GEOMETRY);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_productor_gps ON public.productores;
CREATE TRIGGER trg_sync_productor_gps
    BEFORE INSERT OR UPDATE ON public.productores
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_productor_gps();

-- 3. Actualizar productores existentes para que latitud y longitud estén poblados desde su ubicacion si existe
UPDATE public.productores
SET latitud = ST_Y(ubicacion::GEOMETRY),
    longitud = ST_X(ubicacion::GEOMETRY)
WHERE ubicacion IS NOT NULL AND (latitud IS NULL OR longitud IS NULL);

-- 4. Actualizar función productores_cercanos con filtro de p_categoria_id (rubro del productor o si tiene productos en esa categoría)
DROP FUNCTION IF EXISTS public.productores_cercanos(FLOAT, FLOAT, FLOAT, INTEGER);
DROP FUNCTION IF EXISTS public.productores_cercanos(FLOAT, FLOAT, FLOAT, INTEGER, UUID);

CREATE OR REPLACE FUNCTION public.productores_cercanos(
    p_lat           FLOAT,
    p_lng           FLOAT,
    p_radio_km      FLOAT DEFAULT 15.0,
    p_limit         INTEGER DEFAULT 100,
    p_categoria_id  UUID DEFAULT NULL
)
RETURNS TABLE (
    productor_id            UUID,
    nombre_empresa          TEXT,
    tipo                    tipo_productor,
    municipio               TEXT,
    direccion               TEXT,
    logo_url                TEXT,
    whatsapp                TEXT,
    total_productos         INTEGER,
    distancia_km            FLOAT,
    latitud                 FLOAT,
    longitud                FLOAT,
    rubro_categoria_id      UUID,
    rubro_categoria_nombre  TEXT,
    rubro_categoria_icono   TEXT
)
LANGUAGE sql
STABLE
AS $$
    SELECT DISTINCT ON (pr.id)
        pr.id AS productor_id,
        pr.nombre_empresa,
        pr.tipo,
        pr.municipio,
        pr.direccion,
        pr.logo_url,
        pr.whatsapp,
        pr.total_productos,
        COALESCE(
            ST_Distance(
                pr.ubicacion,
                ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY
            ) / 1000.0,
            0.0
        ) AS distancia_km,
        COALESCE(pr.latitud, ST_Y(pr.ubicacion::GEOMETRY)) AS latitud,
        COALESCE(pr.longitud, ST_X(pr.ubicacion::GEOMETRY)) AS longitud,
        pr.rubro_categoria_id,
        c.nombre AS rubro_categoria_nombre,
        c.icono AS rubro_categoria_icono
    FROM public.productores pr
    LEFT JOIN public.categorias c ON c.id = pr.rubro_categoria_id
    WHERE
        pr.estado = 'verificado'
        AND pr.ubicacion IS NOT NULL
        -- Filtro por radio
        AND ST_DWithin(
            pr.ubicacion,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY,
            p_radio_km * 1000
        )
        -- Filtro por categoría (ya sea por su rubro principal o porque tiene productos de esa categoría)
        AND (
            p_categoria_id IS NULL
            OR pr.rubro_categoria_id = p_categoria_id
            OR EXISTS (
                SELECT 1 FROM public.productos prod
                WHERE prod.productor_id = pr.id
                  AND prod.categoria_id = p_categoria_id
                  AND prod.disponible = TRUE
            )
        )
    ORDER BY pr.id, distancia_km ASC
    LIMIT p_limit;
$$;

-- 5. Función complementaria: todos los productores verificados en el mapa (incluso si están fuera de radio, útil para vista general Oruro)
CREATE OR REPLACE FUNCTION public.productores_en_mapa(
    p_categoria_id  UUID DEFAULT NULL,
    p_query         TEXT DEFAULT NULL
)
RETURNS TABLE (
    productor_id            UUID,
    nombre_empresa          TEXT,
    tipo                    tipo_productor,
    municipio               TEXT,
    direccion               TEXT,
    logo_url                TEXT,
    whatsapp                TEXT,
    total_productos         INTEGER,
    distancia_km            FLOAT,
    latitud                 FLOAT,
    longitud                FLOAT,
    rubro_categoria_id      UUID,
    rubro_categoria_nombre  TEXT,
    rubro_categoria_icono   TEXT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        pr.id AS productor_id,
        pr.nombre_empresa,
        pr.tipo,
        pr.municipio,
        pr.direccion,
        pr.logo_url,
        pr.whatsapp,
        pr.total_productos,
        0.0 AS distancia_km,
        COALESCE(pr.latitud, ST_Y(pr.ubicacion::GEOMETRY)) AS latitud,
        COALESCE(pr.longitud, ST_X(pr.ubicacion::GEOMETRY)) AS longitud,
        pr.rubro_categoria_id,
        c.nombre AS rubro_categoria_nombre,
        c.icono AS rubro_categoria_icono
    FROM public.productores pr
    LEFT JOIN public.categorias c ON c.id = pr.rubro_categoria_id
    WHERE
        pr.estado = 'verificado'
        AND pr.ubicacion IS NOT NULL
        AND (
            p_categoria_id IS NULL
            OR pr.rubro_categoria_id = p_categoria_id
            OR EXISTS (
                SELECT 1 FROM public.productos prod
                WHERE prod.productor_id = pr.id
                  AND prod.categoria_id = p_categoria_id
                  AND prod.disponible = TRUE
            )
        )
        AND (
            p_query IS NULL
            OR pr.nombre_empresa ILIKE '%' || p_query || '%'
            OR pr.municipio ILIKE '%' || p_query || '%'
        )
    ORDER BY pr.nombre_empresa ASC;
$$;

COMMENT ON FUNCTION public.sync_productor_gps() IS 'Sincroniza latitud y longitud con PostGIS GEOGRAPHY en tiempo real al registrar o actualizar productor.';
COMMENT ON FUNCTION public.productores_cercanos(FLOAT, FLOAT, FLOAT, INTEGER, UUID) IS 'Devuelve productores con sus coordenadas GPS y rubro, filtrable por categoría.';
