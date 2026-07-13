-- ============================================================
-- 15_alibaba_upgrade.sql
-- Nuevos campos para la versión B2B/B2C (Precios por volumen, video)
-- ============================================================

-- Agregar precio por mayor
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS precio_por_mayor DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS cantidad_minima_mayor INTEGER,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Comentarios explicativos
COMMENT ON COLUMN public.productos.precio_por_mayor IS 'Precio especial para ventas al por mayor (B2B)';
COMMENT ON COLUMN public.productos.cantidad_minima_mayor IS 'Cantidad mínima para aplicar el precio_por_mayor';
COMMENT ON COLUMN public.productos.video_url IS 'URL de Supabase Storage para un video corto del producto';
