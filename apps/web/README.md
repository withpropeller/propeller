# web

Propeller dashboard SPA — Vite + React + react-router, served in production by a
small Bun server that also proxies the login route and serves health probes.

## Develop

```bash
bun install
bun run dev          # http://localhost:3000 with HMR
```

Vite proxies `POST /api/auth/login` to `http://localhost:8080`; change the
target in `vite.config.ts` if your local gateway lives elsewhere.

Client-side env vars are read at build time from `import.meta.env` and must be
prefixed `VITE_`. Copy `.env.example` to `.env.local` to set them locally.

## Build & run

```bash
bun run build        # tsc --noEmit + vite build → dist/
bun run start        # bun server.ts — serves dist, /api/auth/login, /health/*
```

## Layout

```
src/
  main.tsx           # entry — mounts AppProviders + RouterProvider
  index.css          # global styles (tailwind, fonts, Pax theme)
  router.tsx         # react-router config
  routes/            # one folder per route, each with index.tsx
  components/        # shared components
  context/           # React contexts (auth, mode, panel, ...)
  hooks/             # custom hooks
  lib/               # framework-agnostic utilities + routing shim
  providers/         # AppProviders composition
server.ts            # Bun production server (SPA + login proxy + health)
vite.config.ts       # Vite config
index.html           # HTML shell
```

Dynamic route segments use `[param]` directory names (e.g. `routes/dashboard/cards/[id]`)
purely as a filesystem convention; the path-to-param mapping lives in
`router.tsx`.

## Codegen

API clients under `src/api/` are generated — do not edit them by hand.

```bash
# 1. Run gateway locally (ENABLE_SWAGGER=true in services/gateway/env/dev.env)
cd services/gateway && bun run start:dev

# 2. Refresh spec + hooks (Node 22+ required for orval)
cd apps/web && make fetch-spec && make generate
```

`make fetch-spec` pulls `http://localhost:4000/openapi.json`. Hook names follow gateway controller method names (e.g. `getOne` → `useEventsControllerGetOne`).
