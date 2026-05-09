package helpers

type TypeTenantDataSource string

var TenantDataSource = struct {
	Core    TypeTenantDataSource
	Live    TypeTenantDataSource
	Sandbox TypeTenantDataSource
}{
	Core:    "core",
	Live:    "live",
	Sandbox: "sandbox",
}

type TypeModelIdTag string

var ModelIdTag = struct {
	Customer          TypeModelIdTag
	Balance           TypeModelIdTag
	Webhook           TypeModelIdTag
	Account           TypeModelIdTag
	ReserveAccount    TypeModelIdTag
	IsvAccount        TypeModelIdTag
	CardProgram       TypeModelIdTag
	Card              TypeModelIdTag
	CardTransaction   TypeModelIdTag
	Transaction       TypeModelIdTag
	CardAuthorization TypeModelIdTag
	Dispute           TypeModelIdTag
	Payment           TypeModelIdTag
	ReservePayment    TypeModelIdTag
	PaymentRequest    TypeModelIdTag
	Event             TypeModelIdTag
	EventAttempt      TypeModelIdTag
	Request           TypeModelIdTag
	Merchant          TypeModelIdTag
	Billing           TypeModelIdTag
}{
	Customer:          "cus",
	Balance:           "bal",
	Webhook:           "wh",
	Account:           "ac",
	ReserveAccount:    "ac.rsv",
	IsvAccount:        "isv.ac",
	CardProgram:       "c.prg",
	Card:              "c",
	CardTransaction:   "c.txn",
	Transaction:       "txn",
	CardAuthorization: "c.auth",
	Dispute:           "d",
	Payment:           "p",
	ReservePayment:    "p.rsv",
	PaymentRequest:    "p.req",
	Event:             "evt",
	EventAttempt:      "evt.a",
	Request:           "req",
	Merchant:          "mch",
	Billing:           "bil",
}

var ModelRef = struct {
	Customer          string
	Webhook           string
	Account           string
	CardProgram       string
	Card              string
	CardTransaction   string
	CardAuthorization string
	Dispute           string
	Payment           string
	PaymentRequest    string
	Event             string
	EventAttempt      string
	Request           string
	Merchant          string
}{
	Customer:          "Customer",
	Webhook:           "Webhook",
	Account:           "Account",
	CardProgram:       "CardProgram",
	Card:              "Card",
	CardTransaction:   "CardTransaction",
	CardAuthorization: "CardAuthorization",
	Dispute:           "Dispute",
	Payment:           "Payment",
	PaymentRequest:    "PaymentRequest",
	Event:             "Event",
	EventAttempt:      "EventAttempt",
	Request:           "Request",
	Merchant:          "Merchant",
}
