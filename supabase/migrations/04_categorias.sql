-- ============================================================
-- 04_categorias.sql
-- Categorías de productos del marketplace
-- ============================================================

CREATE TABLE public.categorias (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre      TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    icono       TEXT,               -- nombre del icono (ej: "apple", "cow", "shirt")
    color       TEXT DEFAULT '#1a7a4a', -- color hex para la UI
    slug        TEXT NOT NULL UNIQUE,   -- URL-friendly (ej: "lacteos", "frutas")
    orden       INTEGER DEFAULT 0,      -- para ordenar en la UI
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_categorias_slug   ON public.categorias(slug);
CREATE INDEX idx_categorias_activo ON public.categorias(activo);

COMMENT ON TABLE  public.categorias        IS 'Categorías de productos del marketplace';
COMMENT ON COLUMN public.categorias.slug   IS 'Identificador URL-friendly de la categoría';
COMMENT ON COLUMN public.categorias.icono  IS 'Nombre del icono de MaterialCommunityIcons para React Native';
COMMENT ON COLUMN public.categorias.orden  IS 'Orden de aparición en la pantalla principal de la app';
