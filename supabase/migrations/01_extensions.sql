-- ============================================================
-- 01_extensions.sql
-- Extensiones PostgreSQL necesarias para el sistema
-- "Consume lo Nuestro" — Gobernación de Oruro
-- ============================================================

-- UUID únicos seguros
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Geolocalización (puntos de venta en el mapa)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Búsqueda full-text en español (productos y productores)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Encriptación adicional
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Jobs programados (reportes automáticos)
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Fuzzy search (buscar aunque escriban mal)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
