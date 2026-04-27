# Reef Docs

Design documentation for Reef — the China–Africa NGN→USDC payment corridor.

## Reading order

1. **[DESIGN.md](DESIGN.md)** — umbrella design. Architecture, data model, provider abstractions, compliance posture, API surface. Stable; updated on architectural changes only.

2. **Wave docs** — per-wave detailed design. Living documents; expected to evolve as work progresses.

   - [Wave 0 — Foundations](waves/WAVE_0_FOUNDATIONS.md)
   - [Wave 1 — Provider Adapters](waves/WAVE_1_PROVIDERS.md)
   - [Wave 2 — Ledger + Business Onboarding](waves/WAVE_2_LEDGER_ONBOARDING.md)
   - [Wave 3 — Payment Collection](waves/WAVE_3_PAYMENT_COLLECTION.md)
   - [Wave 4 — Payout (NGN → USDC)](waves/WAVE_4_PAYOUT.md)
   - [Wave 5 — Hardening + Ship](waves/WAVE_5_HARDENING.md)

## Conventions

- Wave docs each have a status line, scope, design details, definition-of-done, risks, out-of-scope.
- Sequencing inside v1 is opinionated but not rigid; expect overlap between waves where dependencies allow.
- All scope is v1. v1.x items are listed in Wave 5 "Post-v1" only.

## External references

- [Paystack PWT](paystack-doc.md) — Pay with Transfer reference
- [PayKKa API](https://open-cb-paykka.apifox.cn/main-en/) — KYB provider
- [Flo runtime](http://docs.floruntime.io) — event/stream/KV runtime
- China-Africa MOR Compliance Flow PDF (in repo root)

## Open kickoff items

See [DESIGN.md §16](DESIGN.md#16-open-questions-to-close-before-implementation) for the live list of cross-cutting open questions.
