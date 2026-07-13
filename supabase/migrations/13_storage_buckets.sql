-- ============================================================
-- 13_storage_buckets.sql
-- Configuración de los buckets de Supabase Storage
-- para almacenar fotos de productos, logos y documentos
-- ============================================================

-- Bucket para fotos de productos (público — cualquiera puede ver las fotos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'productos-fotos',
    'productos-fotos',
    TRUE,                           -- Público: las fotos son visibles sin autenticación
    5242880,                        -- Máximo 5MB por foto
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para logos de productores (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'productores-logos',
    'productores-logos',
    TRUE,
    2097152,                        -- Máximo 2MB por logo
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para documentos privados (CI, NIT — NO público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documentos-privados',
    'documentos-privados',
    FALSE,                          -- PRIVADO: solo el productor y el admin pueden ver
    10485760,                       -- Máximo 10MB por documento
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para reportes generados (solo admins)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'reportes-gobernacion',
    'reportes-gobernacion',
    FALSE,                          -- PRIVADO: solo admins
    52428800,                       -- Máximo 50MB por reporte
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- POLÍTICAS DE STORAGE
-- ============================================================

-- productos-fotos: cualquiera puede VER, solo el productor puede SUBIR
CREATE POLICY "productos_fotos_select_public"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'productos-fotos');

CREATE POLICY "productos_fotos_insert_producer"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'productos-fotos'
        AND auth.role() = 'authenticated'
        -- El archivo debe estar en la carpeta del productor: {productor_id}/...
        AND (storage.foldername(name))[1] IN (
            SELECT id::TEXT FROM public.productores
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "productos_fotos_delete_own"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'productos-fotos'
        AND (storage.foldername(name))[1] IN (
            SELECT id::TEXT FROM public.productores WHERE user_id = auth.uid()
        )
    );

-- productores-logos: igual que productos-fotos
CREATE POLICY "logos_select_public"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'productores-logos');

CREATE POLICY "logos_insert_own"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'productores-logos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] IN (
            SELECT id::TEXT FROM public.productores WHERE user_id = auth.uid()
        )
    );

-- documentos-privados: solo el propio productor y admins
CREATE POLICY "docs_privados_select"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documentos-privados'
        AND (
            (storage.foldername(name))[1] IN (
                SELECT id::TEXT FROM public.productores WHERE user_id = auth.uid()
            )
            OR public.get_my_rol() IN ('admin', 'moderador')
        )
    );

CREATE POLICY "docs_privados_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documentos-privados'
        AND (storage.foldername(name))[1] IN (
            SELECT id::TEXT FROM public.productores WHERE user_id = auth.uid()
        )
    );

-- reportes-gobernacion: solo admins
CREATE POLICY "reportes_admin_only_storage"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'reportes-gobernacion'
        AND public.get_my_rol() IN ('admin', 'moderador')
    )
    WITH CHECK (
        bucket_id = 'reportes-gobernacion'
        AND public.get_my_rol() IN ('admin', 'moderador')
    );
