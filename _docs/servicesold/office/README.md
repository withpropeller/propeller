# @propeller/office

Internal REST API for admin (`apps/admin`). Used by Propeller ops only.

- Nest 10 + Fastify
- Cloudflare Access identity header verification wires in Wave 2
- Private network + CF Access + VPN; never directly reachable

## Local dev

```sh
yarn install
yarn start:dev
```

Listens on `:3003`. Healthcheck at `http://localhost:3003/healthz`.

## Why a separate app from `apps/services`

Blast radius. Admin endpoints can move money, override sanctions decisions, suspend businesses, adjust the ledger. Isolated process + isolated network surface + different auth = defense-in-depth that role-gating alone doesn't give.

See [DESIGN.md §3](../../docs/DESIGN.md#3-apps-and-services) for the full architecture rationale.
