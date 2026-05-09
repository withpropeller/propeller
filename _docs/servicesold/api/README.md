# @propeller/api

Public REST API for super-merchants.

- Nest 10 + Fastify
- Pino + ECS logs
- OpenAPI auto-generated, served at `/openapi.json` and `/docs`
- HMAC auth wires in Wave 2

## Local dev

```sh
yarn install
yarn start:dev
```

By default listens on `:3001`. Healthcheck at `http://localhost:3001/healthz`.

## Test / typecheck

```sh
yarn test
yarn typecheck
```
