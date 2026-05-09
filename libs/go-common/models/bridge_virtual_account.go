package models

type BridgeVirtualAccount struct {
	ID                        string                          `json:"id"`
	Status                    string                          `json:"status,omitempty"`
	DeveloperFeePercent       string                          `json:"developer_fee_percent,omitempty"`
	SourceDepositInstructions BridgeSourceDepositInstructions `json:"source_deposit_instructions,omitempty"`
	Destination               BridgeVirtualAccountDestination `json:"destination,omitempty"`
}

type BridgeSourceDepositInstructions struct {
	Currency               string   `json:"currency,omitempty"`
	PaymentRails           []string `json:"payment_rails,omitempty"`
	BankName               string   `json:"bank_name,omitempty"`
	BankAddress            string   `json:"bank_address,omitempty"`
	BankBeneficiaryName    string   `json:"bank_beneficiary_name,omitempty"`
	BankBeneficiaryAddress string   `json:"bank_beneficiary_address,omitempty"`
	BankAccountNumber      string   `json:"bank_account_number,omitempty"`
	BankRoutingNumber      string   `json:"bank_routing_number,omitempty"`
}

type BridgeVirtualAccountDestination struct {
	Currency    string `json:"currency,omitempty"`
	PaymentRail string `json:"payment_rail,omitempty"`
	Address     string `json:"address,omitempty"`
}
