# Propeller Money Movement — TigerBeetle Double-Entry Ledger

**Goal**: explain how NGN enters, moves through, and leaves Propeller — with concrete numbers, the accounts involved, and how TigerBeetle's double-entry system guarantees correctness.

---

## Double-Entry in 60 seconds

Every financial movement is a **transfer** with two sides:

| Side | Meaning | Balance effect |
|------|---------|---------------|
| **Debit** | Money leaves this account | Available ↓ |
| **Credit** | Money enters this account | Available ↑ |

The golden rule: **debits = credits, always**. Every transfer must have equal debits and credits. TigerBeetle enforces this at the protocol level — you cannot create an unbalanced transfer.

A transfer groups one or more **legs**. Each leg is one debit + one credit. Multi-leg transfers are atomic (all-or-nothing) when linked.

### Currencies and ledgers

Each currency lives on its own TB **ledger**:

| Currency | TB ledger ID | Held in |
|----------|-------------|---------|
| NGN | 1 | TigerBeetle (kobo) |
| USDC | 2 | On-chain (provider tracks balance) |

v1 of Propeller is **NGN-native** — every business and system account is denominated in NGN. USDC is never held by Propeller; it is the off-ramp destination, settled by Globalstack on-chain. The `fx_settled` contra-account (see below) is how we close the books on USDC outflows without modelling USDC balances internally.

A single `TransferRequest` may contain multiple legs, but **all legs must share the same currency** — TB rejects cross-ledger transfers at the protocol level.

### Why not TB pending transfers?

TigerBeetle has native two-phase transfers (`flags.pending` + `post_pending_transfer`). We use a **userland reservation account** (`business_payout_pending`) instead because:

1. We need a queryable balance per business across the pending window — easier with a normal account than scanning pending transfers.
2. Reversal logic stays uniform (one `ExecuteTransfer` to undo, one to commit) — no special API path.
3. The reservation may live for >1 hour pending Globalstack settlement; TB pending transfers default to a 1-second timeout and require explicit configuration to extend.

If you ever need true atomicity (e.g. card auth/capture), switch that flow to TB's pending transfers — both patterns can coexist.

---

## The Accounts

### System accounts (created once on bootstrap)

| Account | Type | Purpose |
|---------|------|---------|
| `paystack_suspense` | System | NGN received from Paystack, not yet attributed |
| `paystack_fees` | System | Paystack's 1.5% fee accumulation |
| `propeller_revenue` | System | Propeller's 0.5% commission |
| `globalstack_suspense` | System | NGN sent to Globalstack, awaiting settlement |
| `globalstack_fees` | System | Globalstack's processor fees |
| `fx_settled` | System | Contra-account for USDC that left the system |

### Business accounts (one pair per activated business)

| Account | Type | Purpose |
|---------|------|---------|
| `business_collected:<id>` | Business | Net NGN collected for this business (their balance) |
| `business_payout_pending:<id>` | Business | NGN reserved for a pending payout |

### How account IDs work

```go
// Deterministic — same inputs always produce the same TB account ID.
AccountID("business_abc123", "business_collected", "NGN") → 0x3f8a...a1b2
AccountID("business_abc123", "business_payout_pending", "NGN") → 0x7c1d...e5f6
AccountID("system", "paystack_suspense", "NGN") → 0x0001...0001
```

TigerBeetle rejects duplicate account creations — free idempotency.

---

## Flow 1: NGN Inbound via Paystack PWT

### Scenario

A Nigerian payer sends ₦10,000 via bank transfer to a Paystack virtual account.

### What happens

```
Step 1: Paystack webhook → charge.success
  ┌─────────────────────────────────────────────────────┐
  │ Record: { reference: "ref_xyz", amount: 1000000 }   │
  │ (amount is in KOBO: ₦10,000 × 100 = 1,000,000)     │
  └─────────────────────────────────────────────────────┘

Step 2: TB Transfer — credit paystack_suspense
  ┌──────────────────────────────────────────────────────┐
  │ Leg 1:                                               │
  │   Debit:  (no source — this is incoming money)       │
  │   Credit: paystack_suspense          +1,000,000 kobo │
  │                                                      │
  │ The suspense account now holds ₦10,000.              │
  │ No business account touched yet — money is           │
  │ un-attributed until KYB passes.                      │
  └──────────────────────────────────────────────────────┘
```

**Why a suspense account?** The webhook arrives before we've confirmed the business is KYC'd and active. The money sits in suspense until attribution.

```
Step 3: KYB passes → attribute the payment

  TB Transfer (2 legs, linked — atomic):
  ┌──────────────────────────────────────────────────────┐
  │ Leg 1: Paystack fees                                 │
  │   Debit:  paystack_suspense          -15,000 kobo    │
  │   Credit: paystack_fees              +15,000 kobo    │
  │   (1.5% of ₦10,000 = ₦150)                           │
  │                                                      │
  │ Leg 2: Propeller revenue                             │
  │   Debit:  paystack_suspense           -5,000 kobo    │
  │   Credit: propeller_revenue           +5,000 kobo    │
  │   (0.5% of ₦10,000 = ₦50)                            │
  └──────────────────────────────────────────────────────┘

  TB Transfer (1 leg):
  ┌──────────────────────────────────────────────────────┐
  │ Leg 1: Business collection                           │
  │   Debit:  paystack_suspense         -980,000 kobo    │
  │   Credit: business_collected:<id>   +980,000 kobo    │
  │   (₦10,000 - ₦150 - ₦50 = ₦9,800 net to business)   │
  └──────────────────────────────────────────────────────┘

  After this transfer, suspense = 0. Everything is attributed.
```

**Account balances after Step 3:**

```
paystack_suspense:             0 kobo    (emptied)
paystack_fees:            +15,000 kobo  (₦150 accumulated)
propeller_revenue:         +5,000 kobo  (₦50 accumulated)
business_collected:<id>: +980,000 kobo  (₦9,800 — the business's money)
```

### What the API returns

```json
// GET /transactions/txn.ref_xyz?expand=timeline.data.balanceLog

{
  "type": "payment.card.bank-transfer",
  "amount": 1000000,
  "description": "Bank transfer from John Doe",
  "timeline": [
    {
      "action": "initiated", "status": "new",
      "createdAt": "2026-04-29T10:00:00Z"
    },
    {
      "action": "funds-received",
      "status": "pending",
      "data": {
        "balanceLog": {
          "id": "bal.h.abc123",
          "object": "balance.history",
          "currency": "NGN",
          "available": 1000000,
          "availableChange": 1000000,
          "balanceBefore": 0,
          "mode": "credit",
          "transaction": "txn.ref_xyz"
        }
      },
      "createdAt": "2026-04-29T10:00:01Z"
    },
    {
      "action": "fees-deducted",
      "status": "pending",
      "data": {
        "balanceLog": {
          "id": "bal.h.def456",
          "available": 985000,
          "availableChange": -15000,
          "balanceBefore": 1000000,
          "mode": "debit"
        }
      },
      "createdAt": "2026-04-29T10:00:02Z"
    },
    {
      "action": "payment-collected",
      "status": "success",
      "data": {
        "balanceLog": {
          "id": "bal.h.ghi789",
          "available": 980000,
          "availableChange": -5000,
          "balanceBefore": 985000,
          "mode": "debit"
        }
      },
      "createdAt": "2026-04-29T10:00:03Z"
    }
  ]
}
```

---

## Flow 2: USDC Outbound via Globalstack

### Scenario

A business has ₦9,800 collected and wants to off-ramp ₦5,000 to USDC.

### What happens

```
Step 1: Business requests payout
  ┌──────────────────────────────────────────────────────┐
  │ Request: { businessId: "abc123", amount: 500000 }    │
  │ (₦5,000 in kobo)                                     │
  └──────────────────────────────────────────────────────┘

Step 2: Reserve the NGN
  ┌──────────────────────────────────────────────────────┐
  │ TB Transfer:                                         │
  │   Debit:  business_collected:<id>   -500,000 kobo    │
  │   Credit: business_payout_pending:<id> +500,000 kobo │
  │                                                      │
  │ The money is reserved — can't be double-spent.       │
  └──────────────────────────────────────────────────────┘

Step 3: Get FX quote from Globalstack
  ┌──────────────────────────────────────────────────────┐
  │ POST /v1/quote                                       │
  │   { source: "NGN", target: "USDC", amount: 500000 }  │
  │                                                      │
  │ Response:                                            │
  │   { quote_id: "q_123", rate: 0.00065,                │
  │     target_amount: 3.25 USDC, expires_at: "..." }    │
  │                                                      │
  │ The quote_id is persisted on the transaction record  │
  │ (`transaction.providerData.quoteId`) for audit and   │
  │ dispute resolution. The rate is captured in          │
  │ balance_history metadata on Step 6.                  │
  └──────────────────────────────────────────────────────┘

Step 4: Place order with Globalstack
  ┌──────────────────────────────────────────────────────┐
  │ POST /v1/orders                                      │
  │   { quote_id: "q_123", account_number: "...", ... }  │
  │                                                      │
  │ Globalstack processes the off-ramp.                  │
  │ We wait for the settlement webhook.                  │
  └──────────────────────────────────────────────────────┘

Step 5: Globalstack settlement webhook arrives
  ┌──────────────────────────────────────────────────────┐
  │ Webhook: { order_id: "ord_456", status: "completed", │
  │            target_tx_hash: "0xabc...def" }           │
  └──────────────────────────────────────────────────────┘

Step 6: Settle the payout
  TB Transfer (2 legs, linked):
  ┌──────────────────────────────────────────────────────┐
  │ Leg 1: Globalstack fee                               │
  │   Debit:  business_payout_pending:<id> -10,000 kobo  │
  │   Credit: globalstack_fees              +10,000 kobo │
  │   (e.g. 2% processing fee = ₦100)                    │
  │                                                      │
  │ Leg 2: Settle (the NGN is gone from our system)      │
  │   Debit:  business_payout_pending:<id> -490,000 kobo │
  │   Credit: fx_settled                  +490,000 kobo  │
  │                                                      │
  │ fx_settled is a CONTRA account — it represents       │
  │ USDC that has left the NGN ledger. It's not money    │
  │ we hold; it's a bookkeeping entry that preserves     │
  │ the debit = credit invariant.                        │
  └──────────────────────────────────────────────────────┘
```

**Account balances after Step 6:**

```
business_collected:<id>:          +480,000 kobo  (₦9,800 - ₦5,000 = ₦4,800)
business_payout_pending:<id>:            0 kobo  (fully resolved)
globalstack_fees:                   +10,000 kobo  (₦100 accumulated)
fx_settled:                        +490,000 kobo  (contra — USDC side)
```

**What fx_settled means**: TB requires every transfer to be balanced. When NGN leaves our system (sent to Globalstack for USDC conversion), we need somewhere to put the "credit" side. `fx_settled` is that account — it's not real money, it's a bookkeeping entry that says "this much NGN value has been converted to USDC and is no longer in our custody." The actual USDC is on-chain, tracked by the provider, not in TigerBeetle.

---

## Flow 3: Failed Payout Reversal

If Step 5 returns `status: "failed"` instead of `"completed"`:

```
Reversal Transfer (TransferID = hash(reference + ":reverse")):
  Debit:  business_payout_pending:<id> -500,000 kobo
  Credit: business_collected:<id>      +500,000 kobo

The reserve is unwound. Business gets their money back.
No fees charged. No fx_settled entry.
```

**Replay safety**: the reversal transfer ID is derived as `hash(reference + ":reverse")` (see `ReverseTransferID` in `services/core/internal/ledger/ledger.go`). It is distinct from the original reservation transfer ID, so retrying the reversal webhook produces the same TB transfer ID — TB rejects the duplicate, no double-reverse.

---

## Why This Design?

### TigerBeetle is the source of truth

Every account balance can be derived by summing all transfers to/from that account. TB stores every transfer immutably. There is no "update balance" API — you only create transfers, and TB computes balances from the transfer history.

### MongoDB is the queryable view

`balance_history` is a hash-chained audit trail. Every TB transfer produces a `BalanceLog` entry showing:
- `balanceBefore` — what the balance was
- `availableChange` — how much changed
- `available` — the new balance
- `mode` — debit or credit
- `transaction` — link to the orchestration record

This enables `GET /transactions/:id?expand=timeline.data.balanceLog` — showing the full timeline with balance snapshots at each step.

### Idempotency is built in

- **TB account IDs** are hashes of `(ownerID, accountType, currency)` — TB rejects duplicates
- **TB transfer IDs** are hashes of `(reference, legIndex)` — replaying a webhook produces the same transfer ID, TB ignores it
- **Reversal transfer IDs** use `hash(reference + ":reverse")` — distinct from the original, also replay-safe
- **Mongo balance_history** uses `_meta.signature` of `<txnID>:<legIndex>:<side>` — `LedgerRepository` deduplicates so concurrent legs cannot collide

### Crash safety: the outbox

`ExecuteTransfer` is split across two stores (TB + Mongo) and a process can crash between them. The `ledger_outbox` collection records intent **before** any side-effect:

1. Insert outbox row `{status: "pending", legs, txnID}`
2. Apply TB transfer → mark `status: "tb_done"`
3. Apply Mongo balance + balance_history → mark `status: "done"`

A reaper goroutine in the core service scans every 15 seconds for entries stuck in `pending` or `tb_done` for >30 seconds and replays from the appropriate step. Because every step is idempotent, the reaper is safe to run concurrently with live writes.

### Concurrency: distributed mutex via Flo KV

Mongo balance updates use `$inc`, so two concurrent transfers on the same account compose correctly without a lock. For higher-level guards — "only reserve if available >= amount", or any read-then-write that spans multiple stores — handlers acquire a per-business lock via `libs/go-mutex` (backed by Flo KV's `IfNotExists` + TTL primitives). See `libs/go-mutex/README.md`.

### Why suspense accounts?

External money arrives asynchronously (webhooks). The business might not be KYC'd yet. Suspense accounts hold incoming funds until attribution logic runs, keeping the ledger clean.

### Why a separate payout_pending account?

It prevents double-spending during the 1-hour+ window between when a payout is requested and when Globalstack settles. The business can see their collected balance drop immediately, but the money isn't "gone" — it's reserved. If the payout fails, the reserve unwinds atomically.

---

## Account Summary

| Account | Normal balance | Represents |
|---------|---------------|------------|
| `paystack_suspense` | Credit (temporary) | Incoming NGN from Paystack, not yet attributed |
| `paystack_fees` | Credit | Accumulated Paystack processor fees |
| `propeller_revenue` | Credit | Propeller's commission |
| `globalstack_suspense` | Credit (temporary) | NGN sent to Globalstack, awaiting settlement |
| `globalstack_fees` | Credit | Accumulated Globalstack processor fees |
| `fx_settled` | Credit | Contra-account: NGN value converted to USDC |
| `business_collected:<id>` | Credit | Business's available NGN balance |
| `business_payout_pending:<id>` | Credit | NGN reserved for a pending payout |

All accounts are credit-normal (business accounts hold a positive balance). Debit entries reduce them, credit entries increase them.<br>TB requires every transfer to balance: total debits = total credits, always.
