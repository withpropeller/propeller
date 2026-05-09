# libs/go-mutex

Distributed mutex backed by [Flo KV](https://docs.floruntime.io/primitives/kv/).

## Why

We need to serialize multi-step orchestration on the same business or account
(e.g. "check balance → reserve → call provider"). TigerBeetle handles single
transfers atomically, but compound logic that spans TB + Mongo + an external
HTTP call needs an explicit lock.

## How it works

| Step | Flo KV primitive |
|------|------------------|
| Acquire | `Put(key, ownerTag, IfNotExists=true, TTL=30s)` |
| Release | `Get → check tag → Delete` (TTL is the safety net) |
| Wait for unlock | `Get(key, BlockMS=5000)` — wakes on the next version bump |

The owner tag is a 128-bit random hex string written as the value. Only the
holder can release; expired locks are reclaimed by the next acquirer via
`IfNotExists`.

## Example

```go
m := mutex.New(floClient, mutex.WithTTL(15*time.Second))
if err := m.Lock(ctx, "ledger:biz:abc123", "ledger:biz:abc123:payout"); err != nil {
    return err
}
defer m.Unlock(ctx)

// safe to read-modify-write
```

## Compared to Redis (`_docs/other_issuing_project/.../mutex.go`)

| | Redis pattern | Flo KV pattern |
|---|---|---|
| Acquire | `SETNX` + `EXPIRE` | `Put` with `IfNotExists` + `TTL` |
| Release | Lua `EVALSHA` to atomically compare-and-delete | `Get` ownership check + `Delete` (TTL fallback) |
| Wakeup | `XADD` notification stream + `XREAD BLOCK` | Native — every write bumps the version, `Get BlockMS` returns |
| Cluster safety | Manual; single Redis is SPOF | Raft-replicated, quorum-acknowledged writes |

The flo version is simpler because the version-chain doubles as the wakeup
mechanism — no separate notification stream needed.
