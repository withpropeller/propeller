# @propeller/services

Internal REST API powering the dashboard (`apps/dashboard`). Used by businesses and end-payers.

- Nest 10 + Fastify
- Cookie session auth wires in Wave 2
- Private network only — never reachable from the public internet

## Local dev

```sh
yarn install
yarn start:dev
```

Listens on `:3002`. Healthcheck at `http://localhost:3002/healthz`.
