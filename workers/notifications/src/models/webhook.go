package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type WebhookEventMetadata struct {
	Id        string    `json:"webhookEvent"`
	CreatedAt time.Time `json:"createdAt"`
}

type WebhookEventBody struct {
	Card     string               `json:"card"`
	Data     interface{}          `json:"data"`
	Metadata WebhookEventMetadata `json:"metadata"`
}

type EventAttempt struct {
	Id           primitive.ObjectID `bson:"_id"`
	Business     primitive.ObjectID `bson:"business"`
	Url          string             `bson:"url"`
	Event        primitive.ObjectID `bson:"event"`
	Consumer     primitive.ObjectID `bson:"consumer"`
	consumerRef  string             `bson:"consumerRef"`
	StatusCode   int                `bson:"statusCode"`
	RequestBody  string             `bson:"requestBody"`
	ResponseBody string             `bson:"responseBody"`
	RetryAt      time.Time          `bson:"retryAt"`
	ResponseTime int                `bson:"responseTime"`
}

type Event struct {
	Id        primitive.ObjectID     `bson:"_id" json:"id"`
	Body      map[string]interface{} `bson:"body" json:"body"`
	Attempts  []primitive.ObjectID   `bson:"attempts" json:"attempts"`
	Type      string                 `bson:"type" json:"type"`
	CreatedAt time.Time              `bson:"createdAt" json:"createdAt"`
}

type Webhook struct {
	Id               primitive.ObjectID `bson:"_id"`
	Business         primitive.ObjectID `bson:"business"`
	Name             string             `bson:"name"`
	Url              string             `bson:"url"`
	SecureSigningKey []byte             `bson:"secureSigningKey"`
	ApiVersion       string             `bson:"apiVersion"`
}

type WebhookPayload struct {
	Webhook string `json:"webhook"`
	Event   string `json:"event"`
}
