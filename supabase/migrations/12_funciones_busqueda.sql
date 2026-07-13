-- ============================================================
-- 12_funciones_busqueda.sql
-- Funciones SQL para búsqueda avanzada y geolocalización
-- ============================================================

-- ============================================================
-- FUNCIÓN: Buscar productos por texto y filtros
-- Combina full-text search + filtro por categoría/municipio/precio
-- ============================================================
CREATE OR REPLACE FUNCTION public.buscar_productos(
    p_query         TEXT DEFAULT NULL,
    p_categoria_id  UUID DEFAULT NULL,
    p_municipio     TEXT DEFAULT NULL,
    p_precio_min    DECIMAL DEFAULT NULL,
    p_precio_max    DECIMAL DEFAULT NULL,
    p_limit         INTEGER DEFAULT 20,
    p_offset        INTEGER DEFAULT 0
)
RETURNS TABLE (
    id              UUID,
    nombre          TEXT,
    descripcion     TEXT,
    precio          DECIMAL,
    imagenes        TEXT[],
    imagen_principal TEXT,
    unidad          unidad_medida,
    destacado       BOOLEAN,
    total_favoritos INTEGER,
    categoria_nombre TEXT,
    categoria_icono TEXT,
    categoria_color TEXT,
    productor_id    UUID,
    nombre_empresa  TEXT,
    municipio       TEXT,
    productor_logo  TEXT,
    whatsapp        TEXT,
    rank            REAL
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagenes,
        CASE WHEN array_length(p.imagenes, 1) > 0 THEN p.imagenes[1] ELSE NULL END,
        p.unidad,
        p.destacado,
        p.total_favoritos,
        c.nombre,
        c.icono,
        c.color,
        pr.id,
        pr.nombre_empresa,
        pr.municipio,
        pr.logo_url,
        pr.whatsapp,

        -- Relevancia del resultado (destacados primero, luego por texto)
        CASE
            WHEN p_query IS NULL THEN
                CASE WHEN p.destacado THEN 1.0 ELSE 0.5 END
            ELSE
                ts_rank(p.search_vector, websearch_to_tsquery('spanish', p_query))
                + CASE WHEN p.destacado THEN 0.5 ELSE 0.0 END
        END AS rank

    FROM public.productos p
    JOIN public.categorias c   ON c.id = p.categoria_id
    JOIN public.productores pr ON pr.id = p.productor_id

    WHERE
        p.disponible = TRUE
        AND pr.estado = 'verificado'
        AND c.activo = TRUE

        -- Filtro full-text (si hay búsqueda de texto)
        AND (
            p_query IS NULL
            OR p.search_vector @@ websearch_to_tsquery('spanish', p_query)
            OR p.nombre ILIKE '%' || p_query || '%'  -- fallback para palabras cortas
        )

        -- Filtro por categoría
        AND (p_categoria_id IS NULL OR p.categoria_id = p_categoria_id)

        -- Filtro por municipio del productor
        AND (p_municipio IS NULL OR pr.municipio ILIKE '%' || p_municipio || '%')

        -- Filtro por rango de precio
        AND (p_precio_min IS NULL OR p.precio >= p_precio_min)
        AND (p_precio_max IS NULL OR p.precio <= p_precio_max)

    ORDER BY rank DESC, p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
$$;

-- ============================================================
-- FUNCIÓN: Encontrar productores cercanos a una coordenada
-- Usada por la pantalla del MAPA para mostrar productores próximos
-- ============================================================
CREATE OR REPLACE FUNCTION public.productores_cercanos(
    p_lat       FLOAT,
    p_lng       FLOAT,
    p_radio_km  FLOAT DEFAULT 10.0,  -- radio en kilómetros
    p_limit     INTEGER DEFAULT 50
)
RETURNS TABLE (
    productor_id        UUID,
    nombre_empresa      TEXT,
    tipo                tipo_productor,
    municipio           TEXT,
    logo_url            TEXT,
    whatsapp            TEXT,
    total_productos     INTEGER,
    distancia_km        FLOAT,
    latitud             FLOAT,
    longitud            FLOAT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        pr.id,
        pr.nombre_empresa,
        pr.tipo,
        pr.municipio,
        pr.logo_url,
        pr.whatsapp,
        pr.total_productos,
        -- Distancia en km desde el punto dado
        ST_Distance(
            pr.ubicacion,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY
        ) / 1000.0 AS distancia_km,
        ST_Y(pr.ubicacion::GEOMETRY) AS latitud,
        ST_X(pr.ubicacion::GEOMETRY) AS longitud

    FROM public.productores pr
    WHERE
        pr.estado = 'verificado'
        AND pr.ubicacion IS NOT NULL
        -- Solo los que están dentro del radio
        AND ST_DWithin(
            pr.ubicacion,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY,
            p_radio_km * 1000  -- DWithin trabaja en metros
        )

    ORDER BY distancia_km ASC
    LIMIT p_limit;
$$;

-- ============================================================
-- FUNCIÓN: Incrementar vista de un producto
-- Llamada cada vez que un usuario abre el detalle de un producto
-- ============================================================
CREATE OR REPLACE FUNCTION public.incrementar_vista_producto(p_producto_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE public.productos
    SET total_vistas = total_vistas + 1
    WHERE id = p_producto_id;
$$;

COMMENT ON FUNCTION public.buscar_productos IS 'Búsqueda full-text + filtros para el marketplace. Combina tsvector con fallback ILIKE.';
COMMENT ON FUNCTION public.productores_cercanos IS 'Encuentra productores dentro de un radio en km usando PostGIS ST_DWithin.';
COMMENT ON FUNCTION public.incrementar_vista_producto IS 'Incrementa el contador de vistas de forma segura (SECURITY DEFINER).';
