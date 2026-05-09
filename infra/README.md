# infra/

Local-dev infrastructure config. Production infra (Terraform, Rune runesets) lands in Wave 5.

## Files

- `flo.toml` — Flo server config, mounted into the `flo` container
- `Caddyfile.local` — Caddy routes for local dev
- `runeset/` — (Wave 5) Rune service specs for deployed envs
- `terraform/` — (Wave 5) cloud infra modules

## Local stack

`zake dev` brings up:

| Service | URL | Purpose |
|---|---|---|
| Flo client API | `localhost:9000` | binary + WebSocket + HTTP |
| Flo metrics | `localhost:9001/metrics` | Prometheus scrape |
| Flo dashboard | `localhost:9002` | web UI |
| MongoDB | `localhost:27017` | dev datastore |
| TigerBeetle | `localhost:4000` | dev ledger (single-node) |
| Caddy | `localhost:8080` | local edge router |

App ports (added in slice 4): `3000` (dashboard), `3001` (api), `3002` (services), `3003` (admin), `3004` (docs).

## Interacting with each component

**MongoDB shell**

```sh
docker compose exec mongo mongosh propeller
```

**TigerBeetle CLI**

```sh
docker compose exec tigerbeetle /tigerbeetle repl --cluster=0 --addresses=localhost:4000
```

**Flo dashboard**

Open <http://localhost:9002> — shows streams, KV namespaces, queues, metrics.

**Reset state**

```sh
zake clean   # tears down compose + removes all volumes
```

## Production

Propeller deploys to a single DigitalOcean droplet running [Rune](https://docs.runestack.io/) as the service orchestrator. Infrastructure is managed via Terraform.

| Component | Path | Purpose |
|---|---|---|
| Terraform (DO) | `terraform/` | Provision droplet + firewall |
| Rune module | `terraform/modules/rune-droplet/` | Reusable droplet module |
| Runeset | `runeset/` | Service specs deployed via `rune cast` |

See [`terraform/README.md`](terraform/README.md) for provisioning instructions.
