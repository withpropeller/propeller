# infra/runeset/

Rune service specs for Propeller. See the [Rune docs](http://docs.runestack.io/) for the runtime, [the secrets/configmaps guide](http://docs.runestack.io/guides/secrets-configmaps/) for the secrets model, and [the EC2 Terraform guide](http://docs.runestack.io/guides/terraform-ec2/) for hosting.

## Layout

```
runeset.yaml           top-level metadata (name, version, namespace)
casts/
  flo.yaml             Flo runtime
  api.yaml             apps/api — public REST
  services.yaml        apps/services — dashboard backend
  office.yaml          apps/office — admin backend
  caddy.yaml           edge router
values/
  dev.yaml             staging-like values
  prod.yaml            production values (most fields blank — populated per release)
secrets.example.yaml   reference for the secret schema (not actual values)
configs.example.yaml   reference for non-secret configmaps
```

Frontends (`apps/dashboard`, `apps/admin`, `apps/docs`) deploy as static + CDN — not Rune services in v1. Workers land in this runeset starting in Wave 2.

## Apply

```sh
# One-time secret + configmap creation per environment
rune cast infra/runeset/configs.yaml          # your filled-in version of configs.example.yaml
rune cast infra/runeset/secrets.yaml          # NEVER commit this file with real values

# Service rollout
rune cast infra/runeset/ --values=values/dev.yaml          # dev
rune cast infra/runeset/ --values=values/prod.yaml --set app.tag=v0.1.0   # prod
```

## Secrets

Propeller ships **never-committed** secrets. Use:

```sh
rune create secret propeller-core      --from-literal=DATABASE_URL='mongodb+srv://...'
rune create secret propeller-providers --from-literal=PAYSTACK_SECRET_KEY='...' \
                                   --from-literal=PAYKKA_PRIVATE_KEY_PEM="$(cat propeller.private.pem)"
rune create secret propeller-services  --from-literal=SESSION_SECRET="$(openssl rand -base64 32)"
rune create secret propeller-office    --from-literal=CF_ACCESS_AUD='...'
```

Once created, secrets are encrypted at rest in Rune's BadgerDB. There's no read-API — the only path is to mount them into a service via `secretRef:` (which our casts do).

Updating a secret requires a service restart to pick up new values:

```sh
rune create secret propeller-providers --from-literal=PAYSTACK_SECRET_KEY='...' --replace
rune restart api
```

## What's NOT here yet

- Production values (most fields blank) — filled in during Wave 5.
- Worker casts (`workers/settlement`, `workers/payout`, …) — added Wave 2+.
- Static frontend deploy — TBD; likely DO Spaces / S3 + CDN.
- TLS / domain config in caddy — Wave 5.

This skeleton exists so Wave 5 has something to extend, not as a deployable unit on its own.
