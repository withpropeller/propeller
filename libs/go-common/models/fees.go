package models

var FeesType = struct {
	PlatformTransfer string
	CardUse          string
	CardNetwork      string
	//FxPurchase                  string
	//Vat                         string
	ElectronicMoneyTransferLevy string
}{
	PlatformTransfer: "platform-transfer",
	CardUse:          "card-use",
	CardNetwork:      "card-network",
	//FxPurchase:                  "FX_PURCHASE",
	//Vat:                         "VAT",
	ElectronicMoneyTransferLevy: "emtl",
}

var FeesStructure = struct {
	Flat       string
	Percentage string
}{
	Flat:       "flat",
	Percentage: "percentage",
}

type Fees struct {
	Type      string
	Structure string
	Value     int64
	Cap       int64
}
