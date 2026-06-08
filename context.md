# SpotiCover

App Next.js que genera portadas personalizadas estilo Spotify. Canvas nativo, sin dependencias de captura DOM.

## Stack

Next.js 16 (App Router) · TailwindCSS v4 · Shadcn/ui · TypeScript · Supabase (auth + storage) · Prisma · Zustand · Pino · Vitest · pnpm

## Estructura

```
src/
├── app/
│   ├── api/auth/account/route.ts                 # DELETE eliminar cuenta (covers + bucket + usuario Supabase)
│   ├── api/auth/verify-turnstile/route.ts       # POST verificar token Cloudflare Turnstile
│   ├── api/spotify/track/[...slug]/route.ts     # Proxy Spotify (Client Credentials)
│   ├── api/spotify/connection/route.ts            # GET (check) + DELETE (disconnect) Spotify token
│   ├── api/spotify/user-stats/route.ts          # GET top tracks/artists/genres (user token OAuth)
│   ├── api/covers/route.ts                      # GET (listar) + POST (guardar)
│   ├── api/covers/[id]/route.ts                 # DELETE (eliminar cover + bucket file) + test
│   ├── auth/{callback,login}/                   # Auth Supabase (callback con test)
│   ├── auth/spotify/route.ts                    # Inicia OAuth Spotify (PKCE)
│   ├── auth/spotify/callback/route.ts           # Callback OAuth Spotify + test
│   ├── gallery/page.tsx                         # Galería de portadas guardadas
│   ├── stats/page.tsx                           # Estadísticas musicales con receipt canvas
│   ├── settings/page.tsx                        # Configuración (acento, idioma, conexión Spotify)
│   ├── layout.tsx                               # Inter font + ThemeProvider
│   └── page.tsx                                 # Home con banner de stats
├── proxy.ts                                     # Auth guard (Next.js 16 middleware)
├── components/
│   ├── auth/login-form.tsx                      # Login/signup con Turnstile
│   ├── auth/turnstile-widget.tsx                # Widget Cloudflare Turnstile
│   ├── layout/header.tsx                        # ThemeToggle + settings + user email + logout + stats link
│   ├── theme/{accent-provider,theme-toggle,lang-toggle}
│   ├── ui/button.tsx
│   ├── cover/
│   │   ├── cover-canvas.tsx                     # Canvas nativo 1200x1200 (sin transparencia)
│   │   ├── cover-preview.tsx                    # Preview + download/share + toggle código
│   │   ├── bg-color-picker.tsx                  # 7 colores de fondo
│   │   ├── color-picker-popover.tsx             # Color picker custom (HexColorPicker + HEX/RGB input + debounce)
│   │   └── track-input.tsx
│   ├── gallery/
│   │   ├── cover-grid.tsx                       # Grid de portadas guardadas
│   │   └── cover-card.tsx                       # Tarjeta individual (thumbnail + acciones)
│   └── stats/
│       ├── connect-spotify.tsx                  # Botón "Conectar Spotify" cuando no hay token
│       ├── time-range-selector.tsx              # Tabs: 4 semanas | 6 meses | Todo
│       ├── mode-selector.tsx                    # Tabs: Todo | Canciones | Artistas | Géneros
│       ├── stats-receipt-canvas.tsx             # Canvas receipt compacto (4 modos: all/tracks/artists/genres)
│       └── spotify-banner.tsx                   # Banner en home: conectar o preview top track/artist
├── lib/
│   ├── utils.ts · spotify.ts · prisma.ts · logger.ts · rate-limit.ts
│   ├── i18n/{dict.ts,use-t.ts}
│   └── supabase/{client,server,middleware}.ts
├── stores/
│   ├── cover-store.ts                           # Estado del cover (bgColor, customBgColor, showSpotifyCode, etc.)
│   └── theme-store.ts                           # Acento + idioma (persistido)
└── types/spotify.ts                             # SpotifyTrack, CoverData, TopTrack, TopArtist, StatsData, TimeRange
```

## Flujo

1. Auth (email/password) → proxy protege rutas + Turnstile anti-bot
2. Home: banner de Spotify (conectar o preview de top track/artist)
3. Pegar URL/ID de Spotify → API route proxy → metadatos
4. Canvas nativo: fondo gradiente + carátula + textos + logo Spotify + código scannable (opcional)
5. Color picker custom con react-colorful (HEX + RGB inputs, debounce 200ms si el código está activo)
6. Descarga: `canvas.toBlob()` → PNG 1200x1200 (opaco, sin transparencia)
7. Compartir: upload a Supabase bucket `user_covers` → URL pública + guardar metadata en BD (`POST /api/covers`)
8. Galería: `GET /api/covers` → grid de portadas guardadas con thumbnails → abrir (recarga con trackId) / eliminar (`DELETE /api/covers/[id]` + borra de bucket)
9. Stats: OAuth Spotify (PKCE) → token en BD → `GET /api/spotify/user-stats` → receipt canvas compacto con selector de modo (all/tracks/artists/genres) y selector de rango temporal

## Variables de Entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Admin key para eliminar usuarios — server-side only
NEXT_PUBLIC_SUPABASE_BUCKET_URL=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
DATABASE_URL=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=
LOG_LEVEL=                          # debug | info | warn | error (default: info en prod, debug en dev)
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev` | Dev server (carga `.env.local`) |
| `pnpm run build` | TypeScript + compilación |
| `pnpm run commit` | Conventional Commit (interactive) |
| `pnpm run commit:msg "type(scope): msg"` | Commit non-interactive (para agentes) |
| `pnpm run test` | Run tests (vitest) |
| `pnpm run test:watch` | Run tests in watch mode |
| `pnpm run supabase:start/stop/status` | Supabase local |
| `pnpm run check:dev/prod` | Health check conexiones |
| `pnpm run db:push` | Prisma push a BD local |

## Pendiente

- CSP headers con allowlist (Turnstile, Supabase, Spotify)
- Validación de input con tipos y límites de longitud
- Logs estructurados con Pino (JSON en prod, pretty en dev)
- RLS policies para storage bucket `user_covers`
- Canvas crossOrigin fallback para imágenes sin CORS
- Tests: covers POST, spotify user-stats, spotify connection, rate-limit, spotify.ts functions

## Historial de cambios recientes

- `fix(security): remove .env.production with plaintext secrets, fix proxy.ts function name for Next.js 16`
- `fix(csp): add 'unsafe-inline' and challenges.cloudflare.com to CSP for Turnstile in production`
- `chore(deploy): configure Vercel build command to run prisma generate before next build`
- `fix(cover): remove alpha channel from canvas export for consistent rendering across viewers`
- `fix(auth): add Turnstile error handling with retry button and test keys for local dev`
- `feat(stats): add music stats with receipt-style image generator (PKCE OAuth, SpotifyToken model, user-stats API, receipt canvas, mode selector, time range selector, home banner)`
- `fix(auth): use explicit origin for Spotify OAuth redirects to fix HMR chunk loading errors`
- `chore(dev): use mock stats data in development (removed, now always uses real OAuth)`
- `refactor(stats): compact receipt canvases with separate modes (all/tracks/artists/genres)`
- `fix(api): protect against undefined genres in Spotify API responses`
- `feat(settings): add Spotify connection section with link/disconnect in settings page`
- `fix(spotify): add error details logging in OAuth callback for debugging`
- `test(auth): add critical tests for covers DELETE, auth callback, and Spotify OAuth callback`