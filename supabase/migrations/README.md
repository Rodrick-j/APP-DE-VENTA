# Consume lo Nuestro — Schema SQL

Este directorio contiene todas las migraciones SQL para el sistema "Consume lo Nuestro" de la Gobernación Autónoma Departamental de Oruro.

## Orden de ejecución

Las migraciones deben correrse **en orden numérico** en el SQL Editor de Supabase:

| Archivo | Descripción |
|---------|-------------|
| `01_extensions.sql` | Extensiones PostgreSQL (PostGIS, uuid-ossp, pg_trgm) |
| `02_types_enums.sql` | Tipos personalizados y enumeraciones |
| `03_perfiles.sql` | Tabla de perfiles + trigger auto-creación |
| `04_categorias.sql` | Categorías del marketplace |
| `05_productores.sql` | Tabla principal de productores |
| `06_productos.sql` | Productos con full-text search |
| `07_puntos_venta.sql` | Puntos de venta con geolocalización |
| `08_favoritos_contactos.sql` | Favoritos y mensajes entre usuarios |
| `09_reportes.sql` | Registro de reportes PDF/Excel |
| `10_rls_policies.sql` | Row Level Security (seguridad) |
| `11_views_utiles.sql` | Vistas optimizadas para la app |
| `12_funciones_busqueda.sql` | Funciones de búsqueda y geolocalización |
| `13_storage_buckets.sql` | Configuración de Storage (fotos, documentos) |
| `14_seed_categorias.sql` | Datos iniciales: categorías |

## Cómo ejecutar

### Opción A: Supabase Dashboard (recomendado para inicio)
1. Ir a [supabase.com](https://supabase.com) → Tu proyecto
2. Ir a **SQL Editor**
3. Copiar y pegar cada archivo en orden
4. Ejecutar uno por uno

### Opción B: Supabase CLI (para CI/CD)
```bash
# Instalar CLI
npm install -g supabase

# Conectar al proyecto
supabase login
supabase link --project-ref TU_PROJECT_REF

# Aplicar todas las migraciones
supabase db push
```

## Roles del sistema

| Rol | Descripción |
|-----|-------------|
| `comprador` | Ciudadano que busca y compra |
| `productor` | MYPE, PYME, agropecuario, emprendedor |
| `moderador` | Puede aprobar productores pero acceso limitado |
| `admin` | Gobernación, acceso total |

## Relaciones clave

```
auth.users (Supabase)
    └── perfiles (1:1) — info adicional del usuario
    └── productores (1:1) — si el usuario es productor
            └── productos (1:N) — productos publicados
            └── puntos_venta (1:N) — dónde vende
            └── contactos (1:N) — mensajes recibidos

productos
    └── categorias (N:1)
    └── favoritos (1:N)
    └── contactos (1:N)
```

## Variables de entorno necesarias

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Solo para el backend FastAPI
```
