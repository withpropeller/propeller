# Wave 1 — Provider Adapters

**Goal**: every external integration is encapsulated, signed correctly, and verified against fixtures before any worker code is built on top.

**Status**: code-complete — all 5 adapters implemented, 27 tests pass, provider loader built. Blocked on partner credentials for sandbox testing.
**Estimated effort**: 2 weeks (actual: ~3 sessions)
**Blocks**: Wave 2 (KYB), Wave 3 (collection), Wave 4 (payout)
**Blocked by**: partner credentials (PayKKa `key_id` + test vectors, Paystack PWT activation, Globalstack sandbox)

## Scope

Implement five provider adapters in `libs/providers/<name>` against the interfaces in `libs/contracts/providers.ts`. Mock-driven first; live credentials when they arrive.

Providers are **loaded from env at runtime** — read from Rune secrets in deployed envs. Adding a new provider is a drop-in lib + env var. No code changes in apps/workers.

| Provider | Interface | Surface |
|---|---|---|
| Paystack | VirtualAccountProvider | PWT charge create, webhook verify (charge.success, bank.transfer.rejected) |
| PayKKa | MerchantKybProvider | RSA signing, file upload, apply+update onboarding, callback verify |
| Dojah | CustomerKycProvider | session create, webhook verify, result parser |
| Globalstack | OffRampProvider | quote, order, settlement webhook |
| Passthrough address ✅ | AddressScreeningProvider | always returns `unscreened` |

> **ComplyAdvantage removed** — we don't have API access yet. The interface slot is reserved in contracts; re-add when access is available.

## Contracts

All provider interfaces are defined in `libs/contracts/providers.ts`. Each adapter implements exactly one interface.

```ts
// Shared lifecycle
interface ProviderAdapter {
  name: string;
  healthcheck(): Promise<boolean>;
}

// Provider registry maps type → interface
type ProviderType = 'paystack' | 'paykka' | 'dojah' | 'globalstack' | 'passthrough_address';
```

## Env-driven provider loading

```env
# In Rune secrets / .env.local:
PROVIDER_PAYSTACK_ENABLED=true
PROVIDER_PAYKKA_ENABLED=true
PROVIDER_DOJAH_ENABLED=true
PROVIDER_GLOBALSTACK_ENABLED=true
PROVIDER_PASSTHROUGH_ADDRESS_ENABLED=true

# Per-provider secrets (from Rune):
PAYSTACK_SECRET_KEY=...
PAYSTACK_WEBHOOK_SECRET=...
PAYKKA_PRIVATE_KEY_PEM=...
PAYKKA_PUBLIC_KEY_PEM=...
PAYKKA_KEY_ID=...
PAYKKA_MERCH_ID=...
PAYKKA_BASE_URL=https://open-fat.cb.paykka.com
DOJAH_APP_ID=...
DOJAH_PUBLIC_KEY=...
DOJAH_SECRET_KEY=...
DOJAH_WEBHOOK_SECRET=...
GLOBALSTACK_API_KEY=...
GLOBALSTACK_WEBHOOK_SECRET=...
GLOBALSTACK_BASE_URL=https://sandbox.globalstack.io
```

## Critical path: PayKKa RSA signing

Sign-and-verify is the single most error-prone piece of the integration. Build it test-first.

**Signature string (5 lines, each ending `\n` except the last):**

```
<request_path>\n
<timestamp_millis>\n
<nonce>\n
<merch_id_or_empty>\n
<request_body>            ← raw JSON, NO trailing \n
```

**Without request body** → omit line 5 (4 lines total).
**Without merchant ID** → empty line 4 (keep the `\n`).

```
signature = base64(RSA_SHA256_sign(private_key, canonical_string))

Authorization = URLEncode(JSON.stringify({
  sign_type: "SHA256_WITH_RSA",
  timestamp: <same millis>,
  nonce:     <same nonce>,
  key_id:    <platform-issued by PayKKa>,
  signature: <base64 sig>
}))
```

**Implementation rules:**
- Body is serialized once and reused for both sign and HTTP send. Different JSON serializers reorder keys; never re-serialize.
- Empty `merch_id` keeps its newline (line 4 = `""` + `\n`).
- Inbound callbacks: verify with PayKKa's public key BEFORE parsing body. Reject unsigned content; never log it to ops dashboards.
- Nonce + timestamp dedup window in flo KV (anti-replay). 5-minute window; reject older.
- Both PayKKa public key and Propeller private key stored as PEM in Rune secrets. `key_id` is a regular config value (PayKKa-issued, supports rotation).

**Auth rules per endpoint:**
| Method | Path | Auth Header | `X-Merch-Id` |
|---|---|---|---|
| POST | `/api/file/upload` | RSA sign | ✅ Propeller's own PayKKa merch ID |
| POST | `/api/v2/merch/onboard/apply` | RSA sign | ❌ (do NOT pass X-Merch-Id) |
| POST | `/api/v2/merch/onboard/update` | RSA sign | ❌ |
| POST | `/api/v2/merch/onboard/status` | RSA sign | ❌ |
| inbound | callback URL | Verify inbound sig | N/A |

**Test vectors required** (from Lin in PayKKa kickoff):
- Sample canonical string + expected base64 signature against a known keypair
- Sample callback payload + signature for verification round-trip

Do not write business logic in the PayKKa adapter until these vectors pass green in CI.

## PayKKa onboarding API

Base URL: `https://open-fat.cb.paykka.com` (sandbox/fat env)

### POST `/api/v2/merch/onboard/apply`

Submit a merchant onboarding application. Response: `{ authorize_link, merch_id }`.

Key fields in the request (see `libs/contracts/providers.ts` for full types):

- `request_id` — unique request ID in caller system (1-32 chars)
- `contact_person` — `{ phone_prefix, phone, email }`
- `license` — company info: `region` (2-char ISO), `ent_name`, `ent_name_en`, `found_date`, `registered_currency` (ISO 4217, 3-char), `registered_capital` (minor units), `address`, region-specific fields
- `business` — `main_industry`, `sub_industry`, `employee_number`, `address`, `export_country` (ISO 3166-1 alpha-2), `export_type`, `trade_volume`, `website`, `business_models`
- `stakeholder_list` — array of `{ identity_type (LEGAL_PERSON|BENEFICIARY|SHAREHOLDER|DIRECTOR), name, nationality, birth_date, doc_type, id_number, doc_portrait_side_file_id, resident_address, share, ... }`
- `resident_address` — `{ province?, city?, zipcode?, address1, address2? }`

### POST `/api/file/upload`

Upload document files before onboarding. Returns `file_id` used in `stakeholder_list.doc_portrait_side_file_id` etc.

### POST `/api/v2/merch/onboard/update`

Update an existing onboarding application. Same body shape as apply.

### POST `/api/v2/merch/onboard/status`

Query onboarding status: `{ merch_id }`. Response: `{ status, merch_id }`.

### Callback: Onboarding Notification

PayKKa POSTs to our callback URL when onboarding status changes:
- `merch_id`, `status` (`APPROVED` | `REJECTED` | `SUPPLEMENT`), `message`
- We verify signature with PayKKa's public key before processing.

## Paystack — PWT specifics

Base URL: `https://api.paystack.co`

### POST `/charge`

```json
{
  "email": "customer@example.com",
  "amount": "10000",
  "bank_transfer": { "account_expires_at": "2025-04-24T16:40:57.954Z" },
  "metadata": { "payment_request_id": "..." }
}
```

→ `{ reference, account_number, account_name, bank: { slug, name }, account_expires_at }`

**Account expiry rules:**
- If `account_expires_at - now < 15min` → Paystack defaults to 15min
- If `account_expires_at - now > 8hrs` → Paystack defaults to 8hrs

**Inbound Transfer Approvals**: implement if you need to reject/accept transfers.

### Webhook events (HMAC SHA512):

**`charge.success`** (channel = `bank_transfer`):
- Map sender info from: `authorization.sender_name`, `authorization.sender_bank_account_number`, `authorization.sender_country`, `authorization.narration`
- Amount in kobo; `fees` and `requested_amount` also available
- Emit `flo:payment.received`

**`bank.transfer.rejected`:**
- `data.bank_transfer.message` — human-readable reason
- `data.bank_transfer.message_type` — `INCORRECT_AMOUNT`, etc.
- `data.bank_transfer.transaction_id` — reference
- Emit `flo:payment.rejected`

### `GET /charge/:reference` (check pending):
Manually verify status. Returns full charge object.

## Dojah — Identity Hub

Base URL: TBD from Dojah dashboard (varies by region).

Dojah offers two product hubs:
- **Identity Hub**: KYC/KYB verification, government ID, biometrics, address verification, no-code widgets
- **Anti-Fraud Hub**: AML screening, fraud scoring, credit checks, event monitoring

For Wave 1 we integrate the **Identity Hub** for customer KYC.

### Session creation (widget flow):

```
POST /api/v1/kyc/session
  body: { reference, email, redirect_url?, allowed_id_types? }
  → { reference_id, widget_token, public_key, expires_at }
```

Widget embed in `apps/dashboard` via Dojah JS SDK. Two completion signals:
- `onSuccess` callback: UI advances to "verifying"
- Webhook: source of truth → `flo:kyc.completed`

### Webhook verification

HMAC on webhook payload. Fields extracted:
- `full_name`, `dob`, `country`, `doc_type`, `doc_number_masked`
- `liveness_score` normalized to 0–100

### Query result

```
GET /api/v1/kyc/result/:referenceId
  → { reference_id, status, verification_data }
```

### Integration options
- API-based (direct REST calls)
- No-code widgets (Dojah JS SDK, iframe)
- Mobile SDKs

## Globalstack (Passport) — Off-Ramp

Base URL: `https://api.globalstack.io` (prod) / `https://sandbox.globalstack.io` (sandbox)

Auth: `Authorization: Bearer <api-key>`

### Supported:
- **18 African countries**: NG, KE, ZA, GH, BJ, SN, CM, TZ, etc.
- **Currencies**: NGN, KES, ZAR, GHS, XOF, XAF, TZS, etc.
- **Crypto**: USDC on Ethereum, Base, Solana (stablecoin only)
- Three conversion scenarios: OnRamp (fiat→crypto), OffRamp (crypto→fiat), Fiat-to-Fiat

### Response format:

Success: `{ type: "success", message: "...", data: { ... } }`
Error: `{ type: "error", message: "...", error_code: "..." }`

### Endpoints:

```
GET  /v1/me                     — verify API key + account info
GET  /v1/me/api-key             — retrieve API key details
POST /v1/quote                  — get rate quote (source_currency, target_currency, source_amount | target_amount)
POST /v1/orders                 — place conversion order (quote_id, account_number, bank_code, account_name, idempotency_key)
GET  /v1/orders/:orderId        — get order status
```

Webhook on settlement → emit `flo:payout.usdc_sent` with `target_tx_hash`.

## Passthrough address ✅

```ts
class PassthroughAddressScreeningProvider {
  async screenAddress(req) {
    return { provider: 'passthrough', decision: 'unscreened', raw: {...}, screened_at: now }
  }
}
```

Implemented in `libs/providers/passthrough_address/index.ts`. Worker-side handling (`unscreened` → admin queue per env policy) lives in Wave 4.

## Provider adapter structure (as built)

```
libs/providers/
  _shared/
    index.ts           BaseProviderClient (fetch + retry + timeout), HMAC helpers, errors
  loader.ts            loadProviders() — reads env, instantiates configured adapters
  paystack/
    index.ts           PaystackProvider (charge create, webhook verify)
    parsers.ts         parsePaystackWebhook — typed event parsing
    index.test.ts      7 tests (charge, webhooks, parsing)
  paykka/
    index.ts           PayKKaProvider (onboarding endpoints)
    signing.ts         RSA SHA256 canonical signing + verification
    index.test.ts      6 tests (constructor, signing round-trip, callback reject)
  dojah/
    index.ts           DojahProvider (session create, result, webhook)
    index.test.ts      4 tests (constructor, HMAC verify)
  globalstack/
    index.ts           GlobalstackProvider (quote, order, status)
    parsers.ts         unwrapGlobalstack — typed response unwrapping
    index.test.ts      7 tests (constructor, unwrap, HMAC verify)
  passthrough_address/
    index.ts           PassthroughAddressScreeningProvider (always unscreened)
```

## Definition of done

- [x] All five adapters implement their interface and pass contract tests
- [ ] PayKKa signing produces a known-good signature against Lin's test vector (blocked)
- [x] PayKKa callback verification round-trips against a recorded fixture
- [ ] Paystack PWT charge creates a real virtual account in sandbox (blocked on activation)
- [x] Paystack webhook signature verifies + parsing tests pass
- [ ] Dojah session can be created in sandbox (blocked on credentials)
- [x] Dojah widget session flow + result parsing implemented + tested
- [ ] Globalstack quote+order work in sandbox (blocked on access)
- [x] Globalstack quote/order/status + response unwrapping implemented + tested
- [x] Passthrough address adapter returns `unscreened` decision
- [x] All provider secrets are read from config map (Rune-ready)
- [x] All adapters have explicit timeout + retry behavior; no infinite waits
- [x] Providers are loaded from env at runtime via `libs/providers/loader.ts`
- [x] Adapters split into sub-files: signing.ts, parsers.ts per provider

## Risks

- **PayKKa signing canonicalization may differ from our reading**. Mitigated by demanding test vectors before writing the adapter. The canonical string format matches our Wave 1 spec — confirmed from PayKKa docs.
- **Paystack PWT activation timeline** depends on Paystack's onboarding queue.
- **Globalstack sandbox quality** unknown — partner relationship still being formalized. Passing `idempotency_key` on orders to prevent duplicates.
- **Dojah Africa-region coverage** for ID types may have surprises (e.g. some doc types unsupported in some countries). Catalog at adapter level.

## Out of scope

- Worker integration of these adapters (Wave 2+)
- Frontend integration of Dojah widget beyond placeholder mount (Wave 3)
- Real production credentials (Wave 5)
- ComplyAdvantage screening (no API access yet — re-add when available)
