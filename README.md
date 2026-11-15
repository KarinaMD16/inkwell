# Inkwell · web

Frontend del MVP de Inkwell (Next.js, App Router, TypeScript). Todas las pantallas del lienzo de diseño
están implementadas con **datos de muestra**; todavía no hay backend conectado.

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # compila y prerenderiza
npm run lint
```

Requiere Node 20 o superior.

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

- `src/lib/data.ts`: tipos y datos de muestra. **Es el único punto que hay que cambiar** para conectar la API:
  las funciones `getStories`, `getStory`, `getChapters`, `getChapterBlocks`, `getAuthor`, etc.
- `src/components/`: el libro 3D (`Book`), repisas y lomos (`Shelf`), controles (`ui`) y las vistas con estado
  (`Explorer`, `LibraryView`, `ReaderView`, `EditorView`).
- `src/app/globals.css`: el sistema de diseño completo (colores, tipografía, libro 3D, repisas, fichas).
- `public/`: la mascota. Las tipografías van autoalojadas con Fontsource, sin llamadas a Google.

## Qué funciona de verdad y qué es de muestra

Funciona en el navegador: filtros y búsqueda de Explorar, vistas de la biblioteca, ajustes del lector
(se guardan en el navegador), editor con plantillas y estilos de título (el borrador se guarda en el navegador),
y la animación de "Abrir el libro".

Pendiente de backend (NestJS + Supabase):

- Registro e inicio de sesión (Google y correo).
- Guardar, votar, seguir y comentar de forma persistente.
- Publicar y programar capítulos.
- Importación real de .docx (detección de capítulos con mammoth en la API).
- Subida de portadas: `Book` ya acepta `story.cover` y acomoda la imagen a la tapa.
- Notificaciones, progreso sincronizado y lectura sin conexión.
- Textos de privacidad y términos.

Los capítulos de muestra usan un formato de bloques (`Block` en `data.ts`) pensado para migrar a
TipTap/ProseMirror, como define el documento de contexto del proyecto.
