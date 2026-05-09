//
// Architecture:
//
//	TigerBeetle  → source of financial truth (immutable double-entry transfers)
//	MongoDB      → queryable audit trail (balance + balance_history, hash-chained)
//	Outbox       → crash-safe coordinator between TB and Mongo
//	Mutex        → flo-KV distributed lock for compound operations
//
// Every ExecuteTransfer call is idempotent on (reference, legIndex) — TB
// rejects duplicate transfers natively, and the Mongo audit dedupes by
// _meta.signature. Crash recovery is handled by the outbox reaper.
//
// Multi-currency: each currency maps to a distinct TB ledger ID
// (NGN=1, USDC=2). All legs in a single TransferRequest must share the
// same currency — TB rejects cross-ledger transfers.
package ledger

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/propeller/propeller/libs/go-common/models"
	repomongo "github.com/propeller/propeller/libs/go-database/mongo"

	tb "github.com/tigerbeetle/tigerbeetle-go"
	tbtypes "github.com/tigerbeetle/tigerbeetle-go/pkg/types"

	"github.com/propeller/propeller/services/core/internal/outbox"
)

// ── Currency / ledger code constants ──

// TB Ledger IDs — one per currency. All transfer legs must share a ledger.
const (
	LedgerNGN  uint32 = 1
	LedgerUSDC uint32 = 2
)

// TB transfer Code — classifies the transfer purpose for downstream reporting.
const (
	CodeSettlement uint32 = 1
	CodeFee        uint32 = 2
	CodeReversal   uint32 = 3
	CodeReserve    uint32 = 4
)

// CurrencyToLedger maps an ISO-style currency code to the TB ledger ID.
func CurrencyToLedger(currency string) (uint32, error) {
	switch currency {
	case "NGN":
		return LedgerNGN, nil
	case "USDC":
		return LedgerUSDC, nil
	default:
		return 0, fmt.Errorf("ledger: unsupported currency %q", currency)
	}
}

// ── Public errors ──

// ErrInsufficientFunds is returned when a TB transfer is rejected because
// it would push an account past its DebitsMustNotExceedCredits (or
// CreditsMustNotExceedDebits) constraint. Map this to HTTP 422 at the API
// boundary — it is a business error, not an infrastructure error.
var ErrInsufficientFunds = errors.New("ledger: insufficient funds")

// ErrIdempotencyCollision re-exports outbox.ErrIdempotencyCollision so
// callers do not need to import the outbox package just to detect it.
var ErrIdempotencyCollision = outbox.ErrIdempotencyCollision

// ── Response types ──

// ExecuteTransferResponse is returned from ExecuteTransfer so that the
// orchestration layer (transactions service, payment service, payout
// service …) can wire the per-leg balance log IDs into its own domain
// records. The ledger never touches transaction documents directly.
//
// Balance log IDs are deterministic on (transactionID, legIndex, side),
// so a replay (whether by an HTTP retry or by the reaper) returns the
// exact same IDs — the caller can store them eagerly without worrying
// about reconciliation.
type ExecuteTransferResponse struct {
	TransactionID  string       `json:"transactionId"`
	AlreadyApplied bool         `json:"alreadyApplied"` // true on idempotent replay
	AppliedAt      time.Time    `json:"appliedAt"`
	Legs           []LegResult  `json:"legs"`
}

// LegResult is the per-leg outcome of an ExecuteTransfer call. The two
// balance log IDs point into balance_history; the TBTransferID is the
// canonical TB record for cross-system reconciliation.
type LegResult struct {
	LegIndex           int                `json:"legIndex"`
	DebitBalanceLogID  primitive.ObjectID `json:"debitBalanceLogId"`
	CreditBalanceLogID primitive.ObjectID `json:"creditBalanceLogId"`
	DebitAccountID     string             `json:"debitAccountId"`
	CreditAccountID    string             `json:"creditAccountId"`
	TBTransferID       string             `json:"tbTransferId"`
	Amount             uint64             `json:"amount"`
}

// ── Ledger ──

// Ledger is the dual-store coordinator. Construct with New, close with Close.
type Ledger struct {
	tb     tb.Client
	mongo  *mongo.Database
	outbox *outbox.Store

	balancesRepo    *repomongo.LedgerRepository
	balanceLogsRepo *repomongo.MongoRepository
}

// New connects to TigerBeetle and binds the Mongo collections.
//
//	tbAddrs       = replica addresses, e.g. []string{"3000"}.
//	clusterID     = TB cluster identifier (encoded as Uint128).
func New(tbAddrs []string, clusterID uint64, db *mongo.Database) (*Ledger, error) {
	client, err := tb.NewClient(tbtypes.ToUint128(clusterID), tbAddrs)
	if err != nil {
		return nil, err
	}
	return &Ledger{
		tb:              client,
		mongo:           db,
		outbox:          outbox.NewStore(db.Collection("ledger_outbox")),
		balancesRepo:    repomongo.NewLedgerRepository(db.Collection("balances")),
		balanceLogsRepo: repomongo.NewMongoRepository(db.Collection("balance_history")),
	}, nil
}

// Close releases the TB client.
func (l *Ledger) Close() { l.tb.Close() }

// ── Deterministic ID helpers ──

// AccountID returns a deterministic TB account ID from (ownerID, accountType,
// currency). Two distinct currencies for the same business produce distinct
// accounts because TB requires per-ledger account IDs.
func AccountID(ownerID string, accountType models.AccountType, currency string) tbtypes.Uint128 {
	return hashToUint128(ownerID + ":" + string(accountType) + ":" + currency)
}

// TransferID returns a deterministic TB transfer ID for idempotent retries.
func TransferID(ref string, legIndex int) tbtypes.Uint128 {
	return hashToUint128(ref + ":" + strconv.Itoa(legIndex))
}

// ReverseTransferID returns a deterministic ID for a transfer that reverses
// (ref, legIndex). Distinct from TransferID, replay-safe.
func ReverseTransferID(ref string, legIndex int) tbtypes.Uint128 {
	return hashToUint128(ref + ":" + strconv.Itoa(legIndex) + ":reverse")
}

// balanceLogID returns a deterministic Mongo ObjectID for the balance_history
// row written for (transactionID, legIndex, side). Determinism means a
// replay — by HTTP retry or by the outbox reaper — produces the same _id
// every time, so callers that stored the ID on a domain record do not see
// it change after a crash-recovery.
func balanceLogID(txnID string, legIdx int, side string) primitive.ObjectID {
	h := sha256.Sum256([]byte("balanceLog:" + txnID + ":" + strconv.Itoa(legIdx) + ":" + side))
	var oid [12]byte
	copy(oid[:], h[:12])
	return primitive.ObjectID(oid)
}

// ── Core: Transfer ──

// ExecuteTransfer is the single write-path entry point. It records intent
// in the outbox, then applies the TB transfer (idempotent), then writes the
// Mongo audit trail. A crash at any point is recoverable by the reaper.
//
// Returns ExecuteTransferResponse with per-leg balance log IDs. On a true
// replay (transactionID already done), AlreadyApplied=true and the IDs are
// the same as the original call — deterministic on (transactionID, leg, side).
//
// Errors of note:
//   - ErrInsufficientFunds        — TB rejected: account constraint hit (HTTP 422).
//   - ErrIdempotencyCollision     — transactionID reused for a different
//                                   movement; caller must use a new ID.
//   - all other errors            — transient infrastructure, safe to retry
//                                   with the same transactionID.
//
// Concurrency: Mongo balance updates use $inc, so concurrent transfers on
// the same account compose correctly. For higher-level guards (e.g. "only
// debit if available >= amount + reserve floor"), wrap the call with
// libs/go-mutex — the TB constraint enforces zero floor; anything above
// zero needs application-level coordination.
func (l *Ledger) ExecuteTransfer(ctx context.Context, req models.TransferRequest) (*ExecuteTransferResponse, error) {
	if len(req.Legs) == 0 {
		return nil, errors.New("ledger: transfer must have at least one leg")
	}
	if req.Currency == "" {
		return nil, errors.New("ledger: currency is required")
	}
	ledgerID, err := CurrencyToLedger(req.Currency)
	if err != nil {
		return nil, err
	}
	code := req.LedgerCode
	if code == 0 {
		code = CodeSettlement
	}

	// 1. Record intent in the outbox (idempotent on TransactionID; rejects
	//    a payload-hash mismatch with ErrIdempotencyCollision).
	entry, err := l.outbox.Record(ctx, &outbox.Entry{
		TransactionID: req.TransactionID,
		Reference:     req.Reference,
		Currency:      req.Currency,
		LedgerCode:    code,
		Legs:          req.Legs,
	})
	if err != nil {
		return nil, fmt.Errorf("ledger: outbox record: %w", err)
	}
	if entry.Status == outbox.StatusDone {
		return buildResponse(req, entry, true), nil
	}
	if entry.Status == outbox.StatusFailed {
		return nil, fmt.Errorf("ledger: entry dead-lettered: %s", entry.LastError)
	}

	if err := l.apply(ctx, entry, req, ledgerID, code); err != nil {
		return nil, err
	}
	return buildResponse(req, entry, false), nil
}

// buildResponse derives the per-leg result entirely from deterministic
// inputs — no extra storage required for replay correctness.
func buildResponse(req models.TransferRequest, entry *outbox.Entry, alreadyApplied bool) *ExecuteTransferResponse {
	legs := make([]LegResult, len(req.Legs))
	for i, leg := range req.Legs {
		legs[i] = LegResult{
			LegIndex:           i,
			DebitBalanceLogID:  balanceLogID(req.TransactionID, i, "debit"),
			CreditBalanceLogID: balanceLogID(req.TransactionID, i, "credit"),
			DebitAccountID:     AccountID(leg.DebitOwnerID, leg.DebitAccountType, req.Currency).String(),
			CreditAccountID:    AccountID(leg.CreditOwnerID, leg.CreditAccountType, req.Currency).String(),
			TBTransferID:       TransferID(req.Reference, i).String(),
			Amount:             leg.Amount,
		}
	}
	return &ExecuteTransferResponse{
		TransactionID:  req.TransactionID,
		AlreadyApplied: alreadyApplied,
		AppliedAt:      entry.UpdatedAt,
		Legs:           legs,
	}
}

// apply runs the TB + Mongo side-effects for an outbox entry. Used by both
// ExecuteTransfer and the reaper. Dead-letters entries past MaxAttempts.
func (l *Ledger) apply(ctx context.Context, entry *outbox.Entry, req models.TransferRequest, ledgerID, code uint32) error {
	if entry.Attempts >= outbox.MaxAttempts {
		_ = l.outbox.MarkFailed(ctx, entry.ID, fmt.Sprintf("exceeded MaxAttempts=%d", outbox.MaxAttempts))
		return fmt.Errorf("ledger: entry dead-lettered after %d attempts", entry.Attempts)
	}

	// 2. TB transfer (idempotent: returns TransferExists on retry).
	if entry.Status == outbox.StatusPending {
		if err := l.applyTB(req, ledgerID, code); err != nil {
			// Insufficient-funds is a permanent business error — dead-letter
			// immediately, do not waste reaper cycles on it.
			if errors.Is(err, ErrInsufficientFunds) {
				_ = l.outbox.MarkFailed(ctx, entry.ID, err.Error())
				return err
			}
			_ = l.outbox.IncAttempt(ctx, entry.ID, err.Error())
			return fmt.Errorf("ledger: tb apply: %w", err)
		}
		if err := l.outbox.MarkTBDone(ctx, entry.ID); err != nil {
			return fmt.Errorf("ledger: outbox mark tb_done: %w", err)
		}
		entry.Status = outbox.StatusTBDone
	}

	// 3. Mongo audit trail (idempotent: dedupes by signature).
	if err := l.applyMongo(ctx, req); err != nil {
		_ = l.outbox.IncAttempt(ctx, entry.ID, err.Error())
		return fmt.Errorf("ledger: mongo apply: %w", err)
	}

	// 4. Mark done.
	return l.outbox.MarkDone(ctx, entry.ID)
}

func (l *Ledger) applyTB(req models.TransferRequest, ledgerID, code uint32) error {
	transfers := make([]tbtypes.Transfer, len(req.Legs))
	linked := len(req.Legs) > 1
	for i, leg := range req.Legs {
		var flags tbtypes.TransferFlags
		// Linked applies to all but the last leg in the chain.
		if linked && i < len(req.Legs)-1 {
			flags.Linked = true
		}
		transfers[i] = tbtypes.Transfer{
			ID:              TransferID(req.Reference, i),
			DebitAccountID:  AccountID(leg.DebitOwnerID, leg.DebitAccountType, req.Currency),
			CreditAccountID: AccountID(leg.CreditOwnerID, leg.CreditAccountType, req.Currency),
			Amount:          tbtypes.ToUint128(leg.Amount),
			Ledger:          ledgerID,
			Code:            uint16(code),
			Flags:           flags.ToUint16(),
		}
	}
	results, err := l.tb.CreateTransfers(transfers)
	if err != nil {
		return err
	}
	for _, r := range results {
		switch r.Result {
		case tbtypes.TransferOK, tbtypes.TransferExists:
			// success / idempotent replay
		case tbtypes.TransferExceedsCredits, tbtypes.TransferExceedsDebits:
			// Account constraint hit — business error, surface as typed.
			return fmt.Errorf("%w (leg=%d, result=%v)", ErrInsufficientFunds, r.Index, r.Result)
		default:
			return &TransferError{Index: r.Index, Result: r.Result}
		}
	}
	return nil
}

func (l *Ledger) applyMongo(ctx context.Context, req models.TransferRequest) error {
	now := primitive.NewDateTimeFromTime(time.Now().UTC())

	for i, leg := range req.Legs {
		amount := int64(leg.Amount)

		// Debit side: atomic $inc, signature includes leg index + side
		// (so concurrent legs cannot collide on the same signature).
		debitSig := signature(req.TransactionID, i, "debit")
		debitLogID := balanceLogID(req.TransactionID, i, "debit")
		if err := l.applyLegSide(
			ctx,
			AccountID(leg.DebitOwnerID, leg.DebitAccountType, req.Currency),
			-amount,
			debitSig,
			debitLogID,
			now,
		); err != nil && !errors.Is(err, repomongo.ErrSignatureExists) {
			return err
		}

		// Credit side
		creditSig := signature(req.TransactionID, i, "credit")
		creditLogID := balanceLogID(req.TransactionID, i, "credit")
		if err := l.applyLegSide(
			ctx,
			AccountID(leg.CreditOwnerID, leg.CreditAccountType, req.Currency),
			amount,
			creditSig,
			creditLogID,
			now,
		); err != nil && !errors.Is(err, repomongo.ErrSignatureExists) {
			return err
		}
	}
	return nil
}

func (l *Ledger) applyLegSide(
	ctx context.Context,
	tbID tbtypes.Uint128,
	delta int64,
	sig string,
	logID primitive.ObjectID,
	now primitive.DateTime,
) error {
	bal, err := l.findBalance(ctx, tbID)
	if err != nil {
		return err
	}

	_, err = l.balancesRepo.LedgerUpdateById(bal.ID, bson.M{
		"$inc": bson.M{"available": delta},
		"$set": bson.M{
			"availableChange": delta,
			"updatedAt":       now.Time(),
		},
	}, &repomongo.LedgerWriteOptions{
		InsertionId: &logID,
		TxTime:      &now,
		Signature:   &sig,
	})
	return err
}

// ── Lifecycle ──

// EnsureIndexes provisions the indexes the ledger relies on (currently the
// outbox uniqueness + scan indexes). Idempotent; call once on bootstrap.
func (l *Ledger) EnsureIndexes(ctx context.Context) error {
	return l.outbox.EnsureIndexes(ctx)
}

// ── Recovery ──

// Reap retries outbox entries stuck in pending or tb_done. Call periodically
// from a goroutine. Idempotent — safe to run concurrently with live writes.
func (l *Ledger) Reap(ctx context.Context, olderThan time.Duration, batchSize int64) (int, error) {
	stuck, err := l.outbox.Stuck(ctx, olderThan, batchSize)
	if err != nil {
		return 0, err
	}
	healed := 0
	for i := range stuck {
		entry := &stuck[i]
		ledgerID, lerr := CurrencyToLedger(entry.Currency)
		if lerr != nil {
			_ = l.outbox.MarkFailed(ctx, entry.ID, lerr.Error())
			continue
		}
		req := models.TransferRequest{
			TransactionID: entry.TransactionID,
			Reference:     entry.Reference,
			Currency:      entry.Currency,
			LedgerCode:    entry.LedgerCode,
			Legs:          entry.Legs,
		}
		if err := l.apply(ctx, entry, req, ledgerID, entry.LedgerCode); err == nil {
			healed++
		}
	}
	return healed, nil
}

// ── Queries ──

// GetBalance reads the current balance projection for an account.
func (l *Ledger) GetBalance(ctx context.Context, ownerID string, accountType models.AccountType, currency string) (*models.LedgerBalance, error) {
	return l.findBalance(ctx, AccountID(ownerID, accountType, currency))
}

// GetBalanceLogs returns all balance_history entries for a transaction
// (one debit + one credit per leg). Logs are returned in insertion order.
func (l *Ledger) GetBalanceLogs(ctx context.Context, transactionID string) ([]models.LedgerBalanceLog, error) {
	var logs []models.LedgerBalanceLog
	err := l.balanceLogsRepo.Find(ctx, bson.M{
		"_meta.signature": bson.M{"$regex": "^" + transactionID + ":"},
	}, &logs)
	return logs, err
}

// ── Bootstrap ──

// EnsureSystemAccounts is idempotent — TB rejects duplicate creates and
// the Mongo mirror is upserted.
func (l *Ledger) EnsureSystemAccounts(ctx context.Context, currency string) error {
	for _, at := range []models.AccountType{
		models.AccountPaystackSuspense,
		models.AccountPaystackFees,
		models.AccountPropellerRevenue,
		models.AccountGlobalstackSuspense,
		models.AccountGlobalstackFees,
		models.AccountFxSettled,
	} {
		if err := l.ensureAccount(ctx, models.SystemOwner, at, currency); err != nil {
			return err
		}
	}
	return nil
}

// EnsureBusinessAccounts creates the per-business accounts in TB + Mongo.
func (l *Ledger) EnsureBusinessAccounts(ctx context.Context, businessID, currency string) error {
	for _, at := range []models.AccountType{
		models.AccountBusinessCollected,
		models.AccountBusinessPayoutPending,
	} {
		if err := l.ensureAccount(ctx, businessID, at, currency); err != nil {
			return err
		}
	}
	return nil
}

// ── Internal ──

func (l *Ledger) ensureAccount(ctx context.Context, ownerID string, at models.AccountType, currency string) error {
	tbID := AccountID(ownerID, at, currency)
	ledgerID, err := CurrencyToLedger(currency)
	if err != nil {
		return err
	}

	// Per-type balance constraint flag, plus History for replay queries.
	flags := tbtypes.AccountFlags{History: true}
	switch at.Constraint() {
	case models.ConstraintNonNegative:
		flags.DebitsMustNotExceedCredits = true
	case models.ConstraintNonPositive:
		flags.CreditsMustNotExceedDebits = true
		// ConstraintUnbounded — leave both flags unset.
	}

	// TB (idempotent: AccountExists is success-on-replay).
	results, err := l.tb.CreateAccounts([]tbtypes.Account{{
		ID:     tbID,
		Code:   at.Code(),
		Ledger: ledgerID,
		Flags:  flags.ToUint16(),
	}})
	if err != nil {
		return err
	}
	for _, r := range results {
		if r.Result != tbtypes.AccountOK && r.Result != tbtypes.AccountExists {
			return &AccountError{Index: r.Index, Result: r.Result}
		}
	}

	// Mongo mirror (upsert if absent).
	count, _ := l.balancesRepo.Count(bson.M{"tbAccountId": tbID.String()})
	if count > 0 {
		return nil
	}
	now := primitive.NewDateTimeFromTime(time.Now().UTC())
	balID := primitive.NewObjectID()
	_, err = l.balancesRepo.LedgerInsert(bson.M{
		"object":          "balance",
		"ownerId":         ownerID,
		"accountType":     string(at),
		"tbAccountId":     tbID.String(),
		"currency":        currency,
		"available":       int64(0),
		"availableChange": int64(0),
		"createdAt":       now.Time(),
		"updatedAt":       now.Time(),
	}, &repomongo.LedgerWriteOptions{
		OrigId: &balID,
		TxTime: &now,
	})
	return err
}

func (l *Ledger) findBalance(ctx context.Context, id tbtypes.Uint128) (*models.LedgerBalance, error) {
	var b models.LedgerBalance
	err := l.balancesRepo.GetCollection().FindOne(ctx, bson.M{"tbAccountId": id.String()}).Decode(&b)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// ── helpers ──

func hashToUint128(s string) tbtypes.Uint128 {
	h := sha256.Sum256([]byte(s))
	var b [16]byte
	copy(b[:], h[:16])
	return tbtypes.BytesToUint128(b)
}

// signature derives a unique deduplication tag per (txn, leg, side).
// Format: "<transactionID>:<legIndex>:<side>" — used by LedgerRepository
// to reject duplicate writes.
func signature(txnID string, legIndex int, side string) string {
	return txnID + ":" + strconv.Itoa(legIndex) + ":" + side
}

// ── Errors ──

type AccountError struct {
	Index  uint32
	Result tbtypes.CreateAccountResult
}

func (e *AccountError) Error() string {
	return fmt.Sprintf("ledger: account creation failed (index=%d, result=%v)", e.Index, e.Result)
}

type TransferError struct {
	Index  uint32
	Result tbtypes.CreateTransferResult
}

func (e *TransferError) Error() string {
	return fmt.Sprintf("ledger: transfer failed (index=%d, result=%v)", e.Index, e.Result)
}
