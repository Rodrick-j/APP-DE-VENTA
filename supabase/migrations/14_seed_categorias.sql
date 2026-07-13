-- ============================================================
-- 14_seed_categorias.sql
-- Datos iniciales: Categorías del marketplace
-- Correr DESPUÉS de todas las migraciones
-- ============================================================

INSERT INTO public.categorias (nombre, descripcion, icono, color, slug, orden)
VALUES
    -- Agropecuarios
    ('Lácteos',         'Quesos, yogurt, mantequilla, leche',        'cheese',           '#f5a623', 'lacteos',          1),
    ('Carnes',          'Carne de res, cordero, llama, cerdo',        'food-steak',       '#c0392b', 'carnes',           2),
    ('Frutas y Verduras','Productos agrícolas frescos locales',       'food-apple',       '#27ae60', 'frutas-verduras',  3),
    ('Granos y Cereales','Quinua, cañahua, maíz, trigo, cebada',     'grain',            '#f39c12', 'granos-cereales',  4),
    ('Artesanías',      'Tejidos, cerámicas, madera, cuero',         'palette',          '#9b59b6', 'artesanias',       5),
    ('Alimentos Procesados','Mermeladas, conservas, snacks, harinas', 'food-variant',     '#e67e22', 'alimentos-procesados', 6),
    ('Bebidas',         'Jugos naturales, api, refrescos artesanales','cup',             '#3498db', 'bebidas',          7),
    ('Plantas Medicinales','Hierbas, tés, remedios naturales',       'leaf',             '#1abc9c', 'plantas-medicinales', 8),
    ('Textiles',        'Ropa, mantas, aguayos, prendas de lana',    'tshirt-crew',      '#e74c3c', 'textiles',         9),
    ('Cuero y Calzado', 'Zapatos, bolsos, cinturones artesanales',   'shoe-heel',        '#795548', 'cuero-calzado',    10),
    ('Flores y Plantas','Flores frescas, plantas ornamentales',      'flower',           '#ff69b4', 'flores-plantas',   11),
    ('Productos de Madera','Muebles, utensilios y artículos de madera','tree',           '#6d4c41', 'madera',           12),
    ('Otros',           'Productos que no encajan en otra categoría','dots-horizontal',  '#95a5a6', 'otros',            99);

-- ============================================================
-- DATOS DE PRUEBA: Un productor de ejemplo para desarrollo
-- (Solo para el entorno de desarrollo — NO correr en producción)
-- ============================================================

-- Nota: Para crear un productor de prueba, primero debes crear
-- un usuario en Supabase Auth. Aquí solo dejamos las categorías
-- como seed de producción.

-- Para desarrollo, usar este script en el SQL Editor de Supabase:
/*
-- 1. Crear usuario admin de prueba
SELECT supabase_admin.create_user(
    '{"email": "admin@gobernacion-oruro.bo", "password": "Admin2025!", "role": "authenticated"}'
);

-- 2. Actualizar su rol a admin
UPDATE public.perfiles
SET rol = 'admin'
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'admin@gobernacion-oruro.bo'
);
*/
