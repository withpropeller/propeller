package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type FundingSource struct {
	Name           string
	ID             primitive.ObjectID
	Ref            string
	Col            string
	Balance        primitive.ObjectID
	Ledger         string
	Subscribers    []primitive.ObjectID
	Controllers    []primitive.ObjectID
	Owner          *primitive.ObjectID
	Business       primitive.ObjectID
	BusinessEntity primitive.ObjectID
	SpendControl   *primitive.ObjectID
	BridgeWallet   *BridgeWallet
	Object         interface{}
}

func (c *FundingSource) GetSubscribersIds() []primitive.ObjectID {
	subscriberIds := c.Subscribers
	if c.Owner != nil {
		subscriberIds = append(subscriberIds, *c.Owner)
	}

	return subscriberIds
}

func (c *FundingSource) GetControllersIds() []primitive.ObjectID {
	controllerIds := c.Controllers
	if c.Owner != nil {
		controllerIds = append(controllerIds, *c.Owner)
	}

	return controllerIds
}
