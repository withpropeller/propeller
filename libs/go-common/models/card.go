package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CardType string

const (
	CardTypePhysical CardType = "physical"
	CardTypeVirtual  CardType = "virtual"
)

type CardDetails struct {
	Id             string `bson:"id"`
	Last4          string `bson:"last4"`
	CardHolderName string `bson:"cardHolderName"`
}

func GetFee() *int64 {
	var fee int64 = 5

	var feePtr *int64
	feePtr = &fee

	return feePtr
}

type Card struct {
	Id                  primitive.ObjectID   `bson:"_id"`
	Name                string               `bson:"name"`
	Currency            string               `bson:"currency"`
	Balance             *primitive.ObjectID  `bson:"balance"`
	Ledger              string               `bson:"ledger"`
	Tags                []primitive.ObjectID `bson:"tags"`
	AutoTagTransactions bool                 `bson:"autoTagTransactions"`
	Status              string               `bson:"status"`
	Details             CardDetails          `bson:"details"`
	Limit               PISpendLimit         `bson:"limit"`
	SpendControl        *primitive.ObjectID  `bson:"spendControl"`
	Custodian           primitive.ObjectID   `bson:"custodian"`
	Controller          primitive.ObjectID   `bson:"controller"`
	Subscribers         []primitive.ObjectID `bson:"subscribers"`
	Business            primitive.ObjectID   `bson:"business"`
	FundingSource       primitive.ObjectID   `bson:"fundingSource"`
	FundingSourceRef    string               `bson:"fundingSourceRef"`
}

var CardStatus = struct {
	Active  string
	Frozen  string
	Retired string
}{
	Active:  "active",
	Frozen:  "frozen",
	Retired: "retired",
}

type PISpendLimit struct {
	Type              string    `bson:"type"`
	Amount            int64     `bson:"amount"`
	RenewalFrequency  string    `bson:"renewalFrequency"`
	RenewalDay        string    `bson:"renewalDay"`
	RenewalStrategy   string    `bson:"renewalStrategy"`
	ExpiresAt         time.Time `bson:"expiresAt"`
	SpentWithinPeriod int64     `bson:"spentWithinPeriod"`
}
