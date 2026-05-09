# Wave 2 — Ledger + Business Onboarding

**Goal**: a real business can self-serve onboard, complete PayKKa KYB, get activated, and log into the dashboard. Ledger primitives in place even though no money has moved yet.

**Status**: partially implemented (see audit below)
**Estimated effort**: 2 weeks
**Blocks**: Wave 3 (collection), Wave 4 (payout)
**Blocked by**: Wave 1

## Scope

1. TigerBeetle account model + `libs/ledger` wrapper.
2. `apps/api`, `apps/services`, and `apps/office` skeletons: auth, idempotency, error model, OpenAPI emission.
3. `business` entity, KYB workflow (self-serve dashboard wizard + API path for super-merchants).
4. PayKKa orchestration: file upload, apply onboarding, legal-rep redirect/email, notification handling, ComplyAdvantage overlay.
5. `apps/admin` skeleton (Vite SPA → `apps/office`): business list, KYB queue, manual approval actions, behind Cloudflare Access.
6. `workers/compliance` consuming `flo:kyb.*` events.

## libs/ledger

Wrapper around TigerBeetle client.

```ts
class Ledger {
  async createAccount(opts): Promise<Account>
  async transfer(legs: TransferLeg[]): Promise<TransferResult>
  async balance(account_id): Promise<{ debits, credits, balance }>
}

type TransferLeg = {
  id: bigint                     // deterministic, hashed from event
  debit_account_id: bigint
  credit_account_id: bigint
  amount: bigint
  user_data: bigint              // sub-business attribution etc.
  flags?: { linked?: boolean }   // for atomic multi-leg
}
```

**Account ID assignment**: deterministic from `(business_id, account_type)`. Hash → 128-bit TB ID.

**Transfer ID assignment**: `hash(provider_event_id, leg_index)`. TB rejects duplicates → free idempotency for replayed webhooks.

**Account types** (NGN ledger only in v1):
- `paystack_suspense` (system)
- `paystack_fees` (system)
- `bank_settlement` (system)
- `globalstack_suspense` (system)
- `globalstack_fees` (system)
- `fx_settled` (system)
- `business_collected` (one per top-level business)
- `business_payout_pending` (one per top-level business)
- `business_fee_revenue` (one per business — may roll up)

System accounts created on infra bootstrap. Business accounts created on business activation.

## Business entity

```ts
business: {
  _id, name, country, status, kyb_status, risk_tier,
  parent_business_id?,
  tier: 'merchant' | 'super_merchant',
  capabilities: {
    create_payment_requests,
    onboard_sub_businesses,
    use_api,
    request_payouts,
  },
  api_keys: SecretKey[],
  paykka_merch_id?,
  paykka_status?,
  payout_destinations: PayoutDestination[],
  audit: { created_by, created_at, ... },
}

kyb_status: 'draft' | 'files_uploading' | 'submitted' | 'identity_pending'
            | 'under_review' | 'approved' | 'rejected' | 'manual_review'
status: 'pending' | 'active' | 'suspended' | 'closed'
```

State machine transitions emit flo events on stream `kyb`:

```
kyb.submitted             # we called PayKKa apply, got authorize_link
kyb.identity_started      # legal rep clicked the link
kyb.identity_pending      # waiting on PayKKa
kyb.completed             # PayKKa notify arrived (status approved/rejected/review)
kyb.sanctions_passed      # ComplyAdvantage overlay clean
kyb.sanctions_review      # overlay flagged
business.activated
business.kyb_rejected
```

## apps/api skeleton

```
POST   /v1/businesses           super-merchant onboards sub-business
GET    /v1/businesses/:id
GET    /v1/businesses/:id/balance

# Public sign-up not on /v1 — lives at /public/* for dashboard wizard
POST   /public/signup
POST   /public/businesses
POST   /public/businesses/:id/documents     multipart, proxied to PayKKa file upload
POST   /public/businesses/:id/submit
```

**Auth surfaces by app**:
- `apps/api` `/v1/*` — HMAC (super-merchants)
- `apps/services` `/public/*` and `/dashboard/*` — session cookie or signup token (business users + end-payers)
- `apps/office` `/admin/*` — Cloudflare Access verified identity header (Propeller ops)

**Idempotency**: `Idempotency-Key` header → flo KV (`idem:<api_key_id>:<key>`) with 24h TTL. Hit returns cached response; miss reserves and proceeds.

**Errors**: RFC 7807 with custom `code` field.

```json
{
  "type": "https://propeller.xyz/errors/business-kyb-not-passed",
  "title": "KYB not passed",
  "status": 409,
  "code": "BUSINESS_KYB_NOT_PASSED",
  "detail": "Business <id> is in kyb_status=under_review",
  "instance": "/v1/payment-requests"
}
```

## Onboarding sequence

**Self-serve (dashboard)**:
```
1. /public/signup → email + password
2. Email verification
3. /public/businesses → create draft business
4. Multi-step wizard:
   - business info (name, country, registration)
   - industry (Propeller enum, mapped to PayKKa codes)
   - stakeholders (legal_rep, directors, beneficiaries, shareholders)
   - documents (multipart upload — Propeller API → PayKKa file upload, capture file_id)
5. /public/businesses/:id/submit
   → workers/compliance picks up flo:business.submission_ready
   → calls PayKKa apply onboarding
   → captures merch_id + authorize_link
   → emits flo:kyb.submitted
6. Propeller-hosted intermediary page emailed to legal rep:
   https://merchants.propeller.xyz/kyb/<id>?token=...
   → renders our consent + branding → redirect to authorize_link
7. PayKKa Onboarding Notification → /webhooks/paykka
   → workers/compliance:
       - run ComplyAdvantage overlay
       - sanctions clean → emit flo:business.activated, set status=active
       - flagged → emit flo:kyb.manual_review → admin queue
```

**API (super-merchant onboards sub-business)**: same engine, ingress is `POST /v1/businesses` instead of `/public/*`. Returns `{ business_id, kyb_status, authorize_link }`. Super-merchant relays `authorize_link` to its sub-business legal rep (or we email via intermediary if super-merchant config opts in).

## Industry taxonomy

Propeller-side normalized vocabulary in `libs/compliance/industries.ts`:

```ts
type PropellerIndustry = 'fashion_apparel' | 'electronics' | 'beauty_health' | ...

const PAYKKA_MAPPING: Record<PropellerIndustry, {
  newIndustry: string                // PayKKa New Industry enum
  subIndustries: string[]
  businessCategory?: number          // legacy, if still required
  productCategories?: number[]       // legacy, if still required
}>
```

Mappings finalized once Lin confirms which fields are required (item 13 in kickoff email). Free-text industries blocked in v1 — admin handles via manual mapping if needed.

## apps/office + apps/admin

`apps/office` is the privileged backend; `apps/admin` is the Vite SPA that consumes it. They are deployed together but separate from `apps/services`/`apps/dashboard` for blast-radius isolation.

Shipped in this wave (skeleton + KYB queue):

- Business list (filter by status, kyb_status)
- KYB queue (pending review, manual review, recently activated)
- Business detail page (PayKKa raw response, ComplyAdvantage hits, audit timeline)
- Actions: approve manual review, reject, request additional documents
- Cloudflare Access entry + Google SSO; admin UI inaccessible without VPN

Admin UI uses `apps/office` REST exclusively. Mutations emit flo events; workers handle effects. `apps/office` never exposes endpoints to `apps/dashboard`'s network surface.

## workers/compliance

Subscribes to:
- `business.submission_ready` → PayKKa apply
- `kyb.completed` → ComplyAdvantage overlay
- `admin.business.approved` / `admin.business.rejected` → state transition
- (later waves) settlement compliance, payout compliance

Idempotent: every action is keyed off the consumed event ID.

## Definition of done

- [ ] A test business completes self-serve signup, uploads documents, hits PayKKa sandbox, receives authorize_link, completes legal-rep auth in sandbox, gets PayKKa "approved" callback, passes ComplyAdvantage overlay, becomes `active`
- [ ] Same flow works via `POST /v1/businesses` from a super-merchant API client
- [ ] Admin can see the business in queue, drill in, see PayKKa raw + sanctions, take action
- [x] TB business accounts created on activation (`ActivateBusiness` handler wired); balances queryable via ledger queries
- [x] OpenAPI generated from `apps/api`, `apps/services`, `apps/office` (SwaggerModule wired; schemas incomplete)
- [x] Idempotency key replay returns cached response (TB native + ledger outbox + webhook KV dedup)
- [ ] Compliance audit trail records every state transition with actor + evidence

## Implementation Audit (as of 2026-04-30)

| Scope Item | Status | Evidence / Location |
|---|---|---|
| TigerBeetle account model + `libs/ledger` wrapper | **Implemented** | `services/core/internal/ledger/ledger.go` — `ExecuteTransfer`, `EnsureSystemAccounts`, `EnsureBusinessAccounts`, deterministic IDs, outbox pattern, reaper |
| `apps/api`, `apps/services`, `apps/office` skeletons | **Scaffolded** | NestJS + Fastify + SwaggerModule in each; only `HealthModule` imported; no auth, idempotency middleware, or business modules yet |
| `business` entity, KYB workflow | **Partial** | `libs/go-common/models/business.go` & `business_entity.go` exist; `services/core/internal/handlers/handlers.go` has `SubmitKyb`, `CompleteKyb`, `ActivateBusiness` stubs (TODOs for PayKKa call + state machine) |
| PayKKa orchestration | **Partial** | `libs/providers/paykka/index.ts` — RSA signing, `applyOnboarding`, `queryStatus`, `uploadFile` (stubbed multipart), `verifyCallbackSignature` (simplified); no ComplyAdvantage integration yet |
| `apps/admin` skeleton | **Scaffolded** | Vite SPA with React Router; placeholder home page only; no KYB queue, business list, or actions |
| `workers/compliance` | **Not started** | `workers/` is empty (`.gitkeep` only); event subscriptions and handler logic live in `services/core` for now |
| Auth surfaces (HMAC, session, CF Access) | **Not started** | No middleware or guards in any NestJS app |
| Idempotency middleware | **Partial** | TB + outbox give idempotency for ledger writes; webhook dedup via flo KV (`webhook:` prefix, 24h TTL); no HTTP `Idempotency-Key` middleware in `apps/api` or `apps/services` |
| RFC 7807 error model | **Not started** | No shared error filter or exception factory |
| OpenAPI emission | **Partial** | SwaggerModule wired in all three backends, but no controllers or DTOs registered beyond health |
| ComplyAdvantage overlay | **Not started** | No provider adapter, no screening logic, no sanctions events emitted |
| Cloudflare Access + Google SSO for admin | **Not started** | `apps/office` main.ts mentions "Behind Cloudflare Access + VPN" in Swagger description only |

## Risks

- **PayKKa industry taxonomy mapping** still pending Lin's response — block on having the mapping table populated before this wave's UI work.
- **Propeller-hosted intermediary page UX** — needs a designer pass; default to functional.
- **Document upload sizes**: PayKKa caps at 10 MiB. Phone-camera images may exceed. Add client-side resize before upload.
- **ComplyAdvantage false positives** on common names — risk-score threshold needs tuning. Default conservative (more manual reviews) and loosen with data.
- **Cloudflare Access provisioning** for admin — block on Propeller's IT ownership of the Workspace.

## Out of scope

- Tier upgrades (super-merchant promotion) beyond a manual admin action — formal 4-eyes flow can ship in Wave 5
- Sub-business attribution rolled up to parent in Mongo views — placeholder in Wave 2, finalized in Wave 3 once payments arrive
- Webhook outbound delivery for `business.kyb.approved` etc. — built in Wave 3 alongside the dispatcher

## Next steps to complete Wave 2

1. **Flesh out `apps/api` controllers** — `POST /v1/businesses`, `GET /v1/businesses/:id`, `GET /v1/businesses/:id/balance`; add HMAC auth middleware and `Idempotency-Key` filter.
2. **Flesh out `apps/services` public endpoints** — `/public/signup`, `/public/businesses`, `/public/businesses/:id/documents`, `/public/businesses/:id/submit`; session-cookie auth.
3. **Implement `apps/office` admin endpoints** — business list, KYB queue, detail page, approve/reject actions; Cloudflare Access header verification.
4. **Build `apps/admin` UI** — business list, KYB queue, detail page with PayKKa raw response viewer, audit timeline, action buttons.
5. **Wire PayKKa in `services/core` handlers** — replace `SubmitKyb` / `CompleteKyb` TODOs with real provider calls; emit correct flo events; persist `merch_id` + `authorize_link`.
6. **Add ComplyAdvantage provider adapter** — `libs/providers/complyadvantage/` with screening interface; wire into `CompleteKyb` handler.
7. **Create `workers/compliance`** — dedicated consumer for `kyb-events` and `business-events` streams (can start as a thin wrapper around `services/core` handlers if we want to keep logic centralized).
8. **Add RFC 7807 error filter** — shared NestJS exception filter in `libs/core` or per-app.
9. **Populate industry taxonomy mapping** — blocked on Lin's response; once unblocked, add `libs/compliance/industries.ts`.
10. **End-to-end test** — run the full self-serve flow against PayKKa sandbox, verify TB accounts are created on activation, verify admin queue populates.
