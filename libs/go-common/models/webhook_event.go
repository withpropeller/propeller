package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type WebhookEventStatus string

const (
	WebhookEventStatusPending   WebhookEventStatus = "pending"
	WebhookEventStatusPublished WebhookEventStatus = "published"
	WebhookEventStatusFailed    WebhookEventStatus = "failed"
)

type WebhookEventData struct {
	CustomerID string `bson:"customerId,omitempty" json:"customerId,omitempty"`
}

type WebhookEventRequestRawBodyEventObjectDestination struct {
	Currency    string `bson:"currency,omitempty" json:"currency,omitempty"`
	ToAddress   string `bson:"to_address,omitempty" json:"to_address,omitempty"`
	PaymentRail string `bson:"payment_rail,omitempty" json:"payment_rail,omitempty"`
}

type WebhookEventRequestRawBodyEventObject struct {
	ToAddress         string                                           `bson:"to_address,omitempty" json:"to_address,omitempty"`
	Amount            string                                           `bson:"amount,omitempty" json:"amount,omitempty"`
	TxHash            string                                           `bson:"tx_hash,omitempty" json:"tx_hash,omitempty"`
	Currency          string                                           `bson:"currency,omitempty" json:"currency,omitempty"`
	ClientReferenceId string                                           `bson:"client_reference_id,omitempty" json:"client_reference_id,omitempty"`
	Destination       WebhookEventRequestRawBodyEventObjectDestination `bson:"destination,omitempty" json:"destination,omitempty"`
}

// TODO: Refactor WebhookEventRequestRawBody to be more generic and reusable across different webhook event types
type WebhookEventRequestRawBody struct {
	EventObjectId string                                `bson:"event_object_id,omitempty" json:"event_object_id,omitempty"`
	EventObject   WebhookEventRequestRawBodyEventObject `bson:"event_object,omitempty" json:"event_object,omitempty"`
	Event         string                                `json:"event"`
	Data          AllaweePaymentData                    `json:"data"`
	Metadata      AllaweeEventBodyMetadata              `json:"metadata"`
}

type WebhookEventRequest struct {
	Method  string                     `bson:"method" json:"method"`
	URL     string                     `bson:"url" json:"url"`
	RawBody WebhookEventRequestRawBody `bson:"rawBody" json:"rawBody"`
}

// WebhookEvent represents a webhook event stored in the outbox pattern
type WebhookEvent struct {
	ID          primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	Source      string              `bson:"source" json:"source"`                               // e.g., "bridge", "allawee"
	EventType   WebhookEventType    `bson:"eventType" json:"eventType"`                         // e.g., "kyc.customer.updated", "payment.completed"
	Request     WebhookEventRequest `bson:"request" json:"request"`                             // Parsed webhook request (JSON)
	Data        WebhookEventData    `bson:"data,omitempty" json:"data,omitempty"`               // Business relevant data extracted from request
	Status      WebhookEventStatus  `bson:"status" json:"status"`                               // PENDING, PUBLISHED, FAILED
	Processed   bool                `bson:"processed" json:"processed"`                         // Has the consumer processed this event?
	Retries     int                 `bson:"retries" json:"retries"`                             // Number of relay attempts
	Error       string              `bson:"error,omitempty" json:"error"`                       // Last error message if failed
	CreatedAt   time.Time           `bson:"createdAt" json:"createdAt"`                         // When webhook was received
	UpdatedAt   time.Time           `bson:"updatedAt" json:"updatedAt"`                         // When webhook was last updated
	PublishedAt *time.Time          `bson:"publishedAt,omitempty" json:"publishedAt,omitempty"` // When published to stream
	ProcessedAt *time.Time          `bson:"processedAt,omitempty" json:"processedAt,omitempty"` // When consumer finished processing
}

type WebhookEventType string

const (
	WebhookEventTypePaymentAccountDepositCompleted WebhookEventType = "payment.account.deposit.completed"
	WebhookEventTypePaymentTransferCompleted       WebhookEventType = "payment.transfer.completed"
	WebhookEventTypePaymentPayoutCompleted         WebhookEventType = "payment.payout.completed"
)
