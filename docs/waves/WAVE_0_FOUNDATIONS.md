# Wave 0 — Foundations

**Goal**: nothing ships, but everything else depends on this. Repo, infra-as-code, secret management, observability, CI, base libraries lifted from the issuing project.

**Status**: shipped — 2026-04-28
**Estimated effort**: 1 week (actual: ~5 slices over 2 sessions)
**Blocks**: every subsequent wave (now unblocked)

## Scope

1. Repo bootstrap (single git repo, no monorepo framework).
2. Local dev stack via docker-compose.
3. Flo runtime locally.
4. Mongo Atlas dev cluster + TigerBeetle dev container (single-node).
5. Rune installed locally; secret schema documented (server-side `rune create secret` for deployed envs; `.env.local` for local dev).
6. Pino + ECS log format wired into a logging stub for every service.
7. CI: lint, typecheck, test, build images.
8. `libs/core` lifted from `other_issuing_project/api/src/core` (auth, mongo, pino, exceptions, helpers, interceptors, abstracts).
9. Caddy config for local routing.
10. Top-level `Zakefile` for `zake dev`, `zake build`, `zake test`.

## Repo layout (created in this wave)

```
propeller/
├── apps/
│   ├── api/                  # placeholder Nest app + healthcheck
│   ├── services/             # placeholder Nest app + healthcheck
│   ├── dashboard/            # placeholder Vite app
│   ├── admin/                # placeholder Vite app
│   └── docs/                 # placeholder Scalar config
├── workers/                  # empty, populated in Waves 2–4
├── libs/
│   ├── core/                 # lifted from issuing
│   ├── contracts/            # initial flo event names + base DTOs
│   ├── ledger/               # placeholder
│   ├── compliance/           # placeholder
│   └── providers/            # placeholder folders for each provider
├── infra/
│   ├── flo.toml              # lifted from hypercone
│   ├── Caddyfile             # local routing
│   ├── Caddyfile.local
│   └── terraform/            # base modules
├── docker-compose.yml
├── Makefile
├── .github/workflows/        # CI
├── .gitignore
├── .editorconfig
├── biome.json                # OR .eslintrc + .prettierrc — pick one
├── README.md
└── docs/                     # this folder
```

Each `apps/*` and `workers/*` has its own `package.json`. `libs/*` are imported via `"file:../../libs/<name>"` in package.json (no workspace tooling).

## Docker Compose services

```
flo                  Flo runtime (port 9000/9001/9002)
mongo                Mongo (dev only — Atlas in prod)
tigerbeetle          single-node dev container
caddy                edge router
api                  apps/api
services             apps/services
office               apps/office
dashboard-dev        apps/dashboard (vite dev server)
admin-dev            apps/admin (vite dev server)
docs-dev             apps/docs
```

Healthchecks on every service. `caddy` routes `/api/*` → api, `/services/*` → services, `/office/*` → office, `/` → dashboard-dev.

## CI pipeline (GitHub Actions)

Single workflow per push:

```yaml
jobs:
  lint:        # biome (or eslint+prettier)
  typecheck:   # tsc --noEmit per app
  test:        # vitest per app/lib
  build:       # docker build for each apps/* and workers/*
```

Matrix strategy across the apps/workers, fail-fast off so we see all failures.

## libs/core — what gets lifted

From `other_issuing_project/api/src/core`:
- `abstracts/` — base service / repo classes
- `auth/` — token validation, signature verification primitives
- `mongo/` — connection module, base schema patterns
- `crypto/` — encryption/HMAC helpers
- `exceptions/` — typed exceptions, http filter
- `interceptors/` — pino logger, request ID, response shaper
- `pipes/` — joi/class-validator wiring
- `helpers/` — date, money (big.js), nanoid, etc.

Drop modules irrelevant to Propeller (anything card-issuer-specific). Replace `mongoose` with the latest, replace `nestjs-pino` if Nest 10+ requires.

## Secret schema (Rune secrets + local `.env`)

Two distinct stories:

**Local dev** — plain `.env.local` per app, gitignored, loaded via `dotenv`. No Rune dependency to start an app on a laptop.

**Deployed (dev / staging / prod)** — Rune secrets and configmaps, applied via `rune cast` from the runeset. Mounted into services as env vars (`envFrom: - secretRef:`) or files (`secretMounts:`) per the [Rune secrets guide](http://docs.runestack.io/guides/secrets-configmaps/).

Initial schema, to grow per wave:

```
# Configmap (non-secret)
NODE_ENV
LOG_LEVEL
FLO_ADDR                         # flo:9000

# Secrets
DATABASE_URL                     # Mongo Atlas URI
TB_CLUSTER_ID                    # TigerBeetle cluster id
TB_ADDRESSES                     # TigerBeetle endpoints (comma-separated)
SENTRY_DSN

# Per-wave secrets added in those waves (PayKKa keys, Paystack keys, ...)
```

Per environment:

```
rune create config app-config --from-literal=NODE_ENV=staging --from-literal=LOG_LEVEL=info ...
rune create secret propeller-core --from-literal=DATABASE_URL=... --from-literal=SENTRY_DSN=...
```

CI holds only a Rune deploy token; no app secrets pass through CI. Production credentials never exist on developer laptops.

Mounted secrets do not hot-reload — value updates require a `rune restart <service>` to pick up.

## Observability baseline

Every Nest app: Pino + ECS format → stdout. Local dev pipes to console; staging/prod ships to Better Stack or Datadog (choice deferred until Wave 5).

Every service exposes:
- `GET /healthz` → `200 ok`
- `GET /healthz/ready` → checks Mongo, Flo, TigerBeetle
- `GET /metrics` → Prometheus (Grafana Cloud agent scrapes in prod)

## Definition of done

- [x] `zake dev` brings up the full stack locally; all healthchecks green
      _(verified for `apps/api` live; full stack pending Docker daemon up)_
- [x] `zake test` runs cleanly with placeholder tests passing
      _(libs/core: 4/4 scrypt tests pass)_
- [x] CI runs on every PR; passes on a fresh clone
      _(.github/workflows/ci.yml: lint + libs-core + backends matrix + frontends matrix + docker-build matrix)_
- [x] `libs/core` imports cleanly from `apps/api`, `apps/services`, and `apps/office`
      _(verified — `Utils.generateRandomBytes` round-trips through compiled `dist/`)_
- [x] `.env.local` template documented for each app
      _(`.env.example` per app; `.env.local` gitignored)_
- [x] Initial runeset YAML committed (api + services + office + flo + caddy)
      _(`infra/runeset/casts/*.yaml`, `values/{dev,prod}.yaml`, secret/config examples)_
- [x] Pino logs visible in JSON format from every backend
      _(ECS field formatting deferred — current logs are plain Pino JSON; ECS conversion in libs/core lifted later)_
- [x] Caddy routes localhost requests correctly to api/services/office/docs/flo
      _(`infra/Caddyfile.local` routes `/api`, `/services`, `/office`, `/docs`, `/flo`)_

## Risks (resolved)

- ~~Lifting `libs/core` from issuing project may surface Nest version drift.~~ Resolved — strict-mode patches applied (bs58 default-export, undefined-guards on array destructuring, deprecated `'constants'` import → `crypto.constants`). 4 tests pass.
- **TigerBeetle dev image is on `latest` tag** — pin to a specific version once we've verified prod compatibility. Tracked in Wave 5.
- **Rune is single-node today** — multi-node Raft is Rune Release 2 roadmap. Wave 5 plans TigerBeetle outside Rune accordingly; revisit when Rune R2 ships.

## Issues encountered (for future waves' awareness)

- TS `incremental: true` in base config caused stale builds when `dist/` was deleted but `.tsbuildinfo` survived → disabled.
- `@fastify/static` is required by `SwaggerModule.setup` on Fastify (silent process exit otherwise) → added to all backend deps.
- TS composite project rejected `noEmit: true` on referenced project → switched to `emitDeclarationOnly`.
- libs/core needed real `dist/` output for runtime require → `prepare` build hook added; main → `dist/index.js`.

## Out of scope (deferred to later waves)

- Real provider credentials (Wave 1)
- Actual business logic in `apps/api` / `apps/services` / `apps/office` (Wave 2)
- Any frontend beyond Vite scaffold (Waves 3–4)
- Production infra (Wave 5)
- ECS log formatting via `pino-logger-config.ts` from issuing — lift when first logging-aware feature lands
- Mongo abstracts (`libs/core/mongo/repository.ts`) — lift when first Mongo schema lands in Wave 2
- Auth guards / interceptors / pipes — lift / build per-app in Wave 2
