package models

type BeneficiaryData struct {
	// Bank (NIP, EFT)
	AccountNumber string `json:"accountNumber" bson:"accountNumber"`
	AccountName   string `json:"accountName" bson:"accountName"`
	BankName      string `json:"bankName" bson:"bankName"`
	BankCode      string `json:"bankCode" bson:"bankCode"`
	BankAbbr      string `json:"bankAbbr,omitempty" bson:"bankAbbr,omitempty"`
	ImageUrl      string `json:"imageUrl,omitempty" bson:"imageUrl,omitempty"`

	// ACH / Wire
	AccountRoutingNumber string `json:"accountRoutingNumber,omitempty" bson:"accountRoutingNumber,omitempty"`
	AccountType          string `json:"accountType,omitempty" bson:"accountType,omitempty"`
	AccountHolderName    string `json:"accountHolderName,omitempty" bson:"accountHolderName,omitempty"`

	// SEPA
	Iban string `json:"iban,omitempty" bson:"iban,omitempty"`
	Bic  string `json:"bic,omitempty" bson:"bic,omitempty"`

	// PIX
	PixKey     string `json:"pixKey,omitempty" bson:"pixKey,omitempty"`
	PixKeyType string `json:"pixKeyType,omitempty" bson:"pixKeyType,omitempty"`

	// Stablecoin
	WalletAddress string `json:"walletAddress" bson:"walletAddress"`
	WalletNetwork string `json:"walletNetwork" bson:"walletNetwork"`

	// Mobile Money
	PhoneNumber string `json:"phoneNumber,omitempty" bson:"phoneNumber,omitempty"`
	Provider    string `json:"provider,omitempty" bson:"provider,omitempty"`
}

type Beneficiary struct {
	Id       string          `json:"id" bson:"_id"`
	Name     string          `json:"name" bson:"name"`
	Rail     string          `json:"rail" bson:"rail"`
	Type     string          `json:"type,omitempty" bson:"type,omitempty"`
	Country  string          `json:"country,omitempty" bson:"country,omitempty"`
	Currency string          `json:"currency,omitempty" bson:"currency,omitempty"`
	Data     BeneficiaryData `json:"data" bson:"data"`
}
