# Consume lo Nuestro — Plataforma Georreferenciada de Productores y MYPEs de Oruro 🇧🇴

Sistema integral web y móvil (React Native / Expo Web + Supabase) diseñado para la vinculación directa entre Productores, Agricultores, Ganaderos, Cooperativas y MYPEs de Oruro con compradores mayoristas y consumidores sin intermediarios.

---

## 🚀 Características Principales

1. **📍 Mapa Georreferenciado Interactivo (`Leaflet + PostGIS`)**:
   - Visualización de más de 30 puntos de venta directos y productores georreferenciados por la ciudad de Oruro y sus provincias (Salinas de Garci Mendoza, Challapata, Turco, Caracollo, Eucaliptus, Corque, Huari, Machacamarca, etc.).
   - Filtrado inteligente por rubro y por distancia GPS en tiempo real.
   - Detalle flotante con catálogo directo de productos en venta para entrega inmediata.

2. **📱 Diseño Adaptativo Web y Celular ("Tamaño Celular")**:
   - En navegadores de escritorio (PC), el sistema se auto-acota a un marco elegante de teléfono móvil (`maxWidth: 460px`) con sombreado profesional y fondo oscuro, garantizando la experiencia nativa.
   - En dispositivos móviles nativos (iOS/Android), aprovecha el 100% de la pantalla táctil y hardware GPS.

3. **🛒 Marketplace y Catálogo Oficial**:
   - Búsqueda en vivo por nombre de empresa, municipio, rubro o producto específico (quinua, queso, charque, textiles de alpaca, miel del socavón, etc.).
   - Venta directa por **WhatsApp** y trazabilidad con Sello Oficial *"Consume lo Nuestro"*.

---

## 🌐 Guía de Despliegue Rápido en Vercel (`vercel.com`)

El repositorio ya contiene los archivos `vercel.json` tanto en la raíz como dentro de la carpeta `mobile/` para un despliegue automático en menos de 2 minutos.

### Pasos para Desplegar:
1. Entra a [Vercel](https://vercel.com/new) e inicia sesión con tu cuenta de GitHub (`Rodrick-j`).
2. Importa el repositorio: **`Rodrick-j/APP-DE-VENTA`**.
3. En la configuración del proyecto en Vercel:
   - **Root Directory (Opción recomendada):** Haz clic en *Edit* y selecciona la carpeta **`mobile`** (o déjalo en `./` ya que el `vercel.json` raíz redirigirá automáticamente la compilación).
   - **Build Command:** `npx expo export -p web` (automático por `package.json` o `vercel.json`).
   - **Output Directory:** `dist` (automático).
4. **Variables de Entorno (`Environment Variables`):**
   Añade las siguientes variables con los datos de tu proyecto de Supabase (las encuentras en el archivo `.env`):
   - `EXPO_PUBLIC_SUPABASE_URL`: `https://tu-proyecto.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: `tu-clave-anon-key`
5. Haz clic en **Deploy**. ¡En segundos tendrás tu enlace en vivo (`https://app-de-venta.vercel.app`) listo para compartir!

---

## 💻 Ejecución en Desarrollo Local

```bash
# 1. Entrar al directorio del frontend
cd mobile

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor web de Expo
npm run web
```
Abre tu navegador en `http://localhost:8081` para ver el sistema con recarga en caliente.
