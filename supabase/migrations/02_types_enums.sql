-- ============================================================
-- 02_types_enums.sql
-- Tipos personalizados y enumeraciones del sistema
-- ============================================================

-- Tipos de productor (según categorías de la Gobernación)
CREATE TYPE tipo_productor AS ENUM (
    'MYPE',
    'PYME',
    'AGROPECUARIO',
    'AGRICULTOR',
    'GANADERO',
    'EMPRENDEDOR',
    'ARTESANO',
    'COOPERATIVA'
);

-- Roles del sistema
CREATE TYPE rol_usuario AS ENUM (
    'comprador',    -- Ciudadano que compra/busca
    'productor',    -- MYPE, PYME, etc.
    'admin',        -- Gobernación / Secretaría
    'moderador'     -- Puede aprobar pero no tiene acceso total
);

-- Estado del productor en el sistema
CREATE TYPE estado_productor AS ENUM (
    'pendiente',    -- Recién registrado, espera aprobación
    'verificado',   -- Aprobado por la Gobernación
    'suspendido',   -- Suspendido por violación
    'rechazado'     -- Rechazado con motivo
);

-- Estado de un contacto/mensaje
CREATE TYPE estado_contacto AS ENUM (
    'nuevo',
    'leido',
    'respondido',
    'archivado'
);

-- Tipo de reporte generado
CREATE TYPE tipo_reporte AS ENUM (
    'productores_municipio',
    'estadisticas_mensuales',
    'catalogo_productos',
    'exportacion_excel'
);

-- Unidades de medida para productos
CREATE TYPE unidad_medida AS ENUM (
    'unidad',
    'kg',
    'gramo',
    'litro',
    'ml',
    'caja',
    'bolsa',
    'metro',
    'docena',
    'arroba'
);
