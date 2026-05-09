package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DepositChannel struct {
	AccountName        string        `bson:"accountName"`
	AccountNumber      string        `bson:"accountNumber"`
	RoutingNumber      string        `bson:"routingNumber,omitempty"`
	BankName           string        `bson:"bankName"`
	BankCode           string        `bson:"bankCode"`
	BankAddress        string        `bson:"bankAddress,omitempty"`
	BeneficiaryName    string        `bson:"beneficiaryName,omitempty"`
	BeneficiaryAddress string        `bson:"beneficiaryAddress,omitempty"`
	PaymentMethods     []string      `bson:"paymentMethods,omitempty"`
	Partner            string        `bson:"partner"`
	PartnerId          string        `bson:"partnerId,omitempty"`
	Wallet             *BridgeWallet `bson:"wallet,omitempty"`
	CreatedAt          time.Time     `bson:"createdAt,omitempty"`
	UpdatedAt          time.Time     `bson:"updatedAt,omitempty"`
}

type Account struct {
	Id              primitive.ObjectID   `bson:"_id"`
	Name            string               `bson:"name"`
	Status          string               `bson:"status"`
	Currency        string               `bson:"currency"`
	InfraId         string               `bson:"infraId"`
	Balance         primitive.ObjectID   `bson:"balance"`
	AssetLedger     string               `bson:"assetLedger,omitempty"`
	Ledger          string               `bson:"ledger,omitempty"`
	LiabilityLedger string               `bson:"liabilityLedger,omitempty"`
	Business        primitive.ObjectID   `bson:"business"`
	Entity          primitive.ObjectID   `bson:"entity"`
	Subscribers     []primitive.ObjectID `bson:"subscribers"`
	DepositChannels []DepositChannel     `bson:"depositChannels,omitempty"`
	Owner           primitive.ObjectID   `bson:"owner"`
	CreatedAt       time.Time            `bson:"createdAt"`
	UpdatedAt       time.Time            `bson:"updatedAt"`
}

func (a *Account) GetBridgeWallet() *BridgeWallet {
	if len(a.DepositChannels) > 0 {
		return a.DepositChannels[0].Wallet
	}
	return nil
}

func (a *Account) GetDepositChannelByPartner(partner string) *DepositChannel {
	for _, channel := range a.DepositChannels {
		if channel.Partner == partner {
			return &channel
		}
	}
	return nil
}
