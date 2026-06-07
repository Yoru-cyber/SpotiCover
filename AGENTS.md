# AGENTS.md - Instrucciones para Agentes

## SEGURIDAD - REGLA CRÍTICA

- **PROHIBIDO** enviar información sensible en el contexto (tokens, API keys, secrets, contraseñas).
- Las variables de entorno se leen desde `.env.local` para el desarrollo local, pero NUNCA deben incluirse en prompts, respuestas, logs, commits ni ningún output.
- Si necesitas referenciar una variable de entorno, usa el nombre de la variable (ej. `SPOTIFY_CLIENT_ID`), nunca su valor.
- No hagas `console.log` de secretos ni los expongas en el cliente.

## Flujo de Trabajo

1. Leer `context.md` al inicio de cualquier sesión para entender la arquitectura.
2. Mantener el código tipado (TypeScript estricto).
3. Usar siempre `pnpm` para gestión de paquetes.
4. Seguir la estructura de carpetas definida en `context.md`.
5. Para componentes de UI base, usar `pnpm dlx shadcn@latest add <component>`.

## Antes de Finalizar

- Ejecutar `pnpm run build` y asegurar que compile sin errores.
- Si hay errores de tipo, corregirlos.
- No dejar imports no utilizados ni variables sin usar.
- Si se requiere commit, usar `pnpm run commit` (commitizen) siguiendo Conventional Commits.

## Conventional Commits

- **Formato:** `type(scope): descripción`
- **Tipos:** `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`, `perf`, `ci`
- **Scope:** área afectada (ej. `auth`, `cover`, `theme`, `api`)
- Ejemplo: `feat(cover): add dynamic blur background to cover canvas`
- Siempre escribir en inglés el mensaje de commit.

## Estilo

- Componentes funcionales con TypeScript.
- Preferir composición sobre herencia.
- Usar `@/` alias para imports desde `src/`.
- Nombres de archivo: PascalCase para componentes, kebab-case para utilidades.
- Mantener componentes pequeños y enfocados en una responsabilidad.
- Usar `cn()` de `@/lib/utils` para clases condicionales.

## Nuevas Funcionalidades (Plan de Implementación)

### Saved Covers Gallery

**Objetivo:** Permitir a los usuarios guardar, ver y eliminar sus imágenes generadas.

**Orden de implementación:**
1. Crear `src/lib/prisma.ts` — Cliente Prisma singleton usando `@prisma/adapter-pg` (misma config que `scripts/check-connections.ts`).
2. Crear `src/app/api/covers/route.ts`:
   - `GET`: autenticar usuario vía Supabase server client → `prisma.cover.findMany({ where: { userId } })` → devolver lista ordenada por fecha.
   - `POST`: autenticar → validar body `{ trackName, artistName, albumImageUrl, spotifyUrl, bucketPath }` → `prisma.cover.create({ data })`.
3. Crear `src/app/api/covers/[id]/route.ts`:
   - `DELETE`: autenticar → `prisma.cover.findUnique(id)` → verificar `cover.userId === userId` → eliminar archivo del bucket (`supabase.storage.from("user_covers").remove([cover.bucketPath])`) → `prisma.cover.delete(id)`.
4. Modificar `src/components/cover/cover-preview.tsx`: después de subir a bucket exitosamente, hacer `POST /api/covers` para persistir metadata.
5. Crear `src/components/gallery/cover-grid.tsx`: componente cliente que hace `fetch("/api/covers")` y renderiza grid responsivo (masonry o columns-3).
6. Crear `src/components/gallery/cover-card.tsx`: tarjeta con thumbnail (imagen del bucket), nombre track, artista, botón de eliminar (con confirmación Dialog), botón de abrir (redirige a `/?trackId={spotifyUrl}`).
7. Crear `src/app/gallery/page.tsx`: server component que renderiza `<CoverGrid />`.
8. Modificar `src/components/layout/header.tsx`: agregar enlaces "Gallery" y "Stats" en el dropdown del usuario.
9. Modificar `src/app/page.tsx`: aceptar `searchParams.trackId` (Spotify URL) para precargar una portada guardada al hacer clic en "Abrir".

**Modelo Prisma:** El modelo `Cover` ya existe en `prisma/schema.prisma` y no requiere cambios.

### Music Stats

**Objetivo:** Mostrar estadísticas musicales del usuario: top tracks y top artists del mes.

**Pre-requisito:** Spotify OAuth con scope `user-top-read`. El Client Credentials actual no permite acceso a datos de usuario.

**Orden de implementación:**
1. Agregar modelo `SpotifyToken` a `prisma/schema.prisma`:
   ```prisma
   model SpotifyToken {
     userId       String   @id
     accessToken  String
     refreshToken String
     expiresAt    DateTime
     updatedAt    DateTime @updatedAt
   }
   ```
2. Agregar `SPOTIFY_REDIRECT_URI` a `.env.local` y `.env.production`.
3. Extender `src/lib/spotify.ts` con funciones server-side:
   - `getSpotifyAuthUrl()`: genera URL de autorización con PKCE (genera `code_verifier`, deriva `code_challenge` con SHA256, guarda `code_verifier` en cookie httpOnly).
   - `exchangeCodeForToken(code, codeVerifier)`: intercambia código por access/refresh tokens.
   - `refreshAccessToken(refreshToken)`: refresca token expirado.
4. Crear `src/app/auth/spotify/route.ts`: `GET` → genera URL de OAuth con PKCE, setea cookie `spotify_code_verifier`, redirige a Spotify. **NO usar callback separado** — manejar todo en esta ruta.
5. Crear `src/app/auth/spotify/callback/route.ts`: `GET` → recibe `code` y `state` → lee cookie `spotify_code_verifier` → `exchangeCodeForToken()` → `prisma.spotifyToken.upsert(userId, { accessToken, refreshToken, expiresAt })` → limpia cookie → redirige a `/stats`.
6. Crear `src/app/api/spotify/user-stats/route.ts`:
   - `GET`: autenticar usuario → buscar `SpotifyToken` en BD → si expirado, llamar `refreshAccessToken()` y actualizar BD → llamar a `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=20` y `me/top/artists?time_range=short_term&limit=10` con el access token → devolver `{ tracks, artists }`.
   - Acepta query param `time_range`: `short_term` (~4 semanas, default), `medium_term` (~6 meses), `long_term` (varios años).
7. Crear `src/components/stats/connect-spotify.tsx`: componente cliente con botón "Conectar Spotify" que redirige a `/auth/spotify`.
8. Crear `src/components/stats/time-range-selector.tsx`: tres botones/tabs (4 semanas | 6 meses | Todo) que cambian el query param y re-fetchean.
9. Crear `src/components/stats/top-tracks.tsx`: lista de top tracks con album art (64px), track name, artist name(s), enlace a Spotify.
10. Crear `src/components/stats/top-artists.tsx`: grid de top artists con foto circular, nombre, géneros.
11. Crear `src/app/stats/page.tsx`: server component. Si el usuario tiene `SpotifyToken` → renderiza `<TimeRangeSelector>` + `<TopTracks>` + `<TopArtists>`. Si no → renderiza `<ConnectSpotify />`.
12. Agregar tipos en `src/types/spotify.ts`: `TopTrack`, `TopArtist`, `TimeRange`.

**Flujo de OAuth (PKCE):**
1. Usuario hace clic en "Conectar Spotify" en `/stats` → `GET /auth/spotify`.
2. Servidor genera `code_verifier` (random 128 bytes, base64url), deriva `code_challenge = base64url(sha256(code_verifier))`, setea cookie httpOnly `spotify_code_verifier`, redirige a Spotify authorize URL.
3. Spotify redirige a `/auth/spotify/callback?code=xxx&state=yyy`.
4. Servidor valida `state`, lee cookie, intercambia `code` + `code_verifier` por tokens, guarda en BD (upsert por `userId`), limpia cookie, redirige a `/stats`.

**Nota de seguridad:** Los tokens de Spotify (`accessToken`, `refreshToken`) se almacenan en BD y NUNCA se exponen al cliente. El proxy `/api/spotify/user-stats` los usa server-side.

### Commits recomendados

- `feat(gallery): add saved covers gallery with CRUD API`
- `feat(gallery): persist cover metadata on share`
- `feat(auth): add Spotify OAuth PKCE flow`
- `feat(stats): add music stats page with top tracks and artists`
- `chore(db): add SpotifyToken model to Prisma schema`
- `chore(config): add SPOTIFY_REDIRECT_URI env var`
