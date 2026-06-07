# SpotiCover

App Next.js que genera portadas personalizadas estilo Spotify. Canvas nativo, sin dependencias de captura DOM.

## Stack

Next.js 16 (App Router) · TailwindCSS v4 · Shadcn/ui · TypeScript · Supabase (auth + storage) · Prisma · Zustand · pnpm

## Estructura

```
src/
├── app/
│   ├── api/spotify/track/[...slug]/route.ts  # Proxy Spotify (Client Credentials)
│   ├── auth/{callback,login}/                 # Auth Supabase
│   ├── layout.tsx                             # Inter font + ThemeProvider
│   └── page.tsx                               # Home
├── proxy.ts                                   # Auth guard
├── components/
│   ├── auth/login-form.tsx
│   ├── layout/header.tsx
│   ├── theme/{accent-picker,accent-provider,theme-toggle}
│   ├── ui/button.tsx
│   └── cover/
│       ├── cover-canvas.tsx                   # Canvas nativo 1200x1200
│       ├── cover-preview.tsx                  # Preview + download/share
│       ├── bg-color-picker.tsx                # 7 colores de fondo
│       └── track-input.tsx
├── lib/
│   ├── utils.ts · spotify.ts
│   └── supabase/{client,server,middleware}.ts
├── stores/{cover-store,theme-store}.ts
└── types/spotify.ts
```

## Flujo

1. Auth (email/password) → proxy protege rutas
2. Pegar URL/ID de Spotify → API route proxy → metadatos
3. Canvas nativo: fondo color sólido + carátula + textos + atribución
4. Descarga: `canvas.toBlob()` → PNG 1200x1200
5. Compartir: upload a Supabase bucket `user_covers` → URL pública

## Variables de Entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_BUCKET_URL=
DATABASE_URL=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
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
- [ ] `pnpm run supabase:start` + `db:push`
- [ ] Configurar Supabase Cloud (auth, bucket, redirect URL)
