# Wave 0 — Foundations

**Goal**: nothing ships, but everything else depends on this. Repo, infra-as-code, secret management, observability, CI, base libraries lifted from the issuing project.

**Status**: not started
**Estimated effort**: 1 week
**Blocks**: every subsequent wave

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
10. Top-level `Zakefile` for `zake dev`, `zake build`, `zake test` (matches hypercone tooling).

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

- [ ] `zake dev` brings up the full stack locally; all healthchecks green
- [ ] `zake test` runs cleanly with placeholder tests passing
- [ ] CI runs on every PR; passes on a fresh clone
- [ ] `libs/core` imports cleanly from `apps/api`, `apps/services`, and `apps/office`
- [ ] `.env.local` template documented for each app; `make dev` reads them
- [ ] Initial runeset YAML committed (apps + workers + flo + caddy) and tested via `rune lint`
- [ ] Pino logs visible in JSON ECS format from every app
- [ ] Caddy routes localhost requests correctly to api/services/dashboard

## Risks

- **Lifting `libs/core` from issuing project may surface Nest version drift.** Plan for half a day of dependency reconciliation.
- **TigerBeetle dev image may need pinning to a specific version.** Test against the version we'll deploy in prod.
- **Rune is single-node today** — multi-node Raft is Rune Release 2 roadmap. Wave 5 plans TigerBeetle outside Rune accordingly; revisit when Rune R2 ships.

## Out of scope (deferred to later waves)

- Real provider credentials (Wave 1)
- Actual business logic in `apps/api` / `apps/services` / `apps/office` (Wave 2)
- Any frontend beyond Vite scaffold (Waves 3–4)
- Production infra (Wave 5)
