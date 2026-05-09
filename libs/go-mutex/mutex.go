// Package mutex provides a distributed mutex backed by Flo KV.
//
// Primitives in use (https://docs.floruntime.io/primitives/kv/):
//   - Put with IfNotExists + TTL → atomic acquire with auto-expiry lease.
//   - Get → returns (value, version) in one round-trip; basis for CAS.
//   - Put with CASVersion        → ownership-verified release / renew.
//   - Get with BlockMS           → waiters wake instantly on version bump.
//   - Begin/Commit transactions  → optional atomic multi-key acquire when
//     caller pins all keys to one shard via
//     WithRoutingKey. Without a routing key,
//     multi-key locks fall back to the
//     per-key-with-rollback path.
//
// Why CAS instead of Delete on release?
//
//	The Go SDK's Delete has no CAS option, and Get→Delete is racy: between
//	the two calls the lease can TTL-expire and be re-acquired, so a naive
//	Delete would evict another owner. We instead CAS-Put a short-TTL
//	tombstone marker — only the true owner can write it, and the short
//	TTL re-opens the slot for IfNotExists.
//
// Why not Touch for renew?
//
//	Touch has no CAS option in the SDK, so a verify-then-touch sequence
//	is racy in the same way. CAS-Put with the same tag and a fresh TTL
//	is the only safe heartbeat.
//
// Usage:
//
//	m := mutex.New(floClient)
//	if err := m.Lock(ctx, "ledger:business:abc123"); err != nil {
//	    return err
//	}
//	defer m.Unlock(ctx)
package mutex

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	flo "github.com/floruntime/flo-go"
)

const (
	keyPrefix = "_mutex:"

	defaultTTL        = 30 * time.Second
	defaultMaxRetries = 6
	defaultBlockMS    = 5000
)

var (
	ErrNoKeys      = errors.New("mutex: no keys provided")
	ErrDuplicates  = errors.New("mutex: duplicate keys not allowed")
	ErrAcquireFail = errors.New("mutex: could not acquire lock after retries")
	ErrNotOwner    = errors.New("mutex: not the lock owner")
)

// Mutex is a single-use distributed lock over one or more keys.
// Lock all keys atomically (or fail) and release them with Unlock.
type Mutex struct {
	flo  *flo.Client
	keys []string
	tag  string // random ownership tag

	ttl        time.Duration
	maxTries   int
	blockMS    uint32
	routingKey string // when set, multi-key acquire uses a KV transaction
}

// Option mutates a Mutex on construction.
type Option func(*Mutex)

// WithTTL sets the lock expiry. Default 30s.
func WithTTL(d time.Duration) Option { return func(m *Mutex) { m.ttl = d } }

// WithMaxRetries caps retry attempts when contention is detected. Default 6.
func WithMaxRetries(n int) Option { return func(m *Mutex) { m.maxTries = n } }

// WithBlockMS sets how long to long-poll for a release notification per retry.
func WithBlockMS(ms uint32) Option { return func(m *Mutex) { m.blockMS = ms } }

// WithRoutingKey pins every lock key to the same Flo KV shard so that
// multi-key acquire/release can run inside a single KV transaction (one
// Raft entry, true atomic all-or-nothing — no partial-acquire rollback).
//
// Required when calling Lock with >1 key and you need transactional
// semantics. Without it, multi-key locks use the per-key-with-rollback
// path, which is correct but not single-Raft-entry atomic.
func WithRoutingKey(rk string) Option { return func(m *Mutex) { m.routingKey = rk } }

// New constructs a fresh mutex bound to the given flo client.
func New(client *flo.Client, opts ...Option) *Mutex {
	m := &Mutex{
		flo:      client,
		ttl:      defaultTTL,
		maxTries: defaultMaxRetries,
		blockMS:  defaultBlockMS,
	}
	for _, o := range opts {
		o(m)
	}
	return m
}

// Lock acquires all keys atomically. If any single key cannot be locked,
// any partially acquired keys are released and the call retries with
// long-poll backoff until ErrAcquireFail.
func (m *Mutex) Lock(ctx context.Context, keys ...string) error {
	if len(keys) == 0 {
		return ErrNoKeys
	}
	if hasDuplicates(keys) {
		return ErrDuplicates
	}

	m.keys = keys
	m.tag = randomTag()

	return m.tryLock(ctx, 0)
}

func (m *Mutex) tryLock(ctx context.Context, attempt int) error {
	var (
		ok  bool
		err error
	)
	switch {
	case len(m.keys) > 1 && m.routingKey != "":
		ok, err = m.tryLockTxn()
	default:
		ok, err = m.tryLockPerKey(ctx)
	}
	if err != nil {
		return err
	}
	if ok {
		return nil
	}

	if attempt >= m.maxTries {
		return fmt.Errorf("%w: keys=%v", ErrAcquireFail, m.keys)
	}
	m.waitForRelease(ctx)
	return m.tryLock(ctx, attempt+1)
}

// tryLockPerKey acquires keys one-at-a-time with rollback on partial failure.
// Used for single-key locks and for multi-key locks without a routing key.
func (m *Mutex) tryLockPerKey(ctx context.Context) (bool, error) {
	acquired := make([]string, 0, len(m.keys))
	ttl := uint64(m.ttl.Seconds())

	for _, k := range m.keys {
		_, err := m.flo.KV.Put(prefixKey(k), []byte(m.tag), &flo.PutOptions{
			IfNotExists: true,
			TTLSeconds:  &ttl,
		})
		if err != nil {
			break
		}
		acquired = append(acquired, k)
	}

	if len(acquired) == len(m.keys) {
		return true, nil
	}
	m.releaseKeys(ctx, acquired)
	return false, nil
}

// tryLockTxn acquires all keys inside a single KV transaction pinned to
// m.routingKey. The whole batch commits as one Raft entry or not at all —
// no partial-acquire window, no rollback bookkeeping. Requires that every
// key hash to the same partition (the routing key guarantees this).
func (m *Mutex) tryLockTxn() (bool, error) {
	txn, err := m.flo.KV.Begin(m.routingKey, nil)
	if err != nil {
		return false, err
	}
	ttl := uint64(m.ttl.Seconds())
	for _, k := range m.keys {
		_, err = txn.Put(prefixKey(k), []byte(m.tag), &flo.PutOptions{
			IfNotExists: true,
			TTLSeconds:  &ttl,
		})
		if err != nil {
			_ = txn.Rollback()
			// Contention (one of the keys is held) → not an error,
			// just "failed to acquire this attempt".
			if flo.IsConflict(err) {
				return false, nil
			}
			return false, err
		}
	}
	if _, err := txn.Commit(); err != nil {
		if flo.IsConflict(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// Unlock releases all keys owned by this mutex. Keys not owned by this
// mutex (e.g. expired and re-acquired by someone else) are skipped.
func (m *Mutex) Unlock(ctx context.Context) error {
	if len(m.keys) == 0 {
		return ErrNoKeys
	}
	return m.releaseKeys(ctx, m.keys)
}

func (m *Mutex) releaseKeys(ctx context.Context, keys []string) error {
	var firstErr error
	for _, k := range keys {
		full := prefixKey(k)
		if err := m.releaseOne(full); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}

// releaseOne performs an ownership-verified, CAS-guarded release.
//
// Get returns the current (value, version) in a single round-trip; we
// verify the value matches our owner tag, then issue a Delete with
// IfMatch=version. The CAS-guarded Delete is a single Raft entry and
// fails harmlessly if the lock has TTL-expired and been re-acquired
// since our read (we never evict another holder).
func (m *Mutex) releaseOne(full string) error {
	r, err := m.flo.KV.Get(full, nil)
	if err != nil || r == nil {
		return nil // gone already (TTL) — nothing to release
	}
	if string(r.Value) != m.tag {
		return nil // not ours anymore — leave it alone
	}

	casVer := r.Version
	err = m.flo.KV.Delete(full, &flo.DeleteOptions{IfMatch: &casVer})
	if err != nil && flo.IsConflict(err) {
		// Lost the CAS race — another writer mutated between Get and
		// Delete. Whoever holds it now owns its lifecycle.
		return nil
	}
	return err
}

// waitForRelease long-polls the first contended key for the next version
// change. The CAS-Delete on release writes a tombstone entry that bumps
// the version chain, which wakes a Get with BlockMS even though the key
// is logically gone. We only wait on one key; once it changes we retry
// the full set.
func (m *Mutex) waitForRelease(ctx context.Context) {
	if len(m.keys) == 0 {
		return
	}
	block := m.blockMS
	_, _ = m.flo.KV.Get(prefixKey(m.keys[0]), &flo.GetOptions{BlockMS: &block})
}

// HasLock reports whether all of the given keys are currently held by anyone.
// (It does NOT verify ownership — use this only as a probe.)
func (m *Mutex) HasLock(ctx context.Context, keys ...string) (bool, error) {
	for _, k := range keys {
		r, err := m.flo.KV.Get(prefixKey(k), nil)
		if err != nil {
			return false, err
		}
		if r == nil {
			return false, nil
		}
	}
	return true, nil
}

// Renew extends the TTL on every owned key by m.ttl seconds, but only if
// we are still the owner. This is the safe heartbeat path for long-running
// critical sections.
//
// Implementation: Get to read the current version, then Touch with
// IfMatch=version. The CAS-guarded Touch (flo v0.1.0-dev.15+) is a
// single Raft entry that atomically extends the TTL only if we still hold
// the version we acquired. Returns ErrNotOwner if any key has been
// re-acquired by a different holder. Partial renewals are not rolled
// back — a subsequent Unlock will safely no-op the keys we no longer own.
func (m *Mutex) Renew(ctx context.Context) error {
	if len(m.keys) == 0 {
		return ErrNoKeys
	}
	ttl := uint64(m.ttl.Seconds())

	for _, k := range m.keys {
		full := prefixKey(k)
		r, err := m.flo.KV.Get(full, nil)
		if err != nil || r == nil {
			return ErrNotOwner
		}
		if string(r.Value) != m.tag {
			return ErrNotOwner
		}
		casVer := r.Version
		err = m.flo.KV.Touch(full, ttl, &flo.KVTouchOptions{IfMatch: &casVer})
		if err != nil {
			if flo.IsConflict(err) {
				return ErrNotOwner
			}
			return err
		}
	}
	return nil
}

// ── helpers ──

func prefixKey(k string) string { return keyPrefix + k }

func randomTag() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func hasDuplicates(s []string) bool {
	seen := make(map[string]struct{}, len(s))
	for _, v := range s {
		if _, ok := seen[v]; ok {
			return true
		}
		seen[v] = struct{}{}
	}
	return false
}
