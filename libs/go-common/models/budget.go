package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BudgetMember struct {
	User    primitive.ObjectID `bson:"user"`
	Limit   PISpendLimit       `bson:"limit"`
	AddedBy primitive.ObjectID `bson:"addedBy"`
}

type Budget struct {
	Id               primitive.ObjectID   `bson:"_id"`
	Name             string               `bson:"name"`
	Balance          primitive.ObjectID   `bson:"balance"`
	Ledger           string               `bson:"ledger"`
	FundingSource    primitive.ObjectID   `bson:"fundingSource"`
	FundingSourceRef string               `bson:"fundingSourceRef"`
	Business         primitive.ObjectID   `bson:"business"`
	Status           string               `bson:"status"`
	Limit            PISpendLimit         `bson:"limit"`
	Members          []BudgetMember       `bson:"members"`
	Owner            primitive.ObjectID   `bson:"owner"`
	Controllers      []primitive.ObjectID `bson:"controllers"`
	Subscribers      []primitive.ObjectID `bson:"subscribers"`
}
