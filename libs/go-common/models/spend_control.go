package models

import "go.mongodb.org/mongo-driver/bson/primitive"

var TransactionPostActions = struct {
	AddTag     string
	AddNote    string
	AddReceipt string
	AddInvoice string
	AddMemo    string
	AddVat     string
}{
	AddTag:     "add-tag",
	AddNote:    "add-note",
	AddReceipt: "add-receipt",
	AddInvoice: "add-invoice",
	AddMemo:    "add-memo",
	AddVat:     "add-vat",
}

type SpendingControlsLimit struct {
	Amount     int64                `bson:"amount"`
	Interval   string               `bson:"interval"`
	Channels   []string             `bson:"channels"`
	Categories []string             `bson:"categories"`
	Merchants  []primitive.ObjectID `bson:"merchants"`
}

type PostSpendControl struct {
	RestrictAfterOverdue bool     `bson:"restrictAfterOverdue"`
	OverdueMax           int      `bson:"overdueMax"`
	OverdueDays          int      `bson:"overdueDays"`
	Actions              []string `bson:"actions"`
}
type SpendControl struct {
	Id                primitive.ObjectID      `bson:"_id"`
	AllowedCategories []string                `bson:"allowedCategories"`
	BlockedCategories []string                `bson:"blockedCategories"`
	AllowedChannels   []string                `bson:"allowedChannels"`
	BlockedChannels   []string                `bson:"blockedChannels"`
	AllowedMerchants  []primitive.ObjectID    `bson:"allowedMerchants"`
	BlockedMerchants  []primitive.ObjectID    `bson:"blockedMerchants"`
	SpendingLimits    []SpendingControlsLimit `bson:"spendingLimits"`
	PostSpend         *PostSpendControl       `bson:"postSpend"`
}
