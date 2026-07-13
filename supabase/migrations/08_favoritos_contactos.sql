-- ============================================================
-- 08_favoritos_contactos.sql
-- Favoritos: ciudadanos que guardan productos
-- Contactos: mensajes entre compradores y productores
-- ============================================================

-- ============================================================
-- TABLA: favoritos
-- ============================================================
CREATE TABLE public.favoritos (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Un usuario no puede guardar el mismo producto dos veces
    CONSTRAINT uq_favorito_usuario_producto UNIQUE (user_id, producto_id)
);

CREATE INDEX idx_favoritos_user_id    ON public.favoritos(user_id);
CREATE INDEX idx_favoritos_producto_id ON public.favoritos(producto_id);

-- Actualiza el contador de favoritos en productos
CREATE OR REPLACE FUNCTION public.sync_producto_total_favoritos()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.productos
        SET total_favoritos = total_favoritos - 1
        WHERE id = OLD.producto_id;
        RETURN OLD;
    ELSE
        UPDATE public.productos
        SET total_favoritos = total_favoritos + 1
        WHERE id = NEW.producto_id;
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER trg_sync_favoritos
    AFTER INSERT OR DELETE ON public.favoritos
    FOR EACH ROW EXECUTE FUNCTION public.sync_producto_total_favoritos();

COMMENT ON TABLE public.favoritos IS 'Productos guardados como favoritos por los compradores';

-- ============================================================
-- TABLA: contactos
-- El comprador hace una consulta sobre un producto.
-- El productor responde por la app o por WhatsApp.
-- ============================================================
CREATE TABLE public.contactos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Quién pregunta
    comprador_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- Nombre del comprador si no tiene cuenta
    comprador_nombre TEXT,
    comprador_tel    TEXT,

    -- A quién le pregunta
    productor_id    UUID NOT NULL REFERENCES public.productores(id) ON DELETE CASCADE,

    -- Sobre qué producto (opcional, puede ser consulta general)
    producto_id     UUID REFERENCES public.productos(id) ON DELETE SET NULL,

    -- El mensaje
    mensaje         TEXT NOT NULL,
    estado          estado_contacto NOT NULL DEFAULT 'nuevo',

    -- Respuesta del productor
    respuesta       TEXT,
    respondido_at   TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contactos_comprador_id  ON public.contactos(comprador_id);
CREATE INDEX idx_contactos_productor_id  ON public.contactos(productor_id);
CREATE INDEX idx_contactos_producto_id   ON public.contactos(producto_id);
CREATE INDEX idx_contactos_estado        ON public.contactos(estado);

-- Actualiza el contador de contactos en productos
CREATE OR REPLACE FUNCTION public.sync_producto_total_contactos()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.productos
    SET total_contactos = total_contactos + 1
    WHERE id = NEW.producto_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_contactos
    AFTER INSERT ON public.contactos
    FOR EACH ROW
    WHEN (NEW.producto_id IS NOT NULL)
    EXECUTE FUNCTION public.sync_producto_total_contactos();

COMMENT ON TABLE  public.contactos              IS 'Mensajes/consultas enviados por compradores a productores sobre productos';
COMMENT ON COLUMN public.contactos.producto_id  IS 'NULL si es una consulta general al productor, no sobre un producto específico';
