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
