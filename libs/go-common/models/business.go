package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type BusinessConfig struct {
	Email    string   `bson:"email"`
	CCEmails []string `bson:"ccEmails"`
}

type BusinessRestrictions struct {
	PND bool `bson:"pnd"` // PND - Post No Debit
}

type Business struct {
	Id           primitive.ObjectID    `bson:"_id"`
	Name         string                `bson:"name"`
	Status       string                `bson:"status"`
	Owner        primitive.ObjectID    `bson:"owner"`
	InfraId      string                `bson:"infraId"`
	Restrictions *BusinessRestrictions `bson:"restrictions"`
}
