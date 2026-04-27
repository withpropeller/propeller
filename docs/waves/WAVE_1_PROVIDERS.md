# Wave 1 — Provider Adapters

**Goal**: every external integration is encapsulated, signed correctly, and verified against fixtures before any worker code is built on top.

**Status**: not started
**Estimated effort**: 2 weeks
**Blocks**: Wave 2 (KYB), Wave 3 (collection), Wave 4 (payout)
**Blocked by**: Wave 0; partner credentials (PayKKa `key_id`, Paystack PWT activation, Globalstack sandbox)

## Scope

Implement the six provider adapters in `libs/providers/<name>` against the agreed interfaces in `libs/contracts`. Mock-driven first; live credentials when they arrive.

| Provider | Interface | Surface |
|---|---|---|
| Paystack | VirtualAccountProvider | PWT charge create, webhook verify (charge.success, bank.transfer.rejected), inbound-approval handler |
| PayKKa | MerchantKybProvider | RSA signing, file upload, apply onboarding, callback verify |
| Dojah | CustomerKycProvider | session create, webhook verify, result parser |
| Globalstack | OffRampProvider | quote, order, settlement webhook |
| ComplyAdvantage | ScreeningProvider | search, screen, monitor |
| Passthrough address | AddressScreeningProvider | always returns `unscreened` |

## Critical path: PayKKa RSA signing

Sign-and-verify is the single most error-prone piece of the integration. Build it test-first.

```
canonical_string =
  <request_path>           \n
  <timestamp_millis>       \n
  <nonce>                  \n
  <merch_id_or_empty>      \n
  <request_body>             ← raw JSON, no trailing \n

signature = base64(RSA_SHA256_sign(reef_private_key, canonical_string))

Authorization = url_encode(json_stringify({
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
- Both PayKKa public key and Propeller private key stored as PEM in Doppler. `key_id` is a regular config value (PayKKa-issued, supports rotation).

**Test vectors required** (from Lin in PayKKa kickoff):
- Sample canonical string + expected base64 signature against a known keypair
- Sample callback payload + signature for verification round-trip

Do not write business logic in the PayKKa adapter until these vectors pass green in CI.

## PayKKa endpoints implemented

| Method | Path | Function | Auth |
|---|---|---|---|
| POST | `/api/file/upload` | upload merchant document | RSA + Propeller's `X-Merch-Id` |
| POST | `/api/v2/merch/onboard/apply` | submit KYB application | RSA only (no `X-Merch-Id`) |
| inbound | callback URL | onboarding notification | PayKKa-signed, verified by us |

`X-Merch-Id` for file upload is **Propeller's own PayKKa merchant ID** (we register as a merchant ourselves). This is being clarified with Lin (item 6 in the kickoff email).

## Paystack — PWT specifics

```
POST /charge
  body: { email, amount, bank_transfer: { account_expires_at }, metadata: { payment_request_id, ... } }
  → { reference, account_number, account_name, bank, account_expires_at }
```

Webhook events:
- `charge.success` (channel = `bank_transfer`) → emit `flo:payment.received`. Map sender info from `authorization.sender_name`, `authorization.sender_bank_account_number`, `authorization.sender_country`.
- `bank.transfer.rejected` → emit `flo:payment.rejected` with `message_type` (`INCORRECT_AMOUNT`, etc.)

Inbound transfer approval endpoint: sync, short timeout, hard-fail decisions only (sanctioned sender, suspended business, closed payment-request). Soft fails accept-and-route to held queue.

HMAC SHA512 with Paystack secret.

## Dojah — session + webhook

```
session.create
  → { reference_id, widget_token, public_key, expires_at }
```

Widget embed in `apps/dashboard` via Dojah JS SDK. Two completion signals:
- `onSuccess` callback: UI advances to "verifying"
- Webhook: source of truth → `flo:kyc.completed`

HMAC verification on webhook. Liveness score normalized to 0–100. Field extraction: `full_name`, `dob`, `country`, `doc_type`, `doc_number_masked`.

## Globalstack — quote + order

```
POST /quote   → { rate, amount_target, quote_id, expires_at }
POST /orders  → { order_id }      with idempotency_key
```

Webhook on settlement → emit `flo:payout.usdc_sent` with `target_tx_hash`. HMAC verification.

## ComplyAdvantage — search + monitor

Per-subject search returns hit list with confidence. Monitor sets up ongoing alerts (daily delta).

Subjects screened:
- Business directors + UBOs + business name (KYB time)
- End-payer extracted identity (KYC time)
- NIP sender_name (credit time, low-budget cache-first)
- Billed party name (creation time)

## Passthrough address

```ts
class PassthroughAddressScreeningProvider {
  async screenAddress(req) {
    return { provider: 'passthrough', decision: 'unscreened', raw: {...}, screened_at: now }
  }
}
```

Done in an hour. Worker-side handling (`unscreened` → admin queue per env policy) lives in Wave 4.

## Provider adapter structure

Each adapter:

```
libs/providers/<name>/
  index.ts           exports the implementing class
  signing.ts         provider-specific crypto (PayKKa RSA, Paystack HMAC, etc.)
  client.ts          HTTP client wrapper with retry + timeout
  parsers.ts         normalize provider payloads to our shared types
  errors.ts          provider-specific error → typed exceptions
  fixtures/          recorded request/response for tests
  *.test.ts          contract tests against fixtures + (optional) live sandbox tests
```

## Definition of done

- [ ] All six adapters implement their interface and pass contract tests
- [ ] PayKKa signing produces a known-good signature against Lin's test vector
- [ ] PayKKa callback verification round-trips against a recorded fixture
- [ ] Paystack PWT charge creates a real virtual account in sandbox; webhook signature verifies
- [ ] Dojah session can be created in sandbox; widget renders in `apps/dashboard` placeholder; webhook fires through and verifies
- [ ] Globalstack quote+order work in sandbox
- [ ] ComplyAdvantage search returns expected results for a known PEP and a clean name
- [ ] All provider secrets are read from Doppler, never hard-coded
- [ ] All adapters have explicit timeout + retry behavior; no infinite waits

## Risks

- **PayKKa signing canonicalization may differ from our reading**. Mitigated by demanding test vectors before writing the adapter.
- **Paystack PWT activation timeline** depends on Paystack's onboarding queue.
- **Globalstack sandbox quality** unknown — partner relationship still being formalized.
- **Dojah Africa-region coverage** for ID types may have surprises (e.g. some doc types unsupported in some countries). Catalog at adapter level.
- **ComplyAdvantage cost**: per-search pricing — we may want to cache aggressively. Cache key: subject normalized fingerprint (`name + dob + country`) with a TTL aligned to monthly re-screen.

## Out of scope

- Worker integration of these adapters (Wave 2+)
- Frontend integration of Dojah widget beyond placeholder mount (Wave 3)
- Real production credentials (Wave 5)
