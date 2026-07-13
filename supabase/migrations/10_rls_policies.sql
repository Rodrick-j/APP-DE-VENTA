-- ============================================================
-- 10_rls_policies.sql
-- Row Level Security — El escudo de seguridad de la base de datos
-- SIN ESTO, cualquier usuario puede ver TODO. Con esto, cada
-- usuario solo ve lo que le corresponde.
-- ============================================================

-- ============================================================
-- HELPER FUNCTION: Obtener el rol del usuario actual
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_rol()
RETURNS rol_usuario
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT rol FROM public.perfiles
    WHERE user_id = auth.uid()
$$;

-- ============================================================
-- TABLA: perfiles
-- ============================================================
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver perfiles públicos
CREATE POLICY "perfiles_select_public"
    ON public.perfiles FOR SELECT
    USING (TRUE);

-- Solo el propio usuario puede editar su perfil
CREATE POLICY "perfiles_update_own"
    ON public.perfiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Solo el propio usuario puede insertar su perfil (o el trigger automático)
CREATE POLICY "perfiles_insert_own"
    ON public.perfiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLA: categorias
-- ============================================================
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver categorías activas
CREATE POLICY "categorias_select_all"
    ON public.categorias FOR SELECT
    USING (activo = TRUE OR public.get_my_rol() = 'admin');

-- Solo admins pueden modificar categorías
CREATE POLICY "categorias_write_admin"
    ON public.categorias FOR ALL
    USING (public.get_my_rol() IN ('admin', 'moderador'))
    WITH CHECK (public.get_my_rol() IN ('admin', 'moderador'));

-- ============================================================
-- TABLA: productores
-- ============================================================
ALTER TABLE public.productores ENABLE ROW LEVEL SECURITY;

-- Cualquiera (incluye sin cuenta) puede ver productores VERIFICADOS
CREATE POLICY "productores_select_verificados"
    ON public.productores FOR SELECT
    USING (
        estado = 'verificado'
        OR auth.uid() = user_id           -- el propio productor ve su perfil
        OR public.get_my_rol() IN ('admin', 'moderador')  -- admins ven todos
    );

-- Un productor puede crear su propio perfil de productor
CREATE POLICY "productores_insert_own"
    ON public.productores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- El productor puede editar su propio perfil
-- El admin puede editar cualquiera (para aprobar/rechazar)
CREATE POLICY "productores_update"
    ON public.productores FOR UPDATE
    USING (
        auth.uid() = user_id
        OR public.get_my_rol() IN ('admin', 'moderador')
    );

-- Solo admins pueden eliminar productores
CREATE POLICY "productores_delete_admin"
    ON public.productores FOR DELETE
    USING (public.get_my_rol() = 'admin');

-- ============================================================
-- TABLA: productos
-- ============================================================
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver productos disponibles de productores verificados
CREATE POLICY "productos_select_public"
    ON public.productos FOR SELECT
    USING (
        (
            disponible = TRUE
            AND EXISTS (
                SELECT 1 FROM public.productores p
                WHERE p.id = productor_id
                AND p.estado = 'verificado'
            )
        )
        -- O el propio productor ve sus propios productos (incluso inactivos)
        OR EXISTS (
            SELECT 1 FROM public.productores p
            WHERE p.id = productor_id
            AND p.user_id = auth.uid()
        )
        -- O el admin ve todo
        OR public.get_my_rol() IN ('admin', 'moderador')
    );

-- Solo el productor dueño puede crear productos
CREATE POLICY "productos_insert_own"
    ON public.productos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.productores p
            WHERE p.id = productor_id
            AND p.user_id = auth.uid()
            AND p.estado = 'verificado'  -- Solo productores verificados pueden publicar
        )
        OR public.get_my_rol() = 'admin'
    );

-- El productor puede editar sus propios productos; el admin puede editar cualquiera
CREATE POLICY "productos_update"
    ON public.productos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.productores p
            WHERE p.id = productor_id AND p.user_id = auth.uid()
        )
        OR public.get_my_rol() IN ('admin', 'moderador')
    );

-- El productor puede eliminar sus propios productos; el admin puede eliminar cualquiera
CREATE POLICY "productos_delete"
    ON public.productos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.productores p
            WHERE p.id = productor_id AND p.user_id = auth.uid()
        )
        OR public.get_my_rol() = 'admin'
    );

-- ============================================================
-- TABLA: puntos_venta
-- ============================================================
ALTER TABLE public.puntos_venta ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver puntos de venta activos de productores verificados
CREATE POLICY "puntos_venta_select_public"
    ON public.puntos_venta FOR SELECT
    USING (
        (activo = TRUE AND EXISTS (
            SELECT 1 FROM public.productores p
            WHERE p.id = productor_id AND p.estado = 'verificado'
        ))
        OR EXISTS (
            SELECT 1 FROM public.productores p
            WHERE p.id = productor_id AND p.user_id = auth.uid()
        )
        OR public.get_my_rol() IN ('admin', 'moderador')
    );

-- El productor gestiona sus propios puntos de venta
CREATE POLICY "puntos_venta_write_own"
    ON public.puntos_venta FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.productores p
            WHERE p.id = productor_id AND p.user_id = auth.uid()
        )
        OR public.get_my_rol() IN ('admin', 'moderador')
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.productores p
            WHERE p.id = productor_id AND p.user_id = auth.uid()
        )
        OR public.get_my_rol() IN ('admin', 'moderador')
    );

-- ============================================================
-- TABLA: favoritos
-- ============================================================
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

-- Solo el dueño ve sus favoritos
CREATE POLICY "favoritos_own"
    ON public.favoritos FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLA: contactos
-- ============================================================
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;

-- El comprador ve sus mensajes enviados
-- El productor ve los mensajes recibidos
-- El admin ve todos
CREATE POLICY "contactos_select"
    ON public.contactos FOR SELECT
    USING (
        auth.uid() = comprador_id
        OR EXISTS (
            SELECT 1 FROM public.productores p
            WHERE p.id = productor_id AND p.user_id = auth.uid()
        )
        OR public.get_my_rol() IN ('admin', 'moderador')
    );

-- Cualquiera autenticado puede enviar un mensaje
CREATE POLICY "contactos_insert"
    ON public.contactos FOR INSERT
    WITH CHECK (auth.uid() = comprador_id OR comprador_id IS NULL);

-- El productor puede responder; el admin puede modificar cualquiera
CREATE POLICY "contactos_update"
    ON public.contactos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.productores p
            WHERE p.id = productor_id AND p.user_id = auth.uid()
        )
        OR public.get_my_rol() = 'admin'
    );

-- ============================================================
-- TABLA: reportes
-- ============================================================
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

-- Solo admins y moderadores pueden ver reportes
CREATE POLICY "reportes_admin_only"
    ON public.reportes FOR ALL
    USING (public.get_my_rol() IN ('admin', 'moderador'))
    WITH CHECK (public.get_my_rol() IN ('admin', 'moderador'));
