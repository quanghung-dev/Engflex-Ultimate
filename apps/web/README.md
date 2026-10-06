# EngFlex Web — TanStack Start Frontend

Vite + React 19 + TanStack Start/Router/Query/Store, Clerk auth, shadcn/ui,
Paraglide i18n (`vi` default + `en`). Voice screens talk WebRTC directly to the
voice engine — Go is never in the audio path.

## Layout

```
src/
  routes/                    # Directory convention (_app/route.tsx, _app/<domain>/…); thin shells
  features/<domain>/         # attempts, dashboard, dictation, lessons, onboarding, profiles,
                             # reading, vocabulary, voice, writing
    components/              # Presentational only; copy via m["<domain>.*"](), never hardcoded strings
    fixtures.ts / store.ts   # Mock data + cross-screen @tanstack/store (mock phase)
  components/common|layout|ui# Shared (PageHeader, AudioButton, …) + AppShell/Topbar + shadcn primitives
  app/
    app-route.ts             # APP_ROUTES, nested by resource — the only frontend URLs allowed
    api-routes.ts            # API_ROUTES, nested by resource, (id) => … — backend paths only
    breadcrumbs.ts           # staticData breadcrumb protocol (labels are thunks)
  lib/                       # api.ts (envelope unwrap), auth-guard.ts, paraglide-middleware.ts, utils.ts
  integrations/clerk|tanstack-query/
  paraglide/                 # Generated-only, never hand-edit
messages/{en,vi}/<domain>.json  # inlang sources; one file per domain, keys nest by page/part
scripts/check-conventions.mjs   # Message ids, dynamic keys, hardcoded URLs
```

## Quickstart

```bash
pnpm install          # from repo root (workspace)
pnpm --filter web dev # Vite dev on :3000
```

> Changing `src/start.ts` / `vite.config.ts` needs a dev-server restart (HMR can't apply them).

## Gates

```bash
pnpm check                    # biome
pnpm exec tsc --noEmit
pnpm check:conventions        # orphans, en/vi divergence, hardcoded URLs
pnpm build                    # + HTTP/SSR probes
pnpm compile:messages         # before typecheck when copy changes
```

`pnpm check:conventions` is the only gate that catches an orphaned message id or
a hardcoded URL — run it before every change.

## Conventions (see `AGENTS.md`)

- **i18n:** locales `vi` (base) + `en`; ids nest by page (`lessons.hub.title`);
  `common.*` only for shared chrome; read copy as `m["<static literal>"]()`
  (never interpolated keys); strategy `["cookie", "baseLocale"]` — never `url`.
- **Routes:** `APP_ROUTES`/`API_ROUTES` nest by resource (`LESSONS.{LIST,DETAIL,PART}`);
  zero URL literals elsewhere, including `href`.
- **State:** `@tanstack/store` for cross-screen state, `useState` for ephemeral;
  types from `packages/contracts`, never duplicated.
- **Errors:** one `ErrorPage` in `components/common`; `not-found.tsx`/`error.tsx`
  live at route root (must render signed-out, no AppShell/Clerk).
- **Auth:** Clerk `beforeLoad` + server `auth()` probe + `<Show>` defence-in-depth.
