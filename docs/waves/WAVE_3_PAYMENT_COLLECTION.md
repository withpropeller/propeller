# Wave 3 — Payment Collection

**Goal**: end-to-end NGN collection. End-payer arrives at a payment URL, completes KYC if required, sends NIP transfer, sees confirmation. Super-merchant gets a webhook. Money is in TigerBeetle.

**Status**: not started
**Estimated effort**: 2 weeks
**Blocks**: Wave 4 (payout — needs balances), Wave 5 (hardening)
**Blocked by**: Wave 2; Paystack PWT activation; Dojah account ready

## Scope

1. Payment-request creation (API + dashboard).
2. Paystack PWT integration end-to-end.
3. End-payer entity model + "paying-on-behalf-of" disclosure.
4. Dojah widget embedded in dashboard, KYC reuse keyed on the human.
5. Settlement worker: webhook → compliance → TB post → projector.
6. Compliance worker handlers: name-match, sender screening, billed-party screening.
7. Webhook dispatcher to super-merchants (signed, retried).
8. Inbound transfer approval endpoint.
9. Reconciliation worker for Paystack daily settlement.

## Payment-request creation

```
POST /v1/payment-requests
  Idempotency-Key: <uuid>
  body: {
    business_id?,                    # if super-merchant onboarded sub-businesses
    amount,                          # minor units, NGN
    reference,                       # super-merchant's external ref
    end_payer: { email, name?, phone? },
    billed_party?: { name, country, registration_number? },
    payment_purpose,                 # 'trade' | 'service' | 'personal' | ...
    callback_url?,
    expires_in_seconds?,             # default 1800; min 900 (Paystack floor); max 28800
  }
→ {
  id, payment_url,
  virtual_account: { bank, number, name, expires_at },
  expires_at, status: 'pending',
}
```

**Apps API flow**:
1. HMAC auth on super-merchant.
2. Idempotency check.
3. Validate business is `active`, capability `create_payment_requests`.
4. Resolve or create `end_payer` keyed on `(super_merchant_id, email)`.
5. Resolve or create `billed_party` if present.
6. Decide `kyc_required` via rules engine; persist decision (audit).
7. Call Paystack `POST /charge` with PWT.
8. Persist `payment_request` doc with Paystack `reference`, virtual_account, expiry.
9. Emit `flo:payment_request.created`.
10. Webhook dispatcher fires `payment_request.created` to super-merchant.
11. Return response.

## End-payer entity

```ts
end_payer: {
  _id, super_merchant_id, email, normalized_name?, dob?,
  country?, kyc_status: 'none' | 'passed' | 'rejected' | 'review',
  kyc_passed_at?, kyc_expires_at?,
  identity_documents: [...],
  liveness_history: [...],
  sanctions_screened_at?, sanctions_status?,
  third_party_payer_flags: number,
  risk_score,
  aliases: string[],
}
```

KYC reuse: keyed on `_id` (the human), not the payment_request. 180-day window.

## Dashboard payment URL

Vite SPA. Routes:

```
/pay/:token                 main payment view
/pay/:token/kyc             Dojah widget step
/pay/:token/done            success
```

Flow:
1. Token resolves to `payment_request` via `apps/services` REST (`GET /public/payment-requests/:token`).
2. Render: amount, merchant name, billed_party (if present), expiry countdown.
3. If `billed_party` present, ask: "Are you paying on behalf of [billed_party name]? Confirm role: employee / director / authorized signatory / self." Persist as `on_behalf_disclosure`.
4. If `kyc_required`:
   - Show Dojah widget.
   - End-payer completes liveness + ID.
   - On widget callback: UI shows "verifying" spinner.
   - Subscribe to flo stream `compliance` (SSE via `apps/services`) for `customer.kyc_passed` / `customer.kyc_review_required` / `customer.kyc_rejected`.
5. Once KYC clear (or not required): reveal virtual account number.
6. Subscribe to flo stream `payments` for `payment.confirmed` / `payment.rejected`.
7. On confirmation: navigate to `/pay/:token/done`.

## Settlement worker

Subscribes to `flo:payment.received` (emitted by Paystack webhook handler).

```
on payment.received:
  resolve payment_request by paystack reference
  validate amount + currency + status
  call libs/compliance.checkPayment({
    end_payer, billed_party, sender (from paystack.authorization),
    amount, payment_request,
  })
  → result: 'pass' | 'hold' | 'reject'

  if pass:
    compute fees per super-merchant fee schedule
    post TB transfers (linked, atomic):
      ext.paystack.suspense → business.<top_id>.collected   (net)
      ext.paystack.suspense → fee.<business_id>.revenue     (fee)
    transfer IDs hashed from paystack.id + leg_index
    user_data carries sub_business_id + payment_request_id
    emit flo:ledger.posted, flo:payment.confirmed

  if hold:
    create held_payment doc, status='hold', reason
    emit flo:payment.compliance.held → admin queue
    settlement waits on admin action

  if reject:
    initiate refund via Paystack (manual ops action in v1)
    emit flo:payment.compliance.rejected
```

## Compliance check at credit time

`libs/compliance/checkPayment` runs in order:

1. **Sanctions on sender_name** (cached lookup).
2. **Name-match**: try (a) end_payer.normalized_name, (b) billed_party.name (if present), (c) end_payer.aliases. Threshold 0.85 fuzzy → pass; 0.6–0.85 → hold; <0.6 → hard fail unless `on_behalf_disclosure` present and billed_party set (then hold).
3. **Third-party payer**: if no match path succeeds and no disclosure, increment `end_payer.third_party_payer_flags`; reject by default unless super-merchant config opts in.
4. **Velocity check**: business has not exceeded daily/monthly cap.

Decision recorded as immutable `compliance_decision` doc.

## Inbound transfer approval

Paystack POSTs sync before posting credit. We have a few seconds.

```
POST /webhooks/paystack/inbound-approval
  body: { transfer_id, amount, sender_name, sender_account, recipient_account, ... }

decision flow (cache-first, no I/O calls > 500ms):
  1. Resolve payment_request by recipient_account (flo KV cache)
  2. Hard fails:
     - sanctioned sender_name (cached list lookup)
     - business suspended
     - payment_request expired/cancelled
     - amount > business.daily_cap
  3. Else: accept (soft cases handled post-credit)

→ { action: "accept" | "reject", reason }
```

## Webhook dispatcher

`workers/webhook-dispatcher` consumes flo streams and POSTs to super-merchants' configured webhooks.

```ts
{
  event_id: monotonic,
  type: 'payment.confirmed',
  created_at,
  data: { payment_request_id, amount, ... },
}
```

Headers:
```
X-Propeller-Signature: HMAC-SHA256 over body
X-Propeller-Event-Id: <event_id>
X-Propeller-Event-Type: <event type>
```

Retry: 0s, 30s, 5m, 30m, 2h, 12h, 24h. Dead-letter to `webhook.dead_letter` queue → admin inspector view.

## Reconciliation worker

Daily job. Subscribes to scheduled flo action `daily.reconciliation`.

For each business:
- Sum credits to `ext.paystack.suspense → business.collected` for the day.
- Compare to Paystack settlement payout we received in our bank account (separate `paystack.settled` event).
- Flag drift > tolerance to admin.

Settlement event closes the suspense:
```
ext.paystack.suspense → ext.bank.<our_bank>.balance   (gross settled)
ext.paystack.suspense → ext.paystack.fees             (their cut)
```

## Definition of done

- [ ] Super-merchant creates payment-request via `/v1/payment-requests`; receives PWT virtual account
- [ ] End-payer opens payment URL; if first-time, completes Dojah KYC; sees virtual account
- [ ] End-payer sends NIP test transfer (Paystack sandbox); webhook arrives
- [ ] Compliance check runs: name-match, sanctions, billed-party screening
- [ ] Pass case: TB transfers post, projector updates Mongo, super-merchant webhook fires
- [ ] Hold case: admin sees in queue, can release/reject; release path resumes
- [ ] Reject case: marked rejected, refund initiation logged
- [ ] `bank.transfer.rejected` event surfaces as `payment.rejected` in dashboard + outbound webhook
- [ ] Inbound transfer approval endpoint passes hard-fail tests against fixtures
- [ ] Daily reconciliation job runs and reports drift in admin dashboard

## Risks

- **Paystack webhook delivery latency** during NIP burst (e.g. month-end). Settlement worker must scale horizontally; flo handles fan-out.
- **Dojah outages** during NIBSS/NIMC downtime — degrade gracefully; expose status to dashboard.
- **Name-match false positives** on common Nigerian names with multiple romanizations. Tune Jaro-Winkler threshold against real data; add manual aliases.
- **Inbound approval timeout**: Paystack budget is tight. Cache aggressively; if cache miss, default to accept and route post-credit.
- **First production money**: have a manual reconciliation runbook for week 1 (someone reads every event by hand against Paystack dashboard).

## Out of scope

- Refund automation (manual ops action in v1)
- Sub-business attribution UI for super-merchants (basic version this wave; nicer rollups in v1.x)
- Multi-currency collection (NGN only)
