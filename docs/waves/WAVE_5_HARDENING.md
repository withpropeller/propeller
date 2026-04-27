# Wave 5 — Hardening + Ship

**Goal**: production-ready. Audit, retention, monitoring, runbooks, security review, prod infra, DR drill. Propeller goes live.

**Status**: not started
**Estimated effort**: 2–3 weeks
**Blocked by**: Waves 0–4

## Scope

1. Audit + retention infrastructure.
2. Sanctions list refresh worker.
3. Health checks, metrics, alerts.
4. Runbooks for common incidents.
5. Load testing.
6. Security review (or external pentest).
7. Production infra (TF, droplets, Caddy prod, Cloudflare Access prod).
8. TigerBeetle 3-node prod cluster.
9. Disaster recovery drill (TB snapshot restore, Mongo restore).
10. Compliance committee process formalized.
11. Tier upgrade flow (4-eyes) productionized.

## Audit + retention

**Append-only Mongo collections**:
- `audit_events` — every admin action, every state transition, every compliance decision
- `compliance_decisions` — typed decisions from `libs/compliance` with full evidence
- `sanctions_hits` — every screening hit ever, even cleared ones

**Indexes**:
- (subject_type, subject_id, created_at desc) for per-entity history
- (event_type, created_at desc) for type-scoped analysis
- TTL: never. These are 7-year records.

**S3 object-lock**:
- KYC/KYB documents in versioned bucket with object-lock (governance mode, 7y retention)
- Cold-tier transition after 1 year
- One bucket per environment

**Cryptographic erasure for NDPC deletion**:
- Per-record encryption key for PII fields (`end_payer.name`, `end_payer.dob`, etc.)
- Keys in dedicated KMS (DO Vault Service or AWS KMS)
- "Forget me" request → delete the key; ciphertext remains, audit metadata preserved

## Sanctions list refresh

Scheduled flo action `compliance.rescreen.monthly`:
- Re-screen all active businesses (directors + UBOs + business name)
- Re-screen all `end_payer.kyc_status='passed'` records
- Re-screen all payout destinations (against TRM/passthrough)
- New hits → admin review queue

ComplyAdvantage's monitoring API may push deltas in real time too — consume those onto stream `compliance` for real-time alerts.

## Health checks

Every service:
- `GET /healthz` — liveness (always 200 if process is up)
- `GET /healthz/ready` — readiness (deps reachable: Mongo, TB, Flo)
- `GET /healthz/compliance` — returns active provider names; alarms if `passthrough` in prod

Synthetic transactions:
- Sandbox payment-request created every 15 min from a monitor; should reach `confirmed` in < 5 min or alert
- Sandbox payout requested daily; should reach `completed` or alert

## Metrics + alerts

Prometheus → Grafana Cloud. SLOs:

| Metric | SLO |
|---|---|
| `apps/api` p99 latency | < 500ms |
| Paystack webhook → `payment.confirmed` | < 60s p95 |
| Outbound webhook delivery success | > 99.5% |
| Settlement worker queue depth | < 100 sustained |
| TB transfer error rate | < 0.01% |
| Sanctions screen latency | < 2s p95 |

Alerts in Sentry / PagerDuty / Slack:
- Any 5xx burst on `apps/api`
- Settlement queue depth > 500
- Failed flo event delivery
- Webhook dead-letter rate spike
- TB cluster member down
- Mongo replica lag > 10s
- `passthrough` provider in prod (always-firing reminder)

## Runbooks

Markdown in `docs/runbooks/`:

- Stuck payment (received but not confirmed)
- Failed payout (timeout from Globalstack)
- Missing Paystack webhook
- Sanctions list update with retroactive flag
- Compromised super-merchant API key
- TB node failure
- Mongo Atlas outage
- Flo cluster restart
- Address screening provider down (passthrough fallback)
- Dojah / PayKKa downtime degraded mode

Each runbook: symptoms, impact, immediate mitigation, root-cause investigation, fix, post-mortem template.

## Load testing

Use k6 or Artillery against staging:
- Scenario A: 50 concurrent payment-request creates / sec for 10 min
- Scenario B: Paystack webhook fan-in: 200 webhooks / sec for 5 min
- Scenario C: 10 concurrent payouts / min for 30 min

Targets:
- A: API p99 < 500ms, no 5xx
- B: settlement worker keeps up; queue depth bounded; all transactions reach `confirmed`
- C: TB linked transfers correct; no half-states

## Security review

Internal review minimum, ideally external pentest.

Focus areas:
- HMAC validation on inbound webhooks (Paystack, Dojah, Globalstack)
- RSA verification on PayKKa callbacks
- Replay protection on signed inbound (timestamp + nonce window)
- Idempotency key collisions
- Authorization on `apps/services` (business scoping) and `apps/office` (admin role/permission scoping)
- Cloudflare Access bypass attempts
- CSRF on dashboard
- XSS on admin (rendering raw provider responses)
- SSRF on document upload (size, MIME, URL fetch)
- Rate-limit + abuse vectors

## Production infra

```
Terraform modules:
  network/        VPC, subnets, security groups
  rune-host/      droplet/EC2 running runed (Rune control plane); BadgerDB volume snapshotted
                  Based on upstream rune/examples/terraform/ec2 (adapted for DO)
                  Pin rune_version (e.g. "v0.1.0"); never build from source in prod
                  Outputs: grpc_endpoint (:7863), http_endpoint (:7861), bootstrap token path
  tigerbeetle/    3-node cluster on dedicated droplets, SSD-backed volumes
                  (NOT under Rune in v1 — Rune is single-node; multi-node is Rune R2 roadmap)
  mongo/          Atlas via Atlas TF provider
  s3/             buckets + object-lock
  cloudflare/     DNS, WAF rules, Access apps
```

Reference: [Rune Terraform on EC2 guide](http://docs.runestack.io/guides/terraform-ec2/). DO uses the same systemd-installed pattern with the DO provider; equivalent module lives in `infra/terraform/rune-host-do/`. EC2 module remains usable as-is for the EC2-portable story.

Application services (apps/api, apps/services, apps/office, workers, flo, caddy) are not TF resources — they're Rune services declared in `infra/runeset/` and applied with `rune cast runeset/ --values=prod`.

Deploy via GitHub Actions:
1. Build images, push to registry.
2. TF apply for infra changes (manual approval gate).
3. `rune cast` to roll out service updates.
4. `rune get services` + healthcheck verification.

Rolling restart via `rune restart <service>` after secret updates.

## TigerBeetle production cluster

3 nodes minimum (TB consensus minimum). DO droplets with SSD-backed block storage. Snapshots to S3 every 4h.

**Lives outside Rune in v1.** Rune is single-node today (multi-node Raft is Rune Release 2 roadmap). TB nodes run under systemd on dedicated droplets, managed via TF + Ansible (or shell scripts; minimal). Apps inside Rune connect to TB by network address via the `TB_ADDRESSES` secret.

When Rune R2 ships multi-node, evaluate folding TB management under Rune services — no urgency; TB's own consensus is what we rely on, not the orchestrator's.

Sizing v1: smallest TB-supported config; scale vertical first then horizontal.

Migration from single-node dev/staging to 3-node prod: documented procedure, test in staging first.

## DR drill

Practiced before launch:

1. **Mongo restore**: simulate Atlas outage; restore from latest backup to a fresh cluster; redirect services; verify data integrity.
2. **TigerBeetle restore**: simulate full TB cluster loss; restore from snapshot; replay flo `ledger.posted` events from last snapshot point; verify balances match Mongo projections.
3. **Flo cluster restart**: simulate flo node loss; verify event delivery resumes without duplicates.
4. **Region failover** (if multi-region): cutover plan, DNS flip, time to recovery.

Document the actual times achieved; set RPO/RTO targets.

## Compliance committee

Formalize:
- Named members (CCO + ops lead minimum)
- Meeting cadence (weekly during launch, bi-weekly steady-state)
- Decision authority matrix (who can approve what tier upgrade, what payout size)
- Recorded minutes in `audit_events`

## Tier upgrade flow

`apps/admin` UI:
- Initiate tier upgrade for a business
- Capture additional KYB context (volume projections, contract addendum)
- Triggers ComplyAdvantage re-screen
- 4-eyes: two approvers required
- DocuSign integration for contract addendum
- On approval: `business.tier = super_merchant`, capabilities granted, API key issued

## Definition of done

- [ ] Synthetic transaction monitor running in production for 7 days without alerting
- [ ] Load test scenarios A/B/C all pass
- [ ] DR drill completed and documented; RPO/RTO targets met
- [ ] All runbooks reviewed and tested by ops team
- [ ] Security review or pentest report addressed; no high-severity open findings
- [ ] 3-node TB cluster running in prod for 7 days
- [ ] Sanctions refresh job runs successfully
- [ ] Tier upgrade end-to-end test (sandbox business promoted via 4-eyes)
- [ ] Compliance committee process documented and meeting held
- [ ] First real production transaction (small, monitored) completes successfully

## Risks

- **External pentest scheduling**: long lead time; book early in Wave 4 if going external.
- **TigerBeetle 3-node cluster operational experience**: limited team familiarity. Plan for 1 day per node bring-up + 2 days troubleshooting.
- **Cloudflare Access SSO setup**: depends on Propeller's Google Workspace admin access.
- **First-week monitoring burden**: expect heavier ops load for 1–2 weeks post-launch; staffed coverage.

## Post-v1 (out of scope)

Items deferred to v1.x:
- Real address-screening provider (TRM/Chainalysis/Elliptic)
- Refund automation
- Multi-currency collection
- VASP-to-VASP travel-rule via Notabene/Sumsub
- Self-serve fee schedule editing for super-merchants
- Multi-region active/active

These should each get their own design doc when picked up.
