# @hyphen/node-common

Shared **framework-agnostic** Node/TypeScript utilities, safe to import from any
node service (`services/api`, `services/gateway`, …). The TS counterpart to
`libs/go-common`.

Unlike `libs/core` (which carries NestJS + Mongoose dependencies), this package
has **zero runtime dependencies** — only the Node standard library. Keep it that
way: anything added here must not pull in a framework, so it stays importable by
services regardless of their NestJS/Mongoose versions.

## Contents

- `InfraToken` — compact HMAC-signed token for internal service-to-service auth
  (gateway → api-internal). See `src/infra-token.ts`.

## Usage

Services depend on it via a local `file:` reference and import the barrel:

```ts
import { InfraToken } from '@hyphen/node-common';
```

`Dockerfile.nestjs` builds this package before installing service deps; `bun`
copies the built `file:` dependency into each service's `node_modules`, so it
resolves at runtime with no extra wiring.
