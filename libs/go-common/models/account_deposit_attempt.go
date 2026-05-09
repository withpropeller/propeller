package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AccountDepositAttemptProcessorData struct {
	Provider     string                 `bson:"provider" json:"provider"`
	Reference    string                 `bson:"reference" json:"reference"`
	RetryCount   int                    `bson:"retryCount" json:"retryCount"`
	MaxRetries   int                    `bson:"maxRetries" json:"maxRetries"`
	LastChecked  time.Time              `bson:"lastChecked" json:"lastChecked"`
	ErrorMessage string                 `bson:"errorMessage,omitempty" json:"errorMessage,omitempty"`
	RawData      map[string]interface{} `bson:"rawData" json:"rawData"`
}

type AccountDepositAttemptDepositInstruction struct {
	Type          string `bson:"type" json:"type"`
	Account       string `bson:"account" json:"account"`
	AccountNumber string `bson:"accountNumber" json:"accountNumber"`
	BankName      string `bson:"bankName" json:"bankName"`
}

type AccountDepositAttempt struct {
	ID                 primitive.ObjectID                      `bson:"_id,omitempty" json:"id"`
	Account            string                                  `bson:"account" json:"account"`
	Business           string                                  `bson:"business" json:"business"`
	Owner              string                                  `bson:"owner,omitempty" json:"owner,omitempty"`
	Amount             float64                                 `bson:"amount" json:"amount"`
	Currency           string                                  `bson:"currency" json:"currency"`
	Status             string                                  `bson:"status" json:"status"`
	DepositInstruction AccountDepositAttemptDepositInstruction `bson:"depositInstruction" json:"depositInstruction"`
	ProcessorData      AccountDepositAttemptProcessorData      `bson:"processorData" json:"processorData"`
	CreatedAt          time.Time                               `bson:"createdAt" json:"createdAt"`
	UpdatedAt          time.Time                               `bson:"updatedAt" json:"updatedAt"`
}
