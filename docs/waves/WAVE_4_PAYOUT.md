# Wave 4 — Payout (NGN → USDC)

**Goal**: super-merchant requests payout, Propeller debits NGN and ships USDC via Globalstack to a destination address. Travel-rule data captured. Address screening (passthrough) in the pipeline.

**Status**: not started
**Estimated effort**: 2 weeks
**Blocks**: Wave 5 (hardening)
**Blocked by**: Wave 3 (need balances to pay out from); Globalstack contract + sandbox

## Scope

1. Payout-destination management (`POST /v1/payout-destinations`).
2. Address screening hook (passthrough provider).
3. Payout-request flow (`POST /v1/payouts`).
4. Payout worker: TB reservation → Globalstack quote → order → settlement.
5. Travel Rule capture and persistence.
6. Admin payout approval queue (4-eyes for above-threshold).
7. Failure path handlers (quote expired, order rejected, timeout).

## Payout destinations

```
POST /v1/payout-destinations
  Idempotency-Key
  body: { chain: 'base' | 'ethereum' | ..., address, label, beneficiary?: { name, vasp_name?, attestation } }
→ { id, address, chain, screening: { decision, screened_at, provider } }
```

Flow:
1. Validate address format (chain-specific).
2. Call `AddressScreeningProvider.screenAddress({ address, chain, asset: 'USDC', direction: 'outbound' })`.
3. Persist with screening result attached.
4. If `decision === 'sanctioned'`: reject creation, return 422.
5. Else persist; addresses with `decision === 'unscreened'` or `'flagged'` are still creatable but tagged for review at payout time.

For self-custody, `beneficiary.attestation` is required (super-merchant declares "this address is mine, beneficiary name = X"). For VASP destinations, capture `vasp_name`; Globalstack handles VASP-to-VASP messaging.

## Payout-request flow

```
POST /v1/payouts
  Idempotency-Key
  body: { amount_ngn, destination_id, payment_purpose, business_id? }
→ { id, status: 'pending_quote' | 'pending_approval', amount_ngn, destination, ... }
```

**Apps API flow**:
1. HMAC auth.
2. Idempotency check.
3. Validate business state, payout capability, destination ownership.
4. Mongo balance check (cheap pre-check).
5. Compliance: re-screen destination (lists may have updated), screen beneficiary name.
6. TB reservation: `business.collected → business.payout_pending` (single transfer, deterministic ID).
7. Persist `payout` doc.
8. Decide approval requirement:
   - amount > threshold (configurable per business risk tier) → `pending_approval`
   - destination `decision === 'unscreened'` and env policy is `manual_review` → `pending_approval`
   - else → `pending_quote`
9. Emit `flo:payout.requested`.
10. Webhook to super-merchant (`payout.requested`).

## Payout worker

Subscribes to:
- `payout.requested`
- `payout.approved` (admin)
- `payout.rejected` (admin)
- `payout.usdc_sent` (Globalstack settlement webhook)

```
on payout.requested:
  if status == pending_approval: wait for payout.approved
  fetch Globalstack quote (with idempotency_key based on payout.id)
  validate quote rate is within configured slippage tolerance
  TB second leg: business.payout_pending → ext.globalstack.suspense (linked transfer)
  persist fx_trade { quote_id, rate, amount_ngn, amount_usdc, expires_at }
  emit flo:payout.ngn_debited
  submit Globalstack order with quote_id + destination + idempotency_key
  webhook to super-merchant (payout.processing)

on payout.usdc_sent (Globalstack webhook):
  TB closing leg: ext.globalstack.suspense → fx.settled
  update payout.status = completed
  persist target_tx_hash on fx_trade
  emit flo:payout.completed
  webhook to super-merchant (payout.completed)

on payout.approved:
  resume from payout.requested

on payout.rejected:
  TB reverse: business.payout_pending → business.collected
  status = rejected
  webhook to super-merchant (payout.failed, reason='rejected_by_admin')

on quote-expired (worker self-detected):
  if order not yet placed:
    TB reverse: business.payout_pending → business.collected
    status = quote_expired
    webhook to super-merchant (payout.failed, reason='quote_expired')

on Globalstack order rejected:
  TB reverse all legs that were posted
  status = failed
  emit flo:payout.failed
  webhook to super-merchant (payout.failed, reason='provider_rejected')

on Globalstack timeout (no settlement after N hours):
  do not auto-revert
  emit flo:payout.timeout → admin investigation queue
  ops contacts Globalstack manually
```

## Travel Rule

For every payout, capture and persist as immutable record:

```
travel_rule_record: {
  payout_id,
  originator: {
    legal_entity?: { billed_party_id?, name, country, address? },
    natural_person: { end_payer_id, name, country, dob?, doc_type?, doc_number_masked? },
    sender_bank: { name, account_masked, country },     # from Paystack
  },
  beneficiary: {
    type: 'self_custody' | 'vasp',
    name,
    address,                                             # wallet
    vasp_name?,                                          # if VASP
    attestation?,                                        # if self-custody
  },
  amount_ngn, amount_usdc, rate,
  globalstack_order_id, target_tx_hash,
  recorded_at,
}
```

**Note**: originator info is composed from the underlying *payment-requests* that funded this payout (FIFO match against business.collected). Multiple payments → multiple natural_person entries; pick representative or keep all. For v1, keep all.

## Admin payout approval queue

`apps/admin` views:
- Pending approvals (sorted by amount desc, then time asc)
- Each item shows:
  - Business + risk tier
  - Amount + destination + screening result + travel-rule data
  - Recent payout history for context
  - Underlying payments funding this payout (with end-payer KYC status)
- Actions: approve / reject / request more info

4-eyes: amounts above a higher threshold require two approvers. Recorded as separate audit events.

## Definition of done

- [ ] Super-merchant adds USDC destination; passthrough screening returns `unscreened`; destination is creatable
- [ ] Super-merchant requests payout; if above threshold, lands in admin queue
- [ ] Admin approves; worker fetches Globalstack quote, posts TB legs, places order
- [ ] Globalstack sandbox confirms USDC delivery; closing leg posts; super-merchant sees `payout.completed`
- [ ] Reject path: admin rejects pending payout; TB legs reverse; balance returns
- [ ] Quote-expired path: simulated; balance returns
- [ ] Travel-rule record persisted for every completed payout
- [ ] Address-screening result is attached to every payout-destination and re-checked at payout time

## Risks

- **Globalstack sandbox quality**: unknown until contract is signed. Build adapter against documented contract; integration tests may need to wait for live sandbox.
- **Quote slippage**: rate moves between quote and order. Define tolerance; reject if exceeded; surface clearly to super-merchant.
- **Atomic multi-leg TB**: linked transfers must be tested for correct rollback semantics under failure (kill the worker mid-flow, ensure no half-state).
- **Travel-rule originator composition**: when one payout draws from many payments, "the originator" is non-trivial. v1 captures all; UX may need refinement.
- **Address screening passthrough**: ensure admin queue is monitored — easy to silently rubber-stamp.

## Out of scope

- Streaming / programmable payouts
- Multi-asset destinations (USDT, etc.) — abstraction supports it; only USDC enabled v1
- Auto-payout schedules
- Real (non-passthrough) address screening — provider procurement post-v1
