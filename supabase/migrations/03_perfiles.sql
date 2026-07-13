-- ============================================================
-- 03_perfiles.sql
-- Tabla de perfiles extendida (complementa auth.users de Supabase)
-- Supabase crea auth.users automáticamente con el login.
-- Esta tabla guarda info adicional del usuario.
-- ============================================================

CREATE TABLE public.perfiles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Referencia al usuario de autenticación de Supabase
    user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    nombre_completo TEXT,
    telefono        TEXT,
    avatar_url      TEXT,
    rol             rol_usuario NOT NULL DEFAULT 'comprador',
    
    -- Metadatos
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_perfiles_user_id ON public.perfiles(user_id);
CREATE INDEX idx_perfiles_rol     ON public.perfiles(rol);

-- Comentarios de documentación
COMMENT ON TABLE  public.perfiles                IS 'Perfil extendido del usuario, complementa auth.users';
COMMENT ON COLUMN public.perfiles.user_id        IS 'FK al usuario autenticado por Supabase Auth';
COMMENT ON COLUMN public.perfiles.rol            IS 'Rol del usuario en el sistema: comprador, productor, admin, moderador';

-- ============================================================
-- TRIGGER: Crea el perfil automáticamente cuando alguien se registra
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.perfiles (user_id, nombre_completo, rol)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'rol')::rol_usuario, 'comprador')
    );
    RETURN NEW;
END;
$$;

-- Activar el trigger en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: Actualiza updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_perfiles_updated_at
    BEFORE UPDATE ON public.perfiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
