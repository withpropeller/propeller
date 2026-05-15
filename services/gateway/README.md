# Gateway

NestJS backend for Propeller. Handles auth (signup, signin, MFA, password reset),
onboarding, and business-side APIs. Talks to MongoDB for persistence and to
[Flo](https://docs.floruntime.io) for emitting notification events that the
notifications worker consumes.

Runtime: **bun**.

## Install

```bash
bun install
```

## Run

```bash
# development (watch mode)
bun start:dev

# production
bun start:prod
```

## Build

```bash
bun run build
```

## Test

```bash
bun test          # unit
bun test:e2e      # end-to-end
bun test:cov      # coverage
```

## Deploy

Deployed via Rune. See [infra/runeset/casts/gateway.yaml](../../infra/runeset/casts/gateway.yaml).
Secrets and configmap: [infra/runeset/casts/gateway-secrets.yaml](../../infra/runeset/casts/gateway-secrets.yaml).
