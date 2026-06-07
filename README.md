# SpotiCover 🎵

Generador de portadas personalizadas estilo Spotify. Pega el enlace de cualquier canción y genera una imagen PNG 1200×1200 lista para descargar o compartir.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript (estricto) |
| Estilos | TailwindCSS v4 + Shadcn/ui |
| Animaciones | Framer Motion |
| Estado | Zustand (con persistencia) |
| Base de datos | PostgreSQL + Prisma |
| Autenticación | Supabase Auth (email/password) |
| Almacenamiento | Supabase Storage |
| Paquetería | pnpm |

## Funcionalidades

- **Búsqueda por URL/ID de Spotify** — Ingresá el enlace de una canción y la app obtiene sus metadatos (nombre, artista, carátula) mediante un proxy que usa Client Credentials de Spotify.
- **Canvas nativo** — La portada se genera con un canvas HTML5 de 1200×1200px. Sin dependencias de captura DOM ni librerías externas de imagen.
- **Fondo de color sólido** — 7 colores de fondo para personalizar la portada.
- **Descarga directa** — Exporta a PNG con `canvas.toBlob()`.
- **Compartir** — Sube la portada a Supabase Storage y obtiene una URL pública.
- **Modo oscuro/claro** — Alternancia con `next-themes`.
- **Colores de acento** — 5 colores primarios (verde, azul, púrpura, naranja, rosa) que se aplican a botones, enlaces y elementos interactivos.
- **Configuración** — Página de ajustes para personalizar el color de acento y el idioma de la interfaz (español/inglés).
- **Autenticación** — Login con email y contraseña mediante Supabase Auth. Ruta protegida con middleware.

## Estructura del proyecto

```
src/
├── app/
│   ├── api/spotify/track/[...slug]/route.ts   # Proxy Spotify
│   ├── auth/{callback,login}/                  # Auth Supabase
│   ├── settings/page.tsx                       # Configuración
│   ├── layout.tsx                              # Layout raíz
│   └── page.tsx                                # Home
├── components/
│   ├── auth/login-form.tsx
│   ├── layout/header.tsx
│   ├── theme/{accent-provider,theme-toggle}
│   ├── ui/button.tsx
│   └── cover/{cover-canvas,cover-preview,bg-color-picker,track-input}
├── lib/
│   ├── utils.ts
│   ├── spotify.ts
│   └── supabase/{client,server,middleware}.ts
├── stores/{cover-store,theme-store}.ts
└── types/spotify.ts
```

## Cómo empezar

```bash
pnpm install
pnpm run dev
```

Variables de entorno necesarias (ver `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_BUCKET_URL=
DATABASE_URL=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run build` | TypeScript + compilación |
| `pnpm run commit` | Commit con Conventional Commits |
| `pnpm run supabase:start/stop/status` | Supabase local |
| `pnpm run check:dev/prod` | Health check de conexiones |
| `pnpm run db:push` | Prisma push a BD local |

## Uso de IA

Este proyecto fue desarrollado con asistencia de **opencode** (agente de IA para terminal) como herramienta de productividad. La IA se utilizó para:

- Generar y refactorizar componentes de React siguiendo las convenciones del proyecto.
- Escribir consultas a la API de Spotify y manejo de respuestas.
- Implementar el canvas nativo y la lógica de generación de imágenes.
- Configurar la autenticación con Supabase y el middleware de protección de rutas.
- Sugerir mejoras de arquitectura, tipado y buenas prácticas.
- Asistir en la depuración de errores de TypeScript y compilación.

Todo el código generado fue revisado, adaptado e integrado manualmente. La IA actuó como asistente de codificación, no como reemplazo del criterio de desarrollo.