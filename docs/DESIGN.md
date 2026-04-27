# Reef — System Design

**Status:** Draft v1
**Owners:** Oreofe + team
**Scope:** China–Africa payment corridor. Naira inbound, USDC outbound. Reef is Merchant of Record (MOR).

---

## 1. What Reef is

Reef is a regulated payment-corridor platform. End-payers (mostly Nigerian businesses and individuals) settle invoices in NGN via NIP bank transfer. Merchants (mostly Chinese exporters) receive USDC at a destination of their choosing. Reef sits in the middle as the legal counterparty: collects NGN, runs compliance, executes FX, ships USDC.

Because Reef is MOR, regulatory obligations live with us: CBN/EFCC/NDPC on the Nigeria side, FATF/OFAC globally, with PayKKa and Globalstack carrying their own China-side obligations as our partners.

## 2. Actors

| Actor | Role |
|---|---|
| **Super-merchant** | A platform/aggregator that onboards businesses underneath it. Has API access. Top-level account in the ledger. |
| **Merchant** | A business that collects payments. Can be standalone (top-level) or nested under a super-merchant. |
| **End-payer** | The human who authenticates and submits the NIP transfer. KYC'd via Dojah. |
| **Billed party** | The business named on the invoice (often the end-payer's employer). Metadata + sanctions-screened by name; not KYC'd. |
| **Reef ops** | Internal users of the admin app. Handle reviews, approvals, exceptions. |

There is one entity in the data model — `business` — with a `tier` field (`merchant` | `super_merchant`) and capabilities. Tier upgrade is the only human-in-the-loop event in the onboarding rail.

## 3. Apps and services

```
apps/
  api/          NestJS + Fastify    public REST for super-merchants, OpenAPI/Scalar, HMAC auth
  services/    NestJS + Fastify    internal REST for dashboard (businesses + end-payers), cookie sessions
  office/      NestJS + Fastify    internal REST for admin (Reef ops), CF Access identity header
  dashboard/   Vite + React        end-payer payment URL + business dashboard
  admin/       Vite + React        Reef ops, behind Cloudflare Access + Google SSO + VPN
  docs/        Scalar              static docs site rendering apps/api OpenAPI

workers/
  ledger-projector/   flo events → Mongo balance views
  settlement/         Paystack credits → compliance check → TigerBeetle
  payout/             NGN debit → Globalstack → USDC settlement
  compliance/         KYB/KYC orchestration, sanctions, screening
  webhook-dispatcher/ outbound webhooks to super-merchants, signed + retried
  reconciliation/     daily Paystack settlement vs TB suspense

libs/
  contracts/      shared DTOs, flo event types, OpenAPI schemas (apps/api + apps/services + apps/office)
  core/           auth, mongo, pino, exceptions, helpers (lifted from issuing project)
  ledger/         TigerBeetle client wrapper + deterministic transfer IDs
  compliance/     rules engine, sanctions, name-match, travel-rule
  providers/
    paystack/         VirtualAccountProvider (PWT)
    paykka/           MerchantKybProvider
    dojah/            CustomerKycProvider
    globalstack/      OffRampProvider
    complyadvantage/  ScreeningProvider
    passthrough_address/ AddressScreeningProvider
  ui/             shared React components (dashboard + admin)

infra/
  flo.toml
  Caddyfile
  terraform/
  docker-compose.yml
```

Three backends are deployed independently:
- `apps/api` (public, internet-facing) — super-merchant REST surface
- `apps/services` (private network) — dashboard backend
- `apps/office` (private + CF Access + VPN) — admin backend, isolated for blast-radius reasons (privileged ops: ledger adjustments, payout approvals, business suspension, sanctions overrides, reconciliation)

All three are REST + Nest + Fastify so patterns match. Different blast radius, different scaling, different auth surface, different deploy cadence.

## 4. Stack

| Layer | Choice |
|---|---|
| Public API | Nest + Fastify + OpenAPI |
| Dashboard API (`apps/services`) | Nest + Fastify (REST) |
| Admin API (`apps/office`) | Nest + Fastify (REST), behind CF Access + VPN |
| Dashboards | Vite + React + TanStack Query + React Router |
| Docs | Scalar |
| Ledger | TigerBeetle (single-node v1, 3-node prod) |
| Operational store | MongoDB Atlas |
| Cache / KV / idempotency | Flo KV |
| Event bus / streams | Flo Streams |
| Worker dispatch | Flo Actions + Queues |
| Virtual accounts | Paystack PWT |
| KYC/liveness | Dojah |
| KYB | PayKKa |
| FX off-ramp | Globalstack |
| Sanctions/PEP | ComplyAdvantage |
| Address screening | Interface only (passthrough v1) |
| Edge / routing | Caddy |
| Admin gating | Cloudflare Access + Google SSO |
| Hosting | DO droplets (EC2-portable) |
| Local dev | docker-compose |
| Repo | Single git repo, no monorepo framework |
| Secrets | Rune secrets (server-side, encrypted at rest); `.env` files for local dev |
| Logs | Pino + ECS → Better Stack or Datadog |
| Metrics | Prometheus → Grafana Cloud |
| Errors | Sentry |
| Email | Postmark |
| Object storage | DO Spaces or S3 with versioning + object-lock |

## 5. Provider abstractions

Six interfaces. Workers and apps depend on the interfaces; `libs/providers/<name>` contains the implementations.

```ts
interface VirtualAccountProvider {
  createForPaymentRequest(req): { account_number, bank_name, account_name, expires_at, provider_ref }
  verifyWebhook(payload, sig): boolean
  parseCredit(payload): { reference, amount, provider_id, sender, raw }
}

interface CustomerKycProvider {
  createSession(req): { session_id, widget_token, public_key, expires_at }
  verifyWebhook(headers, body): boolean
  parseResult(payload): { session_id, status, identity, liveness_score, raw }
}

interface MerchantKybProvider {
  uploadDocument(req): { provider_file_id }
  applyOnboarding(req): { provider_merchant_id, identity_verification_url }
  verifyWebhook(headers, body): boolean
  parseNotification(payload): { provider_merchant_id, biz_type, status, reasons, raw }
}

interface OffRampProvider {
  quote(req): { rate, amount_target, quote_id, expires_at }
  order(req): { order_id }
  verifyWebhook(headers, body): boolean
  parseSettlement(payload): { order_id, status, target_tx_hash, raw }
}

interface ScreeningProvider {
  search(subject): { hits: [...], risk_score }
  monitor(subject_ref): void
}

interface AddressScreeningProvider {
  screenAddress(req): { decision, risk_score?, categories?, raw }
  // decision: 'clean' | 'flagged' | 'sanctioned' | 'unscreened'
}
```

`unscreened` is a real value. Workers must handle it explicitly, never coerce to `clean`.

## 6. TigerBeetle ledger

One ledger, asset = NGN. USDC is metadata on payouts, not a balance — Globalstack converts and delivers, Reef never custodies USDC.

**Accounts:**

```
ext.paystack.suspense                    liability — credits in flight
ext.paystack.fees                        expense — Paystack's cut
ext.bank.<our_bank>.balance              asset — settled NGN at our partner bank
ext.globalstack.suspense                 liability — NGN sent to Globalstack pending USDC delivery
ext.globalstack.fees                     expense
fee.<business_id>.revenue                revenue — Reef's take per business
business.<top_business_id>.collected     asset — top-level only (super-merchants and standalone merchants)
business.<top_business_id>.payout_pending liability — held during payout
fx.settled                               equity-style sink — closes Globalstack suspense after USDC delivery
```

Sub-business attribution is carried as `user_data` on transfers, not as a separate TB account. Mongo projection rolls up.

**Transfer IDs are deterministic** (hash of provider event ID + leg index). TB's native uniqueness check becomes our idempotency layer for webhooks.

## 7. Payment flow (collection)

1. Super-merchant POSTs `/v1/payment-requests`. Reef calls Paystack `POST /charge` with `bank_transfer.account_expires_at`. Returns virtual account number scoped to that single charge (15min–8h TTL).
2. End-payer opens payment URL. Dashboard renders amount, billed party, KYC gate.
3. If KYC required (config + threshold based): Dojah widget embedded. End-payer completes liveness + ID. Dojah webhook fires `flo:kyc.completed`. ComplyAdvantage overlay → `customer.kyc_passed`.
4. End-payer transfers via NIP. Paystack fires `charge.success`.
5. Compliance check (name-match, sanctions on sender, travel-rule capture). Pass → settlement worker posts TB transfers. Fail → admin queue.
6. Projector updates Mongo balance view. Webhook dispatcher fires super-merchant callback.

**Inbound transfer approvals (Paystack)**: sync hook for hard-fail cases (sanctioned sender, suspended business, closed payment-request). Soft cases proceed and route to held queue post-credit.

**`bank.transfer.rejected` webhook**: handled as `payment.rejected` with `INCORRECT_AMOUNT` etc. — surfaced to dashboard and ops.

## 8. Payout flow (NGN → USDC)

1. Super-merchant POSTs `/v1/payouts` with destination `{chain, address}`.
2. Pre-checks: Mongo balance, business limits, address screening (`unscreened` → admin queue per env policy).
3. TB reservation: `business.collected` → `business.payout_pending`.
4. Worker requests Globalstack quote, posts second TB leg: `payout_pending` → `globalstack.suspense`.
5. Worker submits Globalstack order with quote ID + destination + idempotency key.
6. Globalstack settlement webhook → `payout.usdc_sent`. Worker posts closing leg: `globalstack.suspense` → `fx.settled`.
7. Travel Rule record persisted (originator entity + natural person + sender bank from Paystack metadata; beneficiary = destination wallet + super-merchant attestation).

Failures (quote expired, order rejected, timeout) have explicit reverse paths.

## 9. Compliance

**Three subjects:**

- Business KYB → PayKKa (RSA-signed, file upload + apply + legal-rep redirect + onboarding-notify callback).
- End-payer KYC → Dojah (embedded widget, webhook source-of-truth, 180-day reuse on the human).
- Sender, billed-party, payout destination → screening at runtime via ComplyAdvantage and address-screening provider.

**Compliance is the gate**: settlement worker calls `libs/compliance` synchronously before any TB write. `held` documents persist for visibility; admin actions emit flo events to release or reject.

**End-payer model**: human is KYC'd. Billed party is metadata, name-screened only. "Paying-on-behalf-of" disclosure captured at dashboard. Three valid name-match candidates at credit time (end-payer name, billed-party name, declared aliases).

**Sanctions refresh**: monthly re-screen via scheduled flo action. Newly-listed entities flagged retroactively.

**Audit**: every compliance decision is an immutable record (`audit_events`, `compliance_decisions`, `sanctions_hits`). 7-year retention. NDPC deletion via cryptographic erasure (delete per-record key, preserve metadata).

## 10. Settlement model

Default: **aggregator**. Sub-businesses under a super-merchant don't have independent payout rights; collected funds aggregate to the parent's TB account, and the parent settles internally off-platform.

Per-super-merchant override: `settlement_model = 'pass_through'` for non-aggregator platforms whose merchants are direct counterparties.

## 11. Auth + security

| Surface | Mechanism |
|---|---|
| `apps/api` (super-merchant) | HMAC `Authorization: HMAC-SHA256 <key_id>:<sig>` over `timestamp + method + path + body` |
| `apps/services` (dashboard) | Cookie sessions; private network only |
| `apps/office` (admin) | CF Access identity header (verified JWT) + VPN; admin SSO via Google Workspace |
| Admin | Cloudflare Access + Google SSO; identity header trusted by `apps/office` |
| PayKKa outbound | RSA SHA256withRSA, 5-line canonical (path \| ts_ms \| nonce \| merch_id \| body), URL-encoded JSON in `Authorization` header |
| PayKKa inbound | Verify with PayKKa's public key, reject before parsing body |
| Paystack | HMAC SHA512 webhook verification |
| Dojah | HMAC webhook verification |
| Globalstack | HMAC webhook verification |
| Internal services | private network only; no public exposure of `apps/services` or `apps/office` |

Secrets in Rune (encrypted at rest in `runed`'s BadgerDB; no read-API from outside, only mounted into services). RSA keys stored as PEM in Rune secrets, never in `.env`. Key rotation supported via `key_id` versioning.

## 12. Webhook contracts (outbound to super-merchants)

| Event | Fired when |
|---|---|
| `business.kyb.approved` | Activation after PayKKa + sanctions overlay |
| `business.kyb.rejected` | PayKKa rejection or our overlay rejection |
| `payment_request.created` | Successful POST `/v1/payment-requests` |
| `payment.received` | `charge.success` from Paystack (pre-compliance) |
| `payment.confirmed` | After compliance + TB post |
| `payment.rejected` | `bank.transfer.rejected` or compliance hard-fail |
| `payment.expired` | PWT account expired without payment |
| `payout.requested` | Successful POST `/v1/payouts` |
| `payout.approved` | Admin approval (when threshold required) |
| `payout.completed` | Globalstack USDC settlement confirmed |
| `payout.failed` | Any terminal failure |

Each carries `event_id` (monotonic), `created_at`, `data`, signature in `X-Reef-Signature` header (HMAC over body). Retry schedule: 0s, 30s, 5m, 30m, 2h, 12h, 24h, then dead-letter.

## 13. API surface (v1)

```
POST   /v1/businesses                      onboard sub-business (super-merchant only)
GET    /v1/businesses/:id
GET    /v1/businesses/:id/balance

POST   /v1/payment-requests
GET    /v1/payment-requests/:id
GET    /v1/payment-requests
POST   /v1/payment-requests/:id/cancel

POST   /v1/payouts
GET    /v1/payouts/:id
GET    /v1/payouts

POST   /v1/payout-destinations             add USDC address (triggers screening)
GET    /v1/payout-destinations
DELETE /v1/payout-destinations/:id

GET    /v1/transactions                    unified ledger view
GET    /v1/balances

GET    /v1/webhooks
POST   /v1/webhooks
DELETE /v1/webhooks/:id

GET    /v1/secret-keys                     metadata only
POST   /v1/secret-keys/rotate              returns new secret once

GET    /v1/events                          paginated event log
```

**Conventions**: `Idempotency-Key` on all mutating POSTs; cursor pagination (`?cursor=&limit=`); ISO 8601 UTC; integer minor units for money; RFC 7807 errors with custom `code`.

## 14. Audit + retention

| Record | Storage | Retention |
|---|---|---|
| Flo streams (`payments`, `compliance`, `payout`, `ledger`, `kyb`) | Flo durable log | 7 years cold archival |
| Mongo `audit_events`, `compliance_decisions`, `sanctions_hits` | Append-only collections | 7 years |
| KYC/KYB documents | S3 with versioning + object-lock | 7 years (cold-tier after 1 year) |
| TigerBeetle | Native append-only | Permanent |
| Customer PII | Encrypted at field level; per-record key | NDPC deletion via key destruction |

Every admin action emits an audit event (who, when, what, evidence). 4-eyes principle on tier upgrades and large payouts.

## 15. Hosting + deployment

DO droplets primary. EC2-portable: avoid DO managed services (no App Platform, no Managed Mongo). Mongo Atlas is cloud-agnostic. TF module per cloud; Rune + Caddy + service specs stay identical across clouds. Rune ships an [official EC2 Terraform module](http://docs.runestack.io/guides/terraform-ec2/) we mirror for DO.

Orchestration via **Rune** (same stack as hypercone). Apps + workers + Flo + Caddy run as Rune services. TigerBeetle runs **outside Rune** on dedicated droplets — Rune is single-node today (multi-node Raft is on the Rune roadmap, Release 2); a 3-node TB cluster needs its own host machines until then. Apps connect to TB by network address.

```
Production topology:
  caddy (edge, Rune service)
    ├─ apps/api          (Rune service — public, WAF, rate-limit)
    ├─ apps/services     (Rune service — private network)
    ├─ apps/office       (Rune service — private network, only reachable via apps/admin behind CF Access)
    ├─ apps/dashboard    (static, CDN)
    ├─ apps/admin        (static, CDN, behind Cloudflare Access + VPN)
    ├─ apps/docs         (static, CDN)
    └─ flo runtime       (Rune service)
  workers/*              (Rune services, scaled via rune scale)
  runed                  (control plane, BadgerDB-backed, holds encrypted secrets)
  TigerBeetle            (3-node cluster on dedicated droplets, NOT under Rune in v1)
  Mongo Atlas            (managed)
```

Deployment: `rune cast runeset/` applies the templated YAML bundle (one runeset per environment). Secrets created via `rune create secret <name> --from-literal=...` once, mounted into services as env vars or files via `secretMounts` / `envFrom: - secretRef:`. No CI access to prod app secrets — CI holds only a Rune deploy token.

## 16. Open questions (to close before implementation)

| Q | Owner | Blocks |
|---|---|---|
| PayKKa: signing canonicalization test vector + `key_id` issuance | PayKKa (Lin) | Wave 1 |
| PayKKa: full sub-industry codes, trade-volume tiers, employee tiers, export-type values, callback `biz_type` list | PayKKa | Wave 2 |
| Paystack PWT enabled on our account | Paystack | Wave 3 |
| Globalstack contract + sandbox keys | Globalstack | Wave 4 |
| ComplyAdvantage account + monitoring config | Reef | Wave 2 |
| Cloudflare Access + Google Workspace SSO setup | Reef | Wave 5 |
| TigerBeetle 3-node cluster sizing + DO droplet plan | Reef | Wave 5 |
| Address screening provider final pick (post-launch) | Reef | Post-v1 |

## 17. Glossary

- **MOR**: Merchant of Record — the legal entity collecting payment.
- **PWT**: Pay with Transfer (Paystack feature). Per-charge virtual account.
- **NIP**: Nigeria Interbank Payment system. Real-time bank transfers.
- **NUBAN**: Nigerian Uniform Bank Account Number.
- **KYB / KYC**: Know-Your-Business / Customer.
- **PEP**: Politically Exposed Person.
- **SCUML**: Special Control Unit on Money Laundering (Nigeria).
- **Travel Rule**: FATF Recommendation 16 — originator/beneficiary info on crypto transfers.
- **Suspense account**: TB account holding funds in flight to/from external partners.
- **Aggregator vs pass-through settlement**: whether sub-businesses collect to parent or independently.
- **Flo**: event/stream/KV runtime ([floruntime.io](http://docs.floruntime.io)).
