package models

import "time"

type BridgeCapabilities struct {
	PayinCrypto  string `json:"payin_crypto,omitempty"`
	PayoutCrypto string `json:"payout_crypto,omitempty"`
	PayinFiat    string `json:"payin_fiat,omitempty"`
	PayoutFiat   string `json:"payout_fiat,omitempty"`
}

type BridgeEndorsement struct {
	Name         string      `json:"name,omitempty"`
	Status       string      `json:"status,omitempty"`
	Requirements interface{} `json:"requirements,omitempty"`
}

type BridgeCustomer struct {
	ID                        string              `json:"id"`
	FirstName                 string              `json:"first_name,omitempty"`
	LastName                  string              `json:"last_name,omitempty"`
	Email                     string              `json:"email,omitempty"`
	Status                    string              `json:"status,omitempty"`
	Type                      string              `json:"type,omitempty"`
	PersonaInquiryType        string              `json:"persona_inquiry_type,omitempty"`
	CreatedAt                 time.Time           `json:"created_at,omitempty"`
	UpdatedAt                 time.Time           `json:"updated_at,omitempty"`
	RejectionReasons          []interface{}       `json:"rejection_reasons,omitempty"`
	HasAcceptedTermsOfService bool                `json:"has_accepted_terms_of_service,omitempty"`
	Endorsements              []BridgeEndorsement `json:"endorsements,omitempty"`
	FutureRequirementsDue     []string            `json:"future_requirements_due,omitempty"`
	RequirementsDue           []string            `json:"requirements_due,omitempty"`
	Capabilities              BridgeCapabilities  `json:"capabilities,omitempty"`
}

type BridgeTransferResponse struct {
	ID    string `json:"id"`
	State string `json:"state,omitempty"`
}

/* Example Bridge CreateTransfer response
{
    "id": "8ea66cbc-940b-498b-9fb4-11149c5ac275",
    "client_reference_id": "HMGDUZED8RNM",
    "state": "in_review",
    "on_behalf_of": "ba798547-eaa9-480d-b9d2-d76364928aa8",
    "currency": "usd",
    "amount": "2.0",
    "developer_fee": "0.0",
    "source": {
        "payment_rail": "bridge_wallet",
        "currency": "usdc",
        "bridge_wallet_id": "f4436516-a739-421b-b953-909e516a8cd0",
        "from_address": "5SMfDWyHxaceZFNYx8B5fmJaoMCTsty6czoPfHEZEHTZ"
    },
    "created_at": "2026-01-28T04:41:12.115Z",
    "updated_at": "2026-01-28T04:41:12.195Z",
    "destination": {
        "payment_rail": "solana",
        "currency": "usdc",
        "to_address": "qny45Q2s1X8FdkX4vGqUWu7qivYEtea9A6iZPn4igBy"
    },
    "receipt": {
        "initial_amount": "2.0",
        "developer_fee": "0.0",
        "exchange_fee": "0.0",
        "subtotal_amount": "2.0",
        "gas_fee": "0.0",
        "final_amount": "2.0"
    }
}*/
