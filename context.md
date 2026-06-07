# SpotiCover

App Next.js que genera portadas personalizadas estilo Spotify. Canvas nativo, sin dependencias de captura DOM.

## Stack

Next.js 16 (App Router) · TailwindCSS v4 · Shadcn/ui · TypeScript · Supabase (auth + storage) · Prisma · Zustand · pnpm

## Estructura

```
src/
├── app/
│   ├── api/spotify/track/[...slug]/route.ts  # Proxy Spotify (Client Credentials)
│   ├── api/spotify/user-stats/route.ts        # GET top tracks/artists (user token)
│   ├── api/covers/route.ts                    # GET (listar) + POST (guardar)
│   ├── api/covers/[id]/route.ts               # DELETE (eliminar cover + bucket file)
│   ├── auth/{callback,login}/                 # Auth Supabase
│   ├── auth/spotify/route.ts                  # Inicia OAuth Spotify (PKCE)
│   ├── auth/spotify/callback/route.ts         # Callback OAuth Spotify
│   ├── gallery/page.tsx                       # Galería de portadas guardadas
│   ├── stats/page.tsx                         # Estadísticas musicales
│   ├── settings/page.tsx                      # Configuración (acento, idioma)
│   ├── layout.tsx                             # Inter font + ThemeProvider
│   └── page.tsx                               # Home
├── proxy.ts                                   # Auth guard
├── components/
│   ├── auth/login-form.tsx
│   ├── layout/header.tsx                      # ThemeToggle + settings + user email + logout
│   ├── theme/{accent-provider,theme-toggle}
│   ├── ui/button.tsx
│   └── cover/
│       ├── cover-canvas.tsx                   # Canvas nativo 1200x1200
│       ├── cover-preview.tsx                  # Preview + download/share + toggle código
│       ├── bg-color-picker.tsx                # 7 colores de fondo
│       ├── color-picker-popover.tsx           # Color picker custom (HexColorPicker + HEX/RGB input + debounce)
│       └── track-input.tsx
│   ├── gallery/
│   │   ├── cover-grid.tsx                     # Grid de portadas guardadas
│   │   └── cover-card.tsx                     # Tarjeta individual (thumbnail + acciones)
│   └── stats/
│       ├── connect-spotify.tsx                 # Botón "Conectar Spotify" cuando no hay token
│       ├── time-range-selector.tsx             # Tabs: 4 semanas | 6 meses | Todo
│       ├── top-tracks.tsx                      # Lista de top tracks
│       └── top-artists.tsx                     # Grid de top artists
├── lib/
│   ├── utils.ts · spotify.ts · prisma.ts
│   └── supabase/{client,server,middleware}.ts
├── stores/
│   ├── cover-store.ts                         # Estado del cover (bgColor, customBgColor, showSpotifyCode, etc.)
│   └── theme-store.ts                         # Acento + idioma (persistido)
└── types/spotify.ts                           # SpotifyTrack, CoverData, TopTrack, TopArtist, TimeRange
```

## Flujo

1. Auth (email/password) → proxy protege rutas
2. Pegar URL/ID de Spotify → API route proxy → metadatos
3. Canvas nativo: fondo gradiente + carátula + textos + logo Spotify + código scannable (opcional)
4. Color picker custom con react-colorful (HEX + RGB inputs, debounce 200ms si el código está activo)
5. Descarga: `canvas.toBlob()` → PNG 1200x1200
6. Compartir: upload a Supabase bucket `user_covers` → URL pública + guardar metadata en BD (`POST /api/covers`)
7. Galería: `GET /api/covers` → grid de portadas guardadas con thumbnails → abrir (recarga con trackId) / eliminar (`DELETE /api/covers/[id]` + borra de bucket)
8. Stats: OAuth Spotify (PKCE) → token en BD → `GET /api/spotify/user-stats` → top tracks / top artists con selector de rango temporal

## Variables de Entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_BUCKET_URL=
DATABASE_URL=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev` | Dev server (carga `.env.local`) |
| `pnpm run build` | TypeScript + compilación |
| `pnpm run commit` | Conventional Commit |
| `pnpm run supabase:start/stop/status` | Supabase local |
| `pnpm run check:dev/prod` | Health check conexiones |
| `pnpm run db:push` | Prisma push a BD local |

## Pendiente

- [x] Variables de entorno
- [x] Schema Prisma
- [x] Gallery: API CRUD covers + UI (cover-grid, cover-card, gallery page)
- [x] Gallery: persistir metadata al compartir (`cover-preview.tsx`)
- [x] Gallery: header con enlace "Gallery" (`header.tsx`)
- [x] Gallery: share-sheet con WhatsApp, Telegram, Instagram, Twitter, Web Share API
- [x] `src/lib/prisma.ts` singleton con `@prisma/adapter-pg`
- [x] `SPOTIFY_REDIRECT_URI` en `.env.local` y `.env.production`
- [ ] `pnpm run supabase:start` + `db:push`
- [ ] Configurar Supabase Cloud (auth, bucket, redirect URL)
- [ ] Stats: modelo `SpotifyToken` en Prisma
- [ ] Stats: Spotify OAuth PKCE (`/auth/spotify`, `/auth/spotify/callback`)
- [ ] Stats: API `/api/spotify/user-stats` con proxy server-side
- [ ] Stats: UI (connect-spotify, time-range-selector, top-tracks, top-artists, stats page)

## Historial de cambios recientes

- `feat(gallery): add saved covers gallery with CRUD API, share-sheet, and gallery UI`