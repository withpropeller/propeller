// Package events defines the canonical event types, action names,
// and stream names shared across Go services and TS apps.
//
// Keep in sync with libs/contracts/events.ts
package events

// ── Event types ──

const (
	// Webhook
	EventWebhookReceived = "webhook.received"

	// Payment collection (Paystack PWT)
	EventPaymentReceived  = "payment.received"
	EventPaymentRejected  = "payment.rejected"
	EventPaymentCollected = "payment.collected"

	// KYB (PayKKa risk assessment)
	EventKybSubmitted    = "kyb.submitted"
	EventKybCompleted    = "kyb.completed"
	EventKybApproved     = "kyb.approved"
	EventKybRejected     = "kyb.rejected"
	EventKybManualReview = "kyb.manual_review"

	// KYC (Dojah)
	EventKycCompleted = "kyc.completed"

	// Payout
	EventPayoutRequested = "payout.requested"
	EventPayoutDelivered = "payout.delivered"
	EventPayoutSettled   = "payout.settled"
	EventPayoutFailed    = "payout.failed"

	// Business lifecycle
	EventBusinessActivated    = "business.activated"
	EventBusinessSuspended    = "business.suspended"
	EventBusinessClosed       = "business.closed"
	EventBusinessKycSubmitted = "business.kyc-submitted"

	// Ledger
	EventLedgerCredited = "ledger.credited"
	EventLedgerDebited  = "ledger.debited"
)

// ── Action names ──

const (
	ActionReceivePayment   = "receive-payment"
	ActionRejectPayment    = "reject-payment"
	ActionSubmitKyb        = "submit-kyb"
	ActionCompleteKyb      = "complete-kyb"
	ActionCompleteKyc      = "complete-kyc"
	ActionRoutePayout      = "route-payout"
	ActionDeliverPayout    = "deliver-payout"
	ActionSettlePayout     = "settle-payout"
	ActionFailPayout       = "fail-payout"
	ActionActivateBusiness = "activate-business"
	ActionDebitLedger      = "debit-ledger"
	ActionCreditLedger     = "credit-ledger"
)

// ── Stream names ──

const (
	StreamRawWebhooks        = "raw-webhooks"
	StreamPaymentEvents      = "payment-events"
	StreamKybEvents          = "kyb-events"
	StreamKycEvents          = "kyc-events"
	StreamPayoutEvents       = "payout-events"
	StreamBusinessEvents     = "business-events"
	StreamNotificationEvents = "notification-events"
	StreamLedgerEvents       = "ledger-events"
)

// ── Payload types ──

type WebhookRecord struct {
	Source         string                 `json:"source"` // paystack | paykka | dojah | globalstack
	Event          string                 `json:"event"`  // original provider event name
	Payload        map[string]interface{} `json:"payload"`
	Headers        map[string]string      `json:"headers"`
	ReceivedAt     string                 `json:"receivedAt"`
	IdempotencyKey string                 `json:"idempotencyKey"`
}

type PaymentReceivedEvent struct {
	Provider          string `json:"provider"`
	Reference         string `json:"reference"`
	Amount            int64  `json:"amount"` // kobo
	Currency          string `json:"currency"`
	SenderName        string `json:"senderName"`
	SenderBankAccount string `json:"senderBankAccount"`
	SenderCountry     string `json:"senderCountry"`
	PaidAt            string `json:"paidAt"`
	PaymentRequestID  string `json:"paymentRequestId"`
}

type PaymentRejectedEvent struct {
	Provider    string `json:"provider"`
	Reference   string `json:"reference"`
	Amount      string `json:"amount"`
	Message     string `json:"message"`
	MessageType string `json:"messageType"`
}

type KybSubmittedEvent struct {
	BusinessID string `json:"businessId"`
	RequestID  string `json:"requestId"`
	MerchID    string `json:"merchId"`
}

type BusinessSubmissionReadyEvent struct {
	BusinessID string `json:"businessId"`
	RequestID  string `json:"requestId"`
}

type KybCompletedEvent struct {
	Provider  string `json:"provider"`
	MerchID   string `json:"merchId"`
	RequestID string `json:"requestId,omitempty"`
	Status    string `json:"status"`              // INIT | WAIT | PASS | REFUSED | AUTH_FAIL | REJECTED
	RiskLevel string `json:"riskLevel,omitempty"` // LOW | MIDDLE | HIGH
	Message   string `json:"message,omitempty"`
}

type BusinessActivatedEvent struct {
	BusinessID string `json:"businessId"`
	MerchID    string `json:"merchId"`
	Provider   string `json:"provider"`
}

type KycCompletedEvent struct {
	Provider      string `json:"provider"`
	ReferenceID   string `json:"referenceId"`
	Status        string `json:"status"`
	FullName      string `json:"fullName,omitempty"`
	DOB           string `json:"dob,omitempty"`
	Country       string `json:"country,omitempty"`
	DocType       string `json:"docType,omitempty"`
	LivenessScore int    `json:"livenessScore,omitempty"`
}

type PayoutSettledEvent struct {
	Provider       string `json:"provider"`
	OrderID        string `json:"orderId"`
	TargetTxHash   string `json:"targetTxHash,omitempty"`
	TargetAmount   int64  `json:"targetAmount,omitempty"`
	TargetCurrency string `json:"targetCurrency,omitempty"`
}
