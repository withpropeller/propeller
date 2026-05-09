// Package outbox provides crash-safe persistence for ledger transfers.
//
// The atomicity problem:
//
//	TB write succeeds → process crashes → Mongo audit never written.
//
// Because TB transfer IDs are deterministic (hash of reference + leg index),
// retrying the TB write is safe — it returns TransferExists. The audit trail
// in Mongo, however, has no such replay guarantee on its own.
//
// The outbox solves this by recording the *intent* of every transfer
// before any side-effect:
//
//	1. INSERT outbox row {status: "pending", legs, txnID, reference}
//	2. Execute TB transfer (idempotent via deterministic IDs)
//	3. UPDATE outbox row {status: "tb_done"}
//	4. Execute Mongo balance updates + balance_history entries
//	5. UPDATE outbox row {status: "done"}
//
// A reaper goroutine scans for rows stuck in "pending" or "tb_done" older
// than a threshold and replays from the appropriate step. Because every
// step is idempotent, the reaper can run as often as needed.
package outbox

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/propeller/propeller/libs/go-common/models"
)

// MaxAttempts caps replay before an entry is dead-lettered to status=failed.
// Tuned for a 15s reaper tick: 20 attempts ≈ 5 minutes of transient retries.
const MaxAttempts = 20

// ErrIdempotencyCollision is returned by Record when a row already exists
// for the given TransactionID but its declared work (currency / code / legs)
// does not match the new request. Indicates the caller reused a transaction
// ID for a different movement — never silently succeed in that case.
var ErrIdempotencyCollision = errors.New("outbox: transactionId reused with different payload")

// Status of an outbox row.
type Status string

const (
	StatusPending Status = "pending"  // intent recorded, TB not yet attempted
	StatusTBDone  Status = "tb_done"  // TB transfer applied, Mongo audit pending
	StatusDone    Status = "done"     // both sides committed
	StatusFailed  Status = "failed"   // unrecoverable error, needs manual review
)

// Entry is a single outbox row representing one transfer.
type Entry struct {
	ID            primitive.ObjectID         `bson:"_id,omitempty" json:"id"`
	TransactionID string                     `bson:"transactionId" json:"transactionId"`
	Reference     string                     `bson:"reference"     json:"reference"`
	Currency      string                     `bson:"currency"      json:"currency"`
	LedgerCode    uint32                     `bson:"ledgerCode"    json:"ledgerCode"`
	Legs          []models.TransferLegRequest `bson:"legs"          json:"legs"`
	// PayloadHash is sha256(currency|ledgerCode|legs) used by Record to
	// detect transactionId reuse with a different payload. Computed on
	// insert; compared on every subsequent Record call.
	PayloadHash string    `bson:"payloadHash"   json:"payloadHash"`
	Status      Status    `bson:"status"        json:"status"`
	LastError   string    `bson:"lastError,omitempty" json:"lastError,omitempty"`
	Attempts    int       `bson:"attempts"      json:"attempts"`
	CreatedAt   time.Time `bson:"createdAt"     json:"createdAt"`
	UpdatedAt   time.Time `bson:"updatedAt"     json:"updatedAt"`
}

// hashPayload deterministically hashes the work-defining fields of an entry
// so two callers using the same TransactionID for different movements can
// be detected at Record time.
func hashPayload(currency string, code uint32, legs []models.TransferLegRequest) string {
	payload := struct {
		Currency string                       `json:"c"`
		Code     uint32                       `json:"k"`
		Legs     []models.TransferLegRequest  `json:"l"`
	}{currency, code, legs}
	b, _ := json.Marshal(payload)
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}

// Store persists and queries outbox entries.
type Store struct {
	col *mongo.Collection
}

// NewStore wraps a Mongo collection (typically "ledger_outbox").
func NewStore(col *mongo.Collection) *Store {
	return &Store{col: col}
}

// EnsureIndexes creates the indexes required for at-scale operation:
//   - unique(transactionId) so Record's upsert is genuinely idempotent
//   - (status, updatedAt) so Stuck/Failed scans are bounded
//
// Safe to call repeatedly.
func (s *Store) EnsureIndexes(ctx context.Context) error {
	_, err := s.col.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "transactionId", Value: 1}},
			Options: options.Index().SetUnique(true).SetName("uniq_transactionId"),
		},
		{
			Keys:    bson.D{{Key: "status", Value: 1}, {Key: "updatedAt", Value: 1}},
			Options: options.Index().SetName("status_updatedAt"),
		},
	})
	return err
}

// Record creates a new pending outbox entry. Idempotent on transactionId.
//
// If a row already exists for the same transactionId, Record verifies that
// the new request's currency / ledgerCode / legs match the stored payload
// (PayloadHash equality). On mismatch, it returns ErrIdempotencyCollision
// without mutating anything — protecting against silent divergence when a
// caller accidentally reuses a transactionId for a different movement.
//
// Returns the inserted entry, or the existing matching entry on replay.
func (s *Store) Record(ctx context.Context, e *Entry) (*Entry, error) {
	now := time.Now().UTC()
	e.CreatedAt = now
	e.UpdatedAt = now
	e.Status = StatusPending
	e.Attempts = 0
	e.PayloadHash = hashPayload(e.Currency, e.LedgerCode, e.Legs)
	if e.ID.IsZero() {
		e.ID = primitive.NewObjectID()
	}

	filter := bson.M{"transactionId": e.TransactionID}
	update := bson.M{"$setOnInsert": e}
	opts := options.FindOneAndUpdate().
		SetUpsert(true).
		SetReturnDocument(options.After)

	var existing Entry
	if err := s.col.FindOneAndUpdate(ctx, filter, update, opts).Decode(&existing); err != nil {
		return nil, err
	}
	if existing.PayloadHash != "" && existing.PayloadHash != e.PayloadHash {
		return nil, fmt.Errorf("%w: txnId=%s", ErrIdempotencyCollision, e.TransactionID)
	}
	return &existing, nil
}

// Failed returns entries that have exhausted retries and need human
// attention. Sorted oldest-first so ops can drain the backlog in order.
func (s *Store) Failed(ctx context.Context, limit int64) ([]Entry, error) {
	cur, err := s.col.Find(ctx, bson.M{"status": StatusFailed},
		options.Find().SetLimit(limit).SetSort(bson.M{"updatedAt": 1}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var out []Entry
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// MarkTBDone advances the entry to status=tb_done.
func (s *Store) MarkTBDone(ctx context.Context, id primitive.ObjectID) error {
	return s.update(ctx, id, bson.M{"$set": bson.M{
		"status":    StatusTBDone,
		"updatedAt": time.Now().UTC(),
	}})
}

// MarkDone advances the entry to status=done.
func (s *Store) MarkDone(ctx context.Context, id primitive.ObjectID) error {
	return s.update(ctx, id, bson.M{"$set": bson.M{
		"status":    StatusDone,
		"updatedAt": time.Now().UTC(),
	}})
}

// MarkFailed marks the entry as unrecoverable.
func (s *Store) MarkFailed(ctx context.Context, id primitive.ObjectID, errMsg string) error {
	return s.update(ctx, id, bson.M{
		"$set": bson.M{
			"status":    StatusFailed,
			"lastError": errMsg,
			"updatedAt": time.Now().UTC(),
		},
		"$inc": bson.M{"attempts": 1},
	})
}

// IncAttempt records a recoverable failure (transient error).
func (s *Store) IncAttempt(ctx context.Context, id primitive.ObjectID, errMsg string) error {
	return s.update(ctx, id, bson.M{
		"$set": bson.M{
			"lastError": errMsg,
			"updatedAt": time.Now().UTC(),
		},
		"$inc": bson.M{"attempts": 1},
	})
}

// Stuck returns entries that have been in pending/tb_done for longer than
// the given duration. The reaper uses this to find work to retry.
func (s *Store) Stuck(ctx context.Context, olderThan time.Duration, limit int64) ([]Entry, error) {
	cutoff := time.Now().UTC().Add(-olderThan)
	cur, err := s.col.Find(ctx, bson.M{
		"status":    bson.M{"$in": []Status{StatusPending, StatusTBDone}},
		"updatedAt": bson.M{"$lt": cutoff},
	}, options.Find().SetLimit(limit).SetSort(bson.M{"updatedAt": 1}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []Entry
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *Store) update(ctx context.Context, id primitive.ObjectID, update bson.M) error {
	res, err := s.col.UpdateByID(ctx, id, update)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return errors.New("outbox: entry not found")
	}
	return nil
}
