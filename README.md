# Inkwell · web

Frontend del MVP de Inkwell (Next.js, App Router, TypeScript). Lee y escribe a través de la API
(`inkwell-backend`) y usa Supabase Auth para las cuentas (correo y Google).

## Cómo correrlo

```bash
npm install
cp env.example .env.local   # en Windows: copy env.example .env.local
npm run dev                 # http://localhost:3000
npm run build               # compila y prerenderiza; necesita la API encendida
npm run lint
```

Requiere Node 20 o superior y la API corriendo en `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:3001`).

## Variables de entorno

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | La llave publishable (`sb_publishable_...`). Es pública; la secreta nunca va aquí |
| `NEXT_PUBLIC_API_URL` | URL de la API de Inkwell |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID del cliente OAuth de Google, el mismo que usa Supabase. Vacío: Google entra por redirección a través de supabase.co |

## Pantallas

| Ruta | Pantalla |
|---|---|
| `/` | Inicio: tu escritorio, tu repisa y los estantes |
| `/explorar` | Búsqueda con filtros de incluir/excluir, vista de libros o compacta |
| `/historia/[slug]` | Ficha de la historia y rastro de tinta |
| `/leer/[slug]/[cap]` | Lector con ajustes de letra, interlineado y tema |
| `/biblioteca` | Tu librero: repisa de lomos o cuadrícula con progreso |
| `/perfil/[usuario]` | Perfil de autor |
| `/escribir` | Tus historias, estadísticas e importación de .docx |
| `/editor/[slug]` | Editor de capítulo con plantillas y estilos de título |
| `/novedades` | Notificaciones |
| `/escribir/nueva` | Crear una historia, con vista previa de la portada en el libro |
| `/ajustes` | Cuenta, lectura, etiquetas bloqueadas y notificaciones |
| `/entrar` · `/registro` · `/recuperar` | Iniciar sesión, crear cuenta y recuperar contraseña |
| `/bienvenida` | Onboarding: elegir gustos |
| `/privacidad` · `/terminos` | Textos legales (pendientes de redactar) |

En teléfono, la barra lateral pasa a ser la barra de cinco pestañas de la app.

## Dónde está cada cosa

- `src/lib/queries.ts`: lectura pública desde la API (historias, capítulos, perfiles), con caché de minutos. Solo servidor.
- `src/lib/data.ts`: tipos, utilidades y lo que sigue de muestra (novedades y la lista del librero).
- `src/lib/api.ts` y `src/lib/supabase.ts`: cliente de la API y cliente de Supabase (solo para la sesión).
- `src/components/SessionProvider.tsx`: la sesión y el perfil de quien entró. `useLibrary` y `useMyStories` traen su repisa y sus historias.
- `src/components/`: el libro 3D (`Book`), repisas y lomos (`Shelf`), controles (`ui`) y las vistas con estado.
- `src/app/globals.css`: el sistema de diseño completo (colores, tipografía, libro 3D, repisas, fichas).
- `public/`: la mascota. Las tipografías van autoalojadas con Fontsource, sin llamadas a Google.

## Qué está conectado y qué falta

Conectado a la API y a Supabase Auth:

- Crear cuenta, entrar, salir y recuperar contraseña con correo; entrar con Google cuando el proveedor esté activado en Supabase.
- Inicio, explorar, ficha, lector y perfiles con datos reales.
- Repisa: guardar y quitar historias, y el capítulo por el que vas se guarda al abrirlo.
- Votar capítulos, crear historias y publicar capítulos desde el editor (el borrador vive en el navegador hasta publicarlo).

Todavía de muestra o pendiente en la API:

- Novedades, comentarios, seguir autores y la lista del librero.
- Programar capítulos, subir portadas e importar .docx.
- Ajustes de lectura y notificaciones: se guardan en el navegador, no en la cuenta.
- Lectura sin conexión.
