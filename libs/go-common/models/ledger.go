// Package models provides shared domain types for Propeller Go services.
package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ── Account types ──

type AccountType string

const (
	AccountPaystackSuspense      AccountType = "paystack_suspense"
	AccountPaystackFees          AccountType = "paystack_fees"
	AccountPropellerRevenue      AccountType = "propeller_revenue"
	AccountGlobalstackSuspense   AccountType = "globalstack_suspense"
	AccountGlobalstackFees       AccountType = "globalstack_fees"
	AccountFxSettled             AccountType = "fx_settled"
	AccountBusinessCollected     AccountType = "business_collected"
	AccountBusinessPayoutPending AccountType = "business_payout_pending"
)

// AccountConstraint controls TB-level balance flags on the account.
//
//	NonNegative — DebitsMustNotExceedCredits. Asset/revenue/fee accounts
//	              that should never go below zero. TB rejects the transfer
//	              with TransferExceedsCredits and we map that to
//	              ErrInsufficientFunds at the API boundary.
//	NonPositive — CreditsMustNotExceedDebits. Liability-style accounts.
//	Unbounded   — no flag. Allows arbitrary signed balance. Used for
//	              FX-settlement-style accounts that legitimately swing
//	              negative during a settlement window.
type AccountConstraint string

const (
	ConstraintNonNegative AccountConstraint = "non_negative"
	ConstraintNonPositive AccountConstraint = "non_positive"
	ConstraintUnbounded   AccountConstraint = "unbounded"
)

// Constraint returns the balance-direction constraint for the account type.
// Defaults to NonNegative — when in doubt, money cannot disappear.
func (a AccountType) Constraint() AccountConstraint {
	switch a {
	case AccountFxSettled:
		// Settlement contra: legitimately negative during the FX window.
		return ConstraintUnbounded
	default:
		return ConstraintNonNegative
	}
}

// Code returns the TB account Code (uint16) used for downstream reporting.
// Codes are stable and per-type. Reserve 0 for "unset / invalid".
func (a AccountType) Code() uint16 {
	switch a {
	case AccountPaystackSuspense:
		return 10
	case AccountPaystackFees:
		return 11
	case AccountPropellerRevenue:
		return 12
	case AccountGlobalstackSuspense:
		return 20
	case AccountGlobalstackFees:
		return 21
	case AccountFxSettled:
		return 30
	case AccountBusinessCollected:
		return 100
	case AccountBusinessPayoutPending:
		return 101
	default:
		return 1
	}
}

// ── Balance (Mongo mirror of TB account) ──

type LedgerBalance struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Object          string             `bson:"object" json:"object"`
	BusinessID      string             `bson:"businessId,omitempty" json:"businessId,omitempty"`
	AccountType     string             `bson:"accountType" json:"accountType"`
	TBAccountID     string             `bson:"tbAccountId" json:"tbAccountId"`
	Currency        string             `bson:"currency" json:"currency"`
	Available       int64              `bson:"available" json:"available"`
	AvailableChange int64              `bson:"availableChange" json:"availableChange"`
	Meta            BalanceMeta        `bson:"_meta" json:"_meta"`
	CreatedAt       time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// ── BalanceLog (hash-chained immutable snapshot) ──

type LedgerBalanceLog struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Object          string             `bson:"object" json:"object"`
	BalanceID       primitive.ObjectID `bson:"balanceId" json:"balanceId"`
	Currency        string             `bson:"currency" json:"currency"`
	Available       int64              `bson:"available" json:"available"`
	AvailableChange int64              `bson:"availableChange" json:"availableChange"`
	BalanceBefore   int64              `bson:"balanceBefore" json:"balanceBefore"`
	Transaction     string             `bson:"transaction" json:"transaction"`
	Mode            string             `bson:"mode" json:"mode"`
	Meta            BalanceMeta        `bson:"_meta" json:"_meta"`
	CreatedAt       time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// ── Transfer types ──

// SystemOwner is the sentinel owner ID for system-level accounts
// (paystack_suspense, propeller_revenue, fx_settled, etc.). Business
// accounts use the business's stable ID.
const SystemOwner = "system"

// TransferLegRequest is one debit/credit pair within a TransferRequest.
//
// Debit and credit sides may belong to different owners — a typical
// payment-collection leg debits `system:paystack_suspense` and credits
// `business:abc123:business_collected`. Use SystemOwner for system accounts.
type TransferLegRequest struct {
	DebitOwnerID      string      `json:"debitOwnerId"`      // owner of the debit account ("system" or businessID)
	DebitAccountType  AccountType `json:"debitAccountType"`
	CreditOwnerID     string      `json:"creditOwnerId"`     // owner of the credit account
	CreditAccountType AccountType `json:"creditAccountType"`
	Amount            uint64      `json:"amount"`            // in minor units (kobo for NGN, cents for USDC)
}

// TransferRequest groups one or more legs into an atomic TB transaction.
//
// Currency drives the TB Ledger ID; LedgerCode classifies the transfer
// purpose (1=settlement, 2=fee, 3=reversal, etc.) for downstream reporting.
// All legs in one request must share the same Currency/LedgerCode.
type TransferRequest struct {
	TransactionID  string               `json:"transactionId"`
	Reference      string               `json:"reference"`
	Currency       string               `json:"currency"`       // "NGN", "USDC", ...
	LedgerCode     uint32               `json:"ledgerCode"`     // see ledger.Code* constants; 0 → 1 (default)
	Legs           []TransferLegRequest `json:"legs"`
	TimelineAction string               `json:"timelineAction"`
}
