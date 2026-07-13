-- ============================================================
-- 06_productos.sql
-- Productos publicados por los productores en el marketplace
-- ============================================================

CREATE TABLE public.productos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    productor_id    UUID NOT NULL REFERENCES public.productores(id) ON DELETE CASCADE,
    categoria_id    UUID NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,

    -- Información del producto
    nombre          TEXT NOT NULL,
    descripcion     TEXT,
    precio          DECIMAL(10, 2),       -- NULL = precio a consultar
    precio_minimo   DECIMAL(10, 2),       -- Para rangos de precio
    precio_maximo   DECIMAL(10, 2),
    unidad          unidad_medida NOT NULL DEFAULT 'unidad',
    stock           INTEGER,              -- NULL = sin límite declarado

    -- Imágenes (array de URLs de Supabase Storage)
    -- La primera imagen del array es la imagen principal
    imagenes        TEXT[] NOT NULL DEFAULT '{}',

    -- Búsqueda full-text (se actualiza con trigger)
    search_vector   TSVECTOR,

    -- Visibilidad
    disponible      BOOLEAN NOT NULL DEFAULT TRUE,
    destacado       BOOLEAN NOT NULL DEFAULT FALSE,  -- El admin puede destacar productos

    -- Métricas
    total_vistas    INTEGER NOT NULL DEFAULT 0,
    total_favoritos INTEGER NOT NULL DEFAULT 0,
    total_contactos INTEGER NOT NULL DEFAULT 0,

    -- Metadatos
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_productos_productor_id  ON public.productos(productor_id);
CREATE INDEX idx_productos_categoria_id  ON public.productos(categoria_id);
CREATE INDEX idx_productos_disponible    ON public.productos(disponible);
CREATE INDEX idx_productos_destacado     ON public.productos(destacado);
CREATE INDEX idx_productos_precio        ON public.productos(precio);
CREATE INDEX idx_productos_created_at    ON public.productos(created_at DESC);

-- Índice GIN para búsqueda full-text (muy importante para el buscador)
CREATE INDEX idx_productos_search ON public.productos USING GIN(search_vector);

-- Índice trigram para búsqueda por similitud (buscar aunque escriban mal)
CREATE INDEX idx_productos_nombre_trgm ON public.productos USING GIN(nombre gin_trgm_ops);

-- ============================================================
-- FUNCIÓN: Actualiza el search_vector cuando cambia el producto
-- Indexa nombre + descripción para búsqueda full-text en español
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_producto_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('spanish', COALESCE(NEW.nombre, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.descripcion, '')), 'B');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_productos_search_vector
    BEFORE INSERT OR UPDATE ON public.productos
    FOR EACH ROW EXECUTE FUNCTION public.update_producto_search_vector();

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE TRIGGER trg_productos_updated_at
    BEFORE UPDATE ON public.productos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- FUNCIÓN: Actualiza el contador de productos del productor
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_productor_total_productos()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.productores
        SET total_productos = (
            SELECT COUNT(*) FROM public.productos
            WHERE productor_id = OLD.productor_id AND disponible = TRUE
        )
        WHERE id = OLD.productor_id;
        RETURN OLD;
    ELSE
        UPDATE public.productores
        SET total_productos = (
            SELECT COUNT(*) FROM public.productos
            WHERE productor_id = NEW.productor_id AND disponible = TRUE
        )
        WHERE id = NEW.productor_id;
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER trg_sync_productor_productos
    AFTER INSERT OR UPDATE OR DELETE ON public.productos
    FOR EACH ROW EXECUTE FUNCTION public.sync_productor_total_productos();

-- ============================================================
-- COMENTARIOS
-- ============================================================
COMMENT ON TABLE  public.productos               IS 'Productos publicados por los productores en el marketplace';
COMMENT ON COLUMN public.productos.imagenes      IS 'Array de URLs de Supabase Storage. El índice 0 es la imagen principal.';
COMMENT ON COLUMN public.productos.search_vector IS 'Índice full-text actualizado automáticamente por trigger';
COMMENT ON COLUMN public.productos.precio        IS 'NULL significa precio a consultar directamente con el productor';
COMMENT ON COLUMN public.productos.destacado     IS 'Solo el admin puede marcar productos como destacados';
