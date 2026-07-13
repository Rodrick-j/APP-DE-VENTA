-- ============================================================
-- 11_views_utiles.sql
-- Vistas optimizadas para la app y el panel admin
-- Las vistas combinan tablas para que la app haga UNA sola consulta
-- ============================================================

-- ============================================================
-- VISTA: productos_completos
-- Incluye info del productor y la categoría
-- La app usa esta vista para mostrar el listado de productos
-- ============================================================
CREATE OR REPLACE VIEW public.vista_productos_completos AS
SELECT
    p.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.precio_minimo,
    p.precio_maximo,
    p.unidad,
    p.imagenes,
    p.disponible,
    p.destacado,
    p.total_vistas,
    p.total_favoritos,
    p.total_contactos,
    p.created_at,

    -- Categoría
    c.id            AS categoria_id,
    c.nombre        AS categoria_nombre,
    c.icono         AS categoria_icono,
    c.color         AS categoria_color,
    c.slug          AS categoria_slug,

    -- Productor
    pr.id           AS productor_id,
    pr.nombre_empresa,
    pr.tipo         AS productor_tipo,
    pr.municipio    AS productor_municipio,
    pr.logo_url     AS productor_logo,
    pr.whatsapp     AS productor_whatsapp,
    pr.telefono     AS productor_telefono,

    -- Primera imagen (para thumbnail)
    CASE
        WHEN array_length(p.imagenes, 1) > 0 THEN p.imagenes[1]
        ELSE NULL
    END AS imagen_principal

FROM public.productos p
JOIN public.categorias c  ON c.id = p.categoria_id
JOIN public.productores pr ON pr.id = p.productor_id
WHERE p.disponible = TRUE
  AND pr.estado = 'verificado'
  AND c.activo = TRUE;

-- ============================================================
-- VISTA: productores_con_stats
-- Usada por el panel admin — muestra productores con métricas
-- ============================================================
CREATE OR REPLACE VIEW public.vista_productores_stats AS
SELECT
    pr.id,
    pr.nombre_empresa,
    pr.tipo,
    pr.estado,
    pr.ci_nit,
    pr.municipio,
    pr.departamento,
    pr.telefono,
    pr.whatsapp,
    pr.email_contacto,
    pr.logo_url,
    pr.total_productos,
    pr.total_vistas,
    pr.created_at,
    pr.revisado_at,

    -- Datos del usuario vinculado
    u.email         AS usuario_email,
    pf.nombre_completo AS usuario_nombre,
    pf.telefono     AS usuario_telefono,

    -- Quién lo aprobó
    admin_pf.nombre_completo AS revisado_por_nombre,

    -- Cantidad de puntos de venta
    (SELECT COUNT(*) FROM public.puntos_venta pv
     WHERE pv.productor_id = pr.id AND pv.activo = TRUE) AS total_puntos_venta,

    -- Cantidad de contactos recibidos
    (SELECT COUNT(*) FROM public.contactos co
     WHERE co.productor_id = pr.id) AS total_contactos

FROM public.productores pr
LEFT JOIN auth.users u        ON u.id = pr.user_id
LEFT JOIN public.perfiles pf  ON pf.user_id = pr.user_id
LEFT JOIN public.perfiles admin_pf ON admin_pf.user_id = pr.revisado_por;

-- ============================================================
-- VISTA: mapa_puntos_venta
-- Para la pantalla del mapa — incluye coordenadas como lat/lng
-- ============================================================
CREATE OR REPLACE VIEW public.vista_mapa_puntos_venta AS
SELECT
    pv.id,
    pv.nombre          AS punto_nombre,
    pv.direccion,
    pv.referencia,
    pv.telefono        AS punto_telefono,
    pv.horario_texto,
    pv.es_principal,

    -- Coordenadas extraídas del punto PostGIS
    ST_Y(pv.ubicacion::GEOMETRY) AS latitud,
    ST_X(pv.ubicacion::GEOMETRY) AS longitud,

    -- Datos del productor
    pr.id              AS productor_id,
    pr.nombre_empresa,
    pr.tipo            AS productor_tipo,
    pr.logo_url        AS productor_logo,
    pr.whatsapp        AS productor_whatsapp,
    pr.municipio,

    -- Cantidad de productos del productor
    pr.total_productos

FROM public.puntos_venta pv
JOIN public.productores pr ON pr.id = pv.productor_id
WHERE pv.activo = TRUE
  AND pr.estado = 'verificado';

-- ============================================================
-- VISTA: dashboard_stats (para el panel admin)
-- Una sola consulta que da todas las métricas del dashboard
-- ============================================================
CREATE OR REPLACE VIEW public.vista_dashboard_stats AS
SELECT
    -- Totales generales
    (SELECT COUNT(*) FROM public.productores) AS total_productores,
    (SELECT COUNT(*) FROM public.productores WHERE estado = 'verificado') AS productores_verificados,
    (SELECT COUNT(*) FROM public.productores WHERE estado = 'pendiente') AS productores_pendientes,
    (SELECT COUNT(*) FROM public.productos WHERE disponible = TRUE) AS total_productos,
    (SELECT COUNT(*) FROM public.contactos) AS total_contactos,
    (SELECT COUNT(*) FROM public.favoritos) AS total_favoritos,

    -- Por tipo de productor
    (SELECT COUNT(*) FROM public.productores WHERE tipo = 'MYPE') AS total_mypes,
    (SELECT COUNT(*) FROM public.productores WHERE tipo = 'PYME') AS total_pymes,
    (SELECT COUNT(*) FROM public.productores WHERE tipo = 'AGROPECUARIO') AS total_agropecuarios,
    (SELECT COUNT(*) FROM public.productores WHERE tipo = 'EMPRENDEDOR') AS total_emprendedores,

    -- Registros del mes actual
    (SELECT COUNT(*) FROM public.productores
     WHERE created_at >= date_trunc('month', NOW())) AS nuevos_este_mes,

    -- Productos destacados
    (SELECT COUNT(*) FROM public.productos WHERE destacado = TRUE) AS productos_destacados;

COMMENT ON VIEW public.vista_productos_completos  IS 'Productos con datos de categoría y productor. Usada por la app móvil.';
COMMENT ON VIEW public.vista_productores_stats    IS 'Productores con métricas completas. Usada por el panel admin.';
COMMENT ON VIEW public.vista_mapa_puntos_venta    IS 'Puntos de venta con coordenadas lat/lng para el mapa de la app.';
COMMENT ON VIEW public.vista_dashboard_stats      IS 'Estadísticas globales del sistema para el dashboard de la Gobernación.';
