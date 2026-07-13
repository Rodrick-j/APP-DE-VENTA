-- ============================================================
-- 09_reportes.sql
-- Tabla de reportes generados por la Gobernación
-- Los PDFs/Excels generados por FastAPI se registran aquí
-- ============================================================

CREATE TABLE public.reportes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

    tipo            tipo_reporte NOT NULL,
    titulo          TEXT NOT NULL,

    -- Parámetros usados para generar el reporte (para regenerarlo si hace falta)
    parametros      JSONB NOT NULL DEFAULT '{}',
    /*
        Ejemplo de parametros:
        {
            "municipio": "Oruro",
            "fecha_inicio": "2025-01-01",
            "fecha_fin": "2025-06-30",
            "tipo_productor": "MYPE"
        }
    */

    -- URL del archivo generado en Supabase Storage
    url_archivo     TEXT,
    nombre_archivo  TEXT,
    tamano_bytes    INTEGER,

    -- Estado de la generación
    estado          TEXT NOT NULL DEFAULT 'pendiente'  -- pendiente | generando | listo | error
        CHECK (estado IN ('pendiente', 'generando', 'listo', 'error')),
    error_mensaje   TEXT,

    -- Métricas
    tiempo_generacion_ms INTEGER,  -- cuánto tardó en generarse

    generated_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reportes_admin_id   ON public.reportes(admin_id);
CREATE INDEX idx_reportes_tipo       ON public.reportes(tipo);
CREATE INDEX idx_reportes_estado     ON public.reportes(estado);
CREATE INDEX idx_reportes_created_at ON public.reportes(created_at DESC);

COMMENT ON TABLE  public.reportes            IS 'Registro de reportes PDF/Excel generados por FastAPI para la Secretaría';
COMMENT ON COLUMN public.reportes.parametros IS 'Parámetros JSON usados para generar el reporte (para auditoría y re-generación)';
COMMENT ON COLUMN public.reportes.url_archivo IS 'URL firmada o pública del archivo en Supabase Storage';
