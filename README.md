# Propeller

China–Africa payment corridor. Naira inbound, USDC outbound. Propeller is Merchant of Record.

## Quick links

- [Design overview](docs/DESIGN.md)
- [Wave docs](docs/README.md)
- Current wave: **Wave 0 — Foundations** ([doc](docs/waves/WAVE_0_FOUNDATIONS.md))

## Layout

```
apps/
  api/          public REST for super-merchants (Nest + Fastify)
  services/     internal REST for dashboard (Nest + Fastify)
  office/       internal REST for admin (Nest + Fastify), behind CF Access + VPN
  dashboard/    end-payer + business UI (Vite + React) → services
  admin/        Propeller ops (Vite + React, behind Cloudflare Access) → office
  docs/         Scalar docs site for apps/api

workers/        background workers (settlement, payout, compliance, ...)

libs/
  contracts/    shared DTOs and flo event types
  core/         auth, mongo, pino, exceptions, helpers
  ledger/       TigerBeetle wrapper
  compliance/   rules, sanctions, name-match, travel-rule
  providers/    paystack, paykka, dojah, globalstack, complyadvantage, ...
  ui/           shared React components

infra/
  runeset/      Rune service specs (templated YAML)
  terraform/    cloud infra (DO primary, EC2-portable)
```

Each `apps/*` and `workers/*` is independent (own `package.json`). No monorepo framework. Coordination via `Zakefile` + `docker-compose.yml`.

## Local dev

```sh
zake dev        # bring up flo + mongo + tigerbeetle + caddy + apps
zake build      # build all images
zake test       # run all tests
zake lint       # biome check
zake format     # biome format --write
zake health     # check local stack health
zake logs       # tail all logs
zake clean      # tear down compose stack including volumes
```

Run `zake` with no arguments for the full target list. Sub-targets are dot-namespaced (`zake dev.flo`, `zake logs.tigerbeetle`).

Per-app `.env.local` files (gitignored) are loaded by each app. Production secrets live in Rune and are never committed.

## Stack

Node 20 LTS · TypeScript 5 (strict) · NestJS 10 · Vite + React · MongoDB Atlas · TigerBeetle · Flo runtime · Caddy · Rune (orchestration). See [DESIGN.md §4](docs/DESIGN.md#4-stack) for the full table.

## Contributing

- Conventional commits.
- biome handles lint + format.
- Vitest for tests.
- Strict TypeScript everywhere.
