-- ============================================================
-- 07_puntos_venta.sql
-- Puntos de venta físicos de cada productor
-- Un productor puede tener VARIOS puntos de venta (feria, tienda, domicilio)
-- ============================================================

CREATE TABLE public.puntos_venta (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    productor_id    UUID NOT NULL REFERENCES public.productores(id) ON DELETE CASCADE,

    nombre          TEXT NOT NULL,       -- ej: "Feria Campesina", "Tienda Principal"
    direccion       TEXT NOT NULL,
    referencia      TEXT,                -- ej: "a 2 cuadras del mercado Kantuta"

    -- Geolocalización exacta del punto de venta
    ubicacion       GEOGRAPHY(POINT, 4326) NOT NULL,

    -- Horario de atención
    horario_texto   TEXT,                -- ej: "Lun-Vie: 8:00-18:00, Sáb: 8:00-14:00"
    horario_json    JSONB,               -- estructura para la UI de la app
    /*
        Estructura horario_json:
        {
            "lunes":    { "abre": "08:00", "cierra": "18:00", "abierto": true },
            "martes":   { "abre": "08:00", "cierra": "18:00", "abierto": true },
            "miercoles":{ "abre": "08:00", "cierra": "18:00", "abierto": true },
            "jueves":   { "abre": "08:00", "cierra": "18:00", "abierto": true },
            "viernes":  { "abre": "08:00", "cierra": "18:00", "abierto": true },
            "sabado":   { "abre": "08:00", "cierra": "14:00", "abierto": true },
            "domingo":  { "abre": null,    "cierra": null,    "abierto": false }
        }
    */

    telefono        TEXT,
    es_principal    BOOLEAN NOT NULL DEFAULT FALSE, -- El punto de venta principal del productor
    activo          BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_puntos_venta_productor_id ON public.puntos_venta(productor_id);
CREATE INDEX idx_puntos_venta_activo       ON public.puntos_venta(activo);

-- Índice espacial para "encontrar puntos de venta cercanos a mí"
CREATE INDEX idx_puntos_venta_ubicacion    ON public.puntos_venta USING GIST(ubicacion);

-- ============================================================
-- CONSTRAINT: Solo un punto de venta principal por productor
-- ============================================================
CREATE UNIQUE INDEX idx_un_punto_principal_por_productor
    ON public.puntos_venta(productor_id)
    WHERE es_principal = TRUE;

COMMENT ON TABLE  public.puntos_venta             IS 'Puntos de venta físicos donde el productor atiende (ferias, tiendas, domicilios)';
COMMENT ON COLUMN public.puntos_venta.ubicacion   IS 'Coordenada exacta PostGIS para mostrar en el mapa de la app';
COMMENT ON COLUMN public.puntos_venta.horario_json IS 'Horario estructurado por día para la UI de la app móvil';
COMMENT ON COLUMN public.puntos_venta.es_principal IS 'Solo uno puede ser principal. Constraint unique lo garantiza.';
