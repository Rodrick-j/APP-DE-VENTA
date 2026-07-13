# 📖 MANUAL GENERAL Y GUÍA TÉCNICA DEL SISTEMA
## 🛒 "Consume lo Nuestro" — Gobernación Autónoma Departamental de Oruro
*Plataforma Oficial de Impulso y Comercialización para MYPEs, PYMEs, Agropecuarios y Emprendedores de Oruro.*

---

## 📋 ÍNDICE DEL MANUAL
1. [Introducción y Objetivos del Sistema](#1-introducción-y-objetivos-del-sistema)
2. [Arquitectura Tecnológica y Estructura del Proyecto](#2-arquitectura-tecnológica-y-estructura-del-proyecto)
3. [Guía de Usuario: Módulo Móvil / Web y Flujo de Autenticación (Google Auth)](#3-guía-de-usuario-módulo-móvil--web-y-flujo-de-autenticación-google-auth)
4. [El Asistente Flotante de Video (Esquina Inferior Derecha)](#4-el-asistente-flotante-de-video-esquina-inferior-derecha)
5. [Guía de Administración: Gestión de Base de Datos en Supabase](#5-guía-de-administración-gestión-de-base-de-datos-en-supabase)
6. [📝 Consultas SQL para Crear y Eliminar Usuarios (Lo que solicitaste)](#6--consultas-sql-para-crear-y-eliminar-usuarios)
7. [Comandos Rápidos de Ejecución Local y Despliegue](#7-comandos-rápidos-de-ejecución-local-y-despliegue)

---

## 1. INTRODUCCIÓN Y OBJETIVOS DEL SISTEMA

**Consume lo Nuestro** es el Marketplace oficial y sistema de geolocalización desarrollado para la **Secretaría de Desarrollo Productivo de la Gobernación de Oruro**.
Su misión fundamental es conectar directamente a los productores locales (queserías de Challapata, productores de quinua de Salinas, artesanos de Curahuara de Carangas, textiles, carnes y deshidratados) con el ciudadano y comprador en general, eliminando intermediarios y digitalizando la economía regional.

### Roles del Sistema:
| Rol | Identificador | Capacidades |
| :--- | :--- | :--- |
| **Comprador** | `comprador` | Explorar productos, filtrar por municipio/categoría, guardar favoritos, contactar productores via WhatsApp/Chat. |
| **Productor / MYPE** | `productor` | Todo lo de comprador + Crear perfil de empresa, publicar catálogo de productos, gestionar puntos de venta GPS. |
| **Moderador** | `moderador` | Validar y verificar empresas o productores inscritos (`verificado_gob = true`). |
| **Administrador** | `admin` | Gobernación: control total de usuarios, reportes estadísticos, categorías y base de datos. |

---

## 2. ARQUITECTURA TECNOLÓGICA Y ESTRUCTURA DEL PROYECTO

El sistema utiliza un stack moderno, reactivo y de alta velocidad apto para Web, Android e iOS simultáneamente:

```
[ Frontend: Expo / React Native Web ]  <-- (OAUTH ID TOKEN / REST / REALTIME) -->  [ Backend: Supabase (PostgreSQL + PostGIS) ]
```

* **Frontend (`/mobile`)**: Construido con **React Native (Expo SDK 57 + Expo Router v3)** y **Vanilla CSS/StyleSheet premium** con paleta oficial de la Gobernación (`#1a7a4a` Verde y Oro).
* **Gestión de Estado y Caché**: **TanStack Query (React Query v5)** para almacenamiento en caché local, paginación infinita y consultas sin retrasos.
* **Backend (`/supabase`)**: **Supabase (PostgreSQL 15)** con soporte **PostGIS** para geolocalización y **Row Level Security (RLS)** estricto.

---

## 3. GUÍA DE USUARIO: MÓDULO MÓVIL / WEB Y FLUJO DE AUTENTICACIÓN (GOOGLE AUTH)

### 3.1 Pantalla de Bienvenida (`/bienvenida`)
Es la puerta de entrada con animaciones suaves de escala y pulso en el logo de la Gobernación de Oruro. Permite tres opciones inmediatas:
1. **Continuar con Google** (Ingreso rápido en 1 clic).
2. **Registrarme con correo electrónico** (Creación manual con contraseña segura).
3. **Ya tengo cuenta** (Ingreso tradicional para usuarios registrados).

### 3.2 El Flujo Verificado de Google Sign-In (`id_token`)
Para garantizar la máxima seguridad sin contraseñas perdidas, el sistema integra **Google OAuth 2.0 con validación JWT (ID Token)**:
* Cuando el usuario hace clic en **"Continuar con Google"**, se abre una ventana segura de Google (`accounts.google.com`).
* Google emite un **`id_token` firmado criptográficamente**.
* El frontend envía este `id_token` directamente al servidor de **Supabase Auth (`signInWithIdToken`)**, el cual valida que pertenezca al Client ID oficial (`148514294195-...apps.googleusercontent.com`), crea automáticamente su registro en la tabla `perfiles` y redirige al usuario al Marketplace.

---

## 4. EL ASISTENTE FLOTANTE DE VIDEO (ESQUINA INFERIOR DERECHA)

Un elemento diferenciador y único de **Consume lo Nuestro** es su asistente audiovisual flotante (`FloatingVideoWidget.tsx`).

* **Ubicación estratégica**: Esquina inferior derecha en todas las pantallas principales.
* **Proporción 1:1 Nativa (`210 x 210 px`) con `ResizeMode.CONTAIN`**: A diferencia de reproductores genéricos que cortan cabezas o estiran videos circulares, el reproductor ha sido calibrado milimétricamente para mostrar la resolución original al **100% sin recortar un solo píxel**.
* **Borde Verde Gobernación (`#1a7a4a`)**: Con sombra difuminada y elegante.
* **Controles Integrados**:
  * Botón de **Audio/Muted** flotante para activar el sonido explicativo con un toque.
  * Botón de **Cerrar (X)** en color rojo para ocultar el asistente si el usuario desea pantalla despejada.

---

## 5. GUÍA DE ADMINISTRACIÓN: GESTIÓN DE BASE DE DATOS EN SUPABASE

La base de datos está compuesta por **14 migraciones secuenciales** en la carpeta `supabase/migrations/`:

### Tablas Principales (`public` schema)
1. **`perfiles`**: Vinculada `1:1` con `auth.users`. Almacena nombre completo, teléfono, municipio, rol (`comprador`, `productor`, `admin`) y avatar.
2. **`productores`**: Almacena los datos de la MYPE o PYME (Nombre de empresa, NIT, descripción, si está verificada por la Gobernación, redes sociales).
3. **`productos`**: Catálogo comercial de Oruro. Incluye precio en Bolivianos (Bs.), categoría, fotos en Storage, stock y motor de búsqueda vectorial `buscar_productos`.
4. **`puntos_venta`**: Ubicaciones geográficas de las tiendas o puestos en ferias con coordenadas GPS (`geometry(Point, 4326)`).

---

## 6. 📝 CONSULTAS SQL PARA CREAR Y ELIMINAR USUARIOS

**(A continuación tienes las instrucciones SQL exactas y profesionales que pediste para gestionar usuarios directamente en Supabase desde el SQL Editor).* *

### 🟢 A) Cómo Crear un Usuario y Asignarle el Rol de Productor por SQL
En Supabase, los usuarios reales de autenticación viven en el esquema protegido `auth.users`. Para crear un usuario administrativamente por SQL (o vía función backend) y que automáticamente se le genere su perfil y su cuenta de empresa en Oruro:

```sql
-- 1. CREAR FUNCIÓN ADMINISTRATIVA PARA REGISTRAR USUARIO + PERFIL + PRODUCTOR EN 1 PASO
CREATE OR REPLACE FUNCTION public.crear_usuario_productor_admin(
    p_email TEXT,
    p_password TEXT,
    p_nombre_completo TEXT,
    p_nombre_empresa TEXT,
    p_municipio TEXT DEFAULT 'Oruro'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    -- Generar ID único para el usuario
    v_user_id := gen_random_uuid();
    -- Encriptar la contraseña usando el hash interno de Supabase/Postgres
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));

    -- A) Insertar directamente en auth.users (Tabla del sistema de autenticación)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        p_email,
        v_encrypted_pw,
        now(), -- Email confirmado automáticamente por el administrador
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        json_build_object('nombre_completo', p_nombre_completo, 'rol', 'productor')::jsonb,
        now(),
        now()
    );

    -- B) Insertar/Actualizar en la tabla perfiles (Si el trigger automático aún no lo llenó)
    INSERT INTO public.perfiles (id, email, nombre_completo, rol, municipio)
    VALUES (v_user_id, p_email, p_nombre_completo, 'productor', p_municipio)
    ON CONFLICT (id) DO UPDATE 
    SET rol = 'productor', nombre_completo = p_nombre_completo, municipio = p_municipio;

    -- C) Crear la ficha oficial del Productor MYPE/PYME
    INSERT INTO public.productores (id, nombre_empresa, descripcion, municipio, verificado_gob, activo)
    VALUES (
        v_user_id,
        p_nombre_empresa,
        'Productor oficial registrado por la Gobernación de Oruro.',
        p_municipio,
        true, -- Verificado por defecto al ser creado por el Admin
        true
    )
    ON CONFLICT (id) DO UPDATE 
    SET nombre_empresa = p_nombre_empresa, verificado_gob = true;

    RETURN v_user_id;
END;
$$;

-- =========================================================================
-- 👉 EJEMPLO DE USO: Ejecuta esto en el SQL Editor para crear a un productor
-- =========================================================================
SELECT public.crear_usuario_productor_admin(
    'quinua.salinas@oruro.gob.bo',
    'BoliviaOruro2026*',
    'Carlos Mamani Choque',
    'Asociación de Quinua Real Salinas APQUISA',
    'Salinas de Garci Mendoza'
);
```

---

### 🔴 B) Cómo Eliminar un Usuario en Cascada por Completo por SQL
Si deseas borrar permanentemente a un usuario (ya sea comprador o productor) y que **se eliminen automáticamente todos sus productos, fotos, puntos de venta, perfil y cuenta de acceso (`auth.users`)**:

```sql
-- 1. CREAR FUNCIÓN DE BORRADO SEGURO EN CASCADA
CREATE OR REPLACE FUNCTION public.eliminar_usuario_total(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Buscar el UUID del usuario por su email en auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN '❌ Error: El usuario con email ' || p_email || ' no existe.';
    END IF;

    -- A) Borrar productos del productor
    DELETE FROM public.productos WHERE productor_id = v_user_id;

    -- B) Borrar puntos de venta
    DELETE FROM public.puntos_venta WHERE productor_id = v_user_id;

    -- C) Borrar ficha de productor
    DELETE FROM public.productores WHERE id = v_user_id;

    -- D) Borrar perfil público
    DELETE FROM public.perfiles WHERE id = v_user_id;

    -- E) Borrar finalmente la identidad en el motor de Supabase Auth
    DELETE FROM auth.users WHERE id = v_user_id;

    RETURN '✅ Usuario ' || p_email || ' (' || v_user_id || ') y todos sus datos han sido eliminados del sistema.';
END;
$$;

-- =========================================================================
-- 👉 EJEMPLO DE USO: Ejecuta esto en el SQL Editor para eliminar a un usuario
-- =========================================================================
SELECT public.eliminar_usuario_total('quinua.salinas@oruro.gob.bo');
```

---

## 7. COMANDOS RÁPIDOS DE EJECUCIÓN LOCAL Y DESPLIEGUE

### Para arrancar el servidor móvil / web en desarrollo:
```bash
cd mobile
npx expo start --clear
```
* Presiona **`w`** para abrir en Web (`http://localhost:8081`).
* Presiona **`a`** para abrir en el emulador de Android.
* Escanea el código QR desde la app **Expo Go** en tu celular para probar en dispositivo real al instante.

### Para construir el archivo APK / Web de Producción:
```bash
# Webbundle optimizado
npx expo export --platform web

# Construir APK de Android para la Gobernación con EAS Build
npx eas build -p android --profile preview
```

---
*Manual redactado y estructurado por Antigravity (IA Oficial de Desarrollo) para la Gobernación Autónoma Departamental de Oruro — Consume lo Nuestro.*
