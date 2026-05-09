package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CardOrderTimelineData struct {
	Transaction *primitive.ObjectID `bson:"transaction,omitempty"`
}

type CardOrderTimeline struct {
	Action    string                 `bson:"action"`
	Status    string                 `bson:"status"`
	Data      *CardOrderTimelineData `bson:"data,omitempty"`
	CreatedAt time.Time              `bson:"createdAt"`
}

type CardOrder struct {
	Id       primitive.ObjectID  `bson:"_id"`
	Currency string              `bson:"currency"`
	OrderId  string              `bson:"orderId"`
	Network  string              `bson:"network"`
	Type     string              `bson:"type"`
	Quantity int                 `bson:"quantity"`
	FxHash   *string             `bson:"fxHash"`
	Owner    primitive.ObjectID  `bson:"owner"`
	Business primitive.ObjectID  `bson:"business"`
	Status   string              `bson:"status"`
	Timeline []CardOrderTimeline `bson:"timeline"`
}

var CardOrderStatus = struct {
	New                 string
	PendingConfirmation string
	Processing          string
	Abandoned           string
	Shipped             string
}{
	New:                 "new",
	PendingConfirmation: "pending-confirmation",
	Processing:          "processing",
	Abandoned:           "abandoned",
	Shipped:             "shipped",
}
