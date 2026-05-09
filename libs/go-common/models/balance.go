package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// BalanceMutex is the runtime lock contract that go-database/mongo.Mutex
// satisfies. Declared as an interface here to avoid a layering inversion
// (models must not depend on storage).
type BalanceMutex interface {
	Unlock() error
}

const BalanceModelTag = "bal"

type LockedLog struct {
	Amount      int64  `ion:"amount" json:"amount"`
	Transaction string `ion:"source" json:"transaction"`
}

type BalanceMeta struct {
	Op       string             `bson:"op" json:"op"`
	OrigId   string             `bson:"origId" json:"origId"`
	PrevHash string             `bson:"prevHash" json:"prevHash"`
	SeqNo    int64              `bson:"seqNo" json:"seqNo"`
	TxTime   primitive.DateTime `bson:"txTime" json:"txTime"`
	Hash     string             `bson:"hash" json:"hash"`
	Nonce    string             `bson:"nonce" json:"nonce"`
}

type Balance struct {
	Id              primitive.ObjectID `bson:"_id" json:"id"`
	Available       int64              `bson:"available" json:"available"`
	AvailableChange int64              `bson:"availableChange" json:"availableChange"`
	Locked          int64              `bson:"locked" json:"locked"`
	LockedChange    int64              `bson:"lockedChange" json:"lockedChange"`
	LockedLog       []LockedLog        `bson:"lockedLog" json:"lockedLog"`
	OverdraftLimit  *int64             `bson:"overdraftLimit" json:"overdraftLimit"`
	Currency        string             `bson:"currency" json:"currency"`
	Transaction     string             `bson:"transaction" json:"transaction"`
	Mode            string             `bson:"mode" json:"mode"`
	Meta            BalanceMeta        `bson:"_meta" json:"_meta"`
	mutex           BalanceMutex
}

func (a *Balance) IsInsufficient(amount int64) bool {
	if a.OverdraftLimit != nil {
		return a.Available+*a.OverdraftLimit < amount
	}

	return a.Available < amount
}

func (a *Balance) HasMutex() bool {
	return a.mutex != nil
}

func (a *Balance) SetMutex(mut BalanceMutex) {
	if mut != nil {
		a.mutex = mut
	}
}

func (a *Balance) Unlock() error {
	if a.mutex == nil {
		return nil
	}

	if err := a.mutex.Unlock(); err != nil {
		return err
	}

	a.mutex = nil
	return nil
}

var ReserveAccountSlug = struct {
	NGNVostro        string
	NGNCardPurchases string
	NGNShippingFees  string
}{
	NGNVostro:        "ngn-vostro",
	NGNCardPurchases: "ngn-card-purchases",
	NGNShippingFees:  "ngn-shipping-fees",
}

type BalanceLog struct {
	Id              primitive.ObjectID `bson:"_id" json:"id"`
	Available       int64              `bson:"available" json:"available"`
	AvailableChange int64              `bson:"availableChange" json:"availableChange"`
	Locked          int64              `bson:"locked" json:"locked"`
	LockedChange    int64              `bson:"lockedChange" json:"lockedChange"`
	LockedLog       []LockedLog        `bson:"lockedLog" json:"lockedLog"`
	Currency        string             `bson:"currency" json:"currency"`
	Transaction     primitive.ObjectID `bson:"transaction" json:"transaction"`
	Mode            string             `bson:"mode" json:"mode"`
	Meta            BalanceMeta        `bson:"_meta" json:"_meta"`
}
