package models

import (
	"errors"
	"strings"
	"time"

	"github.com/propeller/propeller/libs/go-common/helpers"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	ErrInsufficientBalance      = errors.New("insufficient balance")
	ErrMemberAllocationExceeded = errors.New("member allocation exceeded")
	ErrGettingBalance           = errors.New("error getting balance")
	ErrMaxRetriesExceeded       = errors.New("max retries exceeded")
)

type TransactionModeType string
type TransactionTypeType string
type TransactionProcessorType string
type TransactionStatusType string

const (
	TransactionModeCredit TransactionModeType = "credit"
	TransactionModeDebit  TransactionModeType = "debit"
)

const (
	TransactionTypeTransfer                  TransactionTypeType = "transfer"
	TransactionTypePaymentAccountFunding     TransactionTypeType = "payment.account.funding"
	TransactionTypeAccountStablecoinTransfer TransactionTypeType = "payment.account.stablecoin-transfer"
	TransactionTypeBudgetStablecoinTransfer  TransactionTypeType = "payment.budget.stablecoin-transfer"

	// Flo domain.operation types
	TransactionTypePayoutBankTransfer       TransactionTypeType = "payout.bank-transfer"
	TransactionTypePayoutBillPayment        TransactionTypeType = "payout.bill-payment"
	TransactionTypePayoutAchTransfer        TransactionTypeType = "payout.ach-transfer"
	TransactionTypePayoutStablecoinTransfer TransactionTypeType = "payout.stablecoin-transfer"
	TransactionTypeFundingAccountDeposit    TransactionTypeType = "funding.account-deposit"
	TransactionTypeFundingCardFx            TransactionTypeType = "funding.card-fx"
	TransactionTypeInternalBudgetFund       TransactionTypeType = "internal.budget-fund"
	TransactionTypeInternalBudgetWithdraw   TransactionTypeType = "internal.budget-withdraw"
	TransactionTypeInternalBudgetRenewal    TransactionTypeType = "internal.budget-renewal"
	TransactionTypeInternalBudgetRetire     TransactionTypeType = "internal.budget-retire"
	TransactionTypeInternalCardFund         TransactionTypeType = "internal.card-fund"
	TransactionTypeInternalCardWithdraw     TransactionTypeType = "internal.card-withdraw"
	TransactionTypeInternalCardRenewal      TransactionTypeType = "internal.card-renewal"
	TransactionTypeInternalCardRetire       TransactionTypeType = "internal.card-retire"
	TransactionTypeFloCardSpend             TransactionTypeType = "card.spend"
	TransactionTypeFloCardOrder             TransactionTypeType = "card.order"
	TransactionTypeReversalPayout           TransactionTypeType = "reversal.payout"
)

const (
	TransactionProcessorInfra       TransactionProcessorType = "infra"
	TransactionProcessorBridge      TransactionProcessorType = "bridge"
	TransactionProcessorGlobalStack TransactionProcessorType = "globalstack"
)

const (
	TransactionStatusTypeSuccess  TransactionStatusType = "success"
	TransactionStatusTypeFailed   TransactionStatusType = "failed"
	TransactionStatusTypePending  TransactionStatusType = "pending"
	TransactionStatusTypeReversed TransactionStatusType = "reversed"
)

func IsStablecoinTransferTransactionType(txnType TransactionTypeType) bool {
	return strings.Contains(string(txnType), "stablecoin-transfer")
}

func IsBankTransferTransactionType(txnType TransactionTypeType) bool {
	return strings.Contains(string(txnType), "bank-transfer")
}

func IsAccountFundingTransactionType(txnType TransactionTypeType) bool {
	return txnType == TransactionTypePaymentAccountFunding
}

func IsTransferTransactionType(txnType TransactionTypeType) bool {
	return strings.HasPrefix(string(txnType), string(TransactionTypeTransfer))
}

type TransactionFxQuote struct {
	FromAmount   int64   `bson:"fromAmount,omitempty"`
	FromCurrency string  `bson:"fromCurrency,omitempty"`
	ToAmount     int64   `bson:"toAmount,omitempty"`
	ToCurrency   string  `bson:"toCurrency,omitempty"`
	Rate         float64 `bson:"rate,omitempty"`
	Hash         string  `bson:"hash,omitempty"`
}

type TransactionData struct {
	Card                     *primitive.ObjectID `bson:"card,omitempty"`
	Amount                   int64
	Narration                string
	CardAcceptorNameLocation string
	CardOrder                *primitive.ObjectID `bson:"cardOrder,omitempty"`
	FxFundAmount             *int64              `bson:"fxFundAmount,omitempty"`
	FxAmount                 *int64              `bson:"fxAmount,omitempty"`
	FxCurrency               *string             `bson:"fxCurrency,omitempty"`
	FxRate                   *float64            `bson:"fxRate,omitempty"`
	FxFundFee                *int64              `bson:"fxFundFee,omitempty"`
	FxQuote                  *TransactionFxQuote `bson:"fxQuote,omitempty"`
	Destination              *primitive.ObjectID `bson:"destination,omitempty"`
	DestinationRef           *string             `bson:"destinationRef,omitempty"`
	Beneficiary              *primitive.ObjectID `bson:"beneficiary,omitempty"`
}

type TransactionProcessorData struct {
	DepositAccountNumber string                    `bson:"depositAccountNumber,omitempty"`
	AccountNumber        *string                   `bson:"accountNumber,omitempty"`
	AccountName          *string                   `bson:"accountName,omitempty"`
	BankName             *string                   `bson:"bankName,omitempty"`
	BankCode             *string                   `bson:"bankCode,omitempty"`
	TransactionId        *int64                    `bson:"transactionId,omitempty"`
	Partner              *TransactionProcessorType `bson:"partner,omitempty"`
	Reference            *string                   `bson:"reference,omitempty"`
	SessionId            *string                   `bson:"sessionId,omitempty"`
	Mcc                  *string                   `bson:"mcc,omitempty"`
	BypassDuplicateCheck *bool                     `bson:"bypassDuplicateCheck,omitempty"`
	WorkflowRunId        string                    `bson:"workflowRunId,omitempty"`
}

type TransactionFee struct {
	Type   string `bson:"type"`
	Amount int64  `bson:"amount"`
}

type TransactionPostAction struct {
	ReminderAttempts int       `bson:"reminderAttempts"`
	NextReminderAt   time.Time `bson:"nextReminderAt"`
	Completed        bool      `bson:"completed"`
	Actions          []string  `bson:"actions"`
}

type TransactionAttachment struct {
	Type string      `bson:"type"`
	File interface{} `bson:"file"`
}

type TransactionDelivery struct {
	Rail            string              `bson:"rail"`
	Provider        string              `bson:"provider,omitempty"`
	DeliveryNetwork string              `bson:"deliveryNetwork,omitempty"`
	CorridorCountry string              `bson:"corridorCountry,omitempty"`
	Beneficiary   *primitive.ObjectID `bson:"beneficiary,omitempty"`
	ChainCurrency string              `bson:"chainCurrency,omitempty"`
	ChainNetwork  string              `bson:"chainNetwork,omitempty"`
	ProviderRef     string              `bson:"providerRef,omitempty"`
}

type Transaction struct {
	Id            primitive.ObjectID        `bson:"_id"`
	Mode          TransactionModeType       `bson:"mode"`
	Reference     string                    `bson:"reference"`
	Tags          []primitive.ObjectID      `bson:"tags"`
	Amount        int64                     `bson:"amount"`
	Data          TransactionData           `bson:"data"`
	ProcessorData *TransactionProcessorData `bson:"processorData"`
	Delivery      *TransactionDelivery      `bson:"delivery,omitempty"`
	Fees          int64                     `bson:"fees"`
	FeesBreakdown []TransactionFee          `bson:"feesBreakdown"`
	Currency      string                    `bson:"currency"`
	Description   string                    `bson:"description"`
	Business      primitive.ObjectID        `bson:"business"`
	Status        string                    `bson:"status"`
	Timeline      []TransactionTimeline     `bson:"timeline"`
	Type          string                    `bson:"type"`
	Holding       primitive.ObjectID        `bson:"holding"`
	HoldingRef    string                    `bson:"holdingRef"`
	Owner         primitive.ObjectID        `bson:"owner"`
	OwnerRef      string                    `bson:"ownerRef"`
	FailureReason string                    `bson:"failureReason"`
	Note          string                    `bson:"note,omitempty"`
	VatCode       *string                   `bson:"vatCode,omitempty"`
	PostAction    *TransactionPostAction    `bson:"postAction,omitempty"`
	Attachments   []TransactionAttachment   `bson:"attachments"`
	CreatedAt     time.Time                 `bson:"createdAt"`
	UpdatedAt     time.Time                 `bson:"updatedAt"`
}

func (c *Transaction) NetworkAmountAndFees() int64 {
	transactionFee := helpers.Find(c.FeesBreakdown, func(fee TransactionFee) bool {
		return fee.Type == FeesType.CardNetwork
	})

	if transactionFee != nil {
		return c.Amount + transactionFee.Amount
	}

	return c.Amount
}

func (c *Transaction) AmountAndFees() int64 {
	return c.Amount + c.Fees
}

// GetBreakdownFees returns the amount of a particular fee type in fees breakdown
func (c *Transaction) GetBreakdownFees(feeType string) int64 {
	transactionFee := helpers.Find(c.FeesBreakdown, func(fee TransactionFee) bool {
		return fee.Type == feeType
	})

	if transactionFee != nil {
		return transactionFee.Amount
	}

	return 0
}

func (txn *Transaction) GetTimelineByAction(action string) []TransactionTimeline {
	var timelines []TransactionTimeline
	for _, t := range txn.Timeline {
		if t.Action == action {
			timelines = append(timelines, t)
		}
	}
	return timelines
}

type TransactionNotification struct {
	FirstName     string `json:"firstName"`
	Status        string `json:"status"`
	Type          string `json:"type"`
	Mode          string `json:"mode"`
	Currency      string `json:"currency"`
	Amount        string `json:"amount"`
	Fees          string `json:"fees"`
	AmountAndFees string `json:"amountAndFees"`
	Reference     string `json:"reference"`
	Narration     string `json:"narration"`
}

var TransactionMode = struct {
	Credit string
	Debit  string
}{
	Credit: "credit",
	Debit:  "debit",
}

var TransactionType = struct {
	Charge              string
	Transfer            string
	Payment             string
	Reversal            string
	AccountFunding      string
	CardOrderCharge     string
	CardOrderShipping   string
	CardFxFundingCharge string
	CardSpend           string
	CardRetire          string
	CardFunding         string
	CardLimitRenewal    string
	CardWithdrawal      string
	CardFxWithdrawal    string
	WalletBankTransfer  string
	WalletBillPayment   string
	BudgetLimitRenewal  string
	CardBankTransfer    string
	CardBillPayment     string
}{
	Charge:              "charge",
	Transfer:            "transfer",
	Payment:             "payment",
	Reversal:            "reversal",
	CardOrderCharge:     "charge.card-order",
	CardOrderShipping:   "charge.card-order.shipping",
	CardFxFundingCharge: "charge.card.funding.fx",
	CardRetire:          "transfer.card.retire",
	CardFunding:         "transfer.card.funding",
	CardLimitRenewal:    "transfer.card.limit-renewal",
	CardWithdrawal:      "transfer.card.withdrawal",
	CardFxWithdrawal:    "transfer.card.fx-withdrawal",
	AccountFunding:      "payment.account.funding",
	WalletBankTransfer:  "payment.wallet.bank-transfer",
	WalletBillPayment:   "payment.wallet.bill-payment",
	BudgetLimitRenewal:  "transfer.wallet.limit-renewal",
	CardSpend:           "payment.card.spend",
	CardBankTransfer:    "payment.card.bank-transfer",
	CardBillPayment:     "payment.card.bill-payment",
}

var TransactionProcessor = struct {
	Infra string
}{
	Infra: "infra",
}

var TransactionStatus = struct {
	New      string
	Queued   string
	Blocked  string
	Pending  string
	Failed   string
	Success  string
	Reversed string
}{
	New:      "new",
	Queued:   "queued",
	Blocked:  "blocked",
	Pending:  "pending",
	Failed:   "failed",
	Success:  "success",
	Reversed: "reversed",
}

var BankTransferTransactionTypes = []string{
	TransactionType.WalletBankTransfer,
	TransactionType.CardBankTransfer,
}

var CardSpendTransactionTypes = []string{
	TransactionType.CardSpend,
}

var TransactionAttachmentType = struct {
	Invoice        string
	Receipt        string
	Memo           string
	OtherDocuments string
}{
	Invoice:        "invoice",
	Receipt:        "receipt",
	Memo:           "memo",
	OtherDocuments: "other-documents",
}

type TransactionTimelineData struct {
	Code               *string                   `bson:"code,omitempty"`
	Error              *string                   `bson:"error,omitempty"`
	BalanceLog         *primitive.ObjectID       `bson:"balanceLog,omitempty"`
	CorrelationID      *string                   `bson:"correlationId,omitempty"`
	LedgerTransaction  *string                   `bson:"ledgerTransaction,omitempty"`
	ProcessorReference *string                   `bson:"processorReference,omitempty"`
	ProcessorPartner   *TransactionProcessorType `bson:"processorPartner,omitempty"`
	Transaction        *primitive.ObjectID       `bson:"transaction,omitempty"`
	Approval           *primitive.ObjectID       `bson:"approval,omitempty"`
	Approver           *primitive.ObjectID       `bson:"approver,omitempty"`
}

type TransactionTimeline struct {
	Action    string                   `bson:"action"`
	Status    string                   `bson:"status"`
	Data      *TransactionTimelineData `bson:"data,omitempty"`
	CreatedAt time.Time                `bson:"createdAt"`
}

var TransactionTimelineAction = struct {
	Initiated         string
	Blocked           string
	ErrorOccurred     string
	SentForApproval   string
	SentForReversal   string
	ApprovalAccepted  string
	SentToQueue       string
	SentForProcessing string
	FundsHeld         string
	FundsTransferred  string
	PaymentSent       string
	PaymentCompleted  string
	PaymentFailed     string
	FundsDebited      string
	FundsSettled      string
	FundsReversed     string
	ComplianceCleared string
	Escalated         string
	FundsCleared      string
}{
	Initiated:         "initiated",
	Blocked:           "blocked",
	ErrorOccurred:     "error-occurred",
	SentForApproval:   "sent-for-approval",
	SentForReversal:   "sent-for-reversal",
	ApprovalAccepted:  "approval-accepted",
	SentToQueue:       "sent-to-queue",
	SentForProcessing: "sent-for-processing",
	FundsHeld:         "funds-held",
	FundsTransferred:  "funds-transferred",
	PaymentSent:       "payment-sent",
	PaymentCompleted:  "payment-completed",
	PaymentFailed:     "payment-failed",
	FundsDebited:      "funds-debited",
	FundsSettled:      "funds-settled",
	FundsReversed:     "funds-reversed",
	ComplianceCleared: "compliance-cleared",
	Escalated:         "escalated",
	FundsCleared:      "funds-cleared",
}

type TransactionPayload struct {
	Transaction   string       `json:"transaction"`
	WebhookEvent  string       `json:"webhookEvent"`
	Source        *AuditSource `json:"auditSource,omitempty"`
	WebhookSource *string      `json:"webhookSource,omitempty"`
}
