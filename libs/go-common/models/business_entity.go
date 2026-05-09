package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BusinessEntityStatus string

const (
	BusinessEntityStatusNew        BusinessEntityStatus = "new"
	BusinessEntityStatusStarted    BusinessEntityStatus = "started"
	BusinessEntityStatusPending    BusinessEntityStatus = "pending"
	BusinessEntityStatusUnderReview BusinessEntityStatus = "under-review"
	BusinessEntityStatusApproved   BusinessEntityStatus = "approved"
	BusinessEntityStatusRejected   BusinessEntityStatus = "rejected"
	BusinessEntityStatusActive     BusinessEntityStatus = "active"
	BusinessEntityStatusSuspended  BusinessEntityStatus = "suspended"
	BusinessEntityStatusClosed     BusinessEntityStatus = "closed"
)

type BusinessEntitySetup struct {
	SetupDate   time.Time              `bson:"setupDate,omitempty"`
	PartnerName string                 `bson:"partnerName,omitempty"`
	Metadata    map[string]interface{} `bson:"metadata,omitempty"`
}

type BusinessEntity struct {
	ID                      primitive.ObjectID     `bson:"_id"`
	Business                primitive.ObjectID     `bson:"business"`
	Name                    string                 `bson:"name,omitempty"`
	CountryCode             string                 `bson:"countryCode"`
	CurrencySupported       string                 `bson:"currencySupported"`
	KYC                     *primitive.ObjectID    `bson:"kyc,omitempty"`
	PartnerCustomerId       string                 `bson:"partnerCustomerId,omitempty"`
	PartnerSetup            *BusinessEntitySetup   `bson:"partnerSetup,omitempty"`
	Status                  BusinessEntityStatus   `bson:"status"`
	RegistrationNumber      string                 `bson:"registrationNumber,omitempty"`
	TaxIdentificationNumber string                 `bson:"taxIdentificationNumber,omitempty"`
	LegalEntityName         string                 `bson:"legalEntityName,omitempty"`
	RegulatoryInfo          map[string]interface{} `bson:"regulatoryInfo,omitempty"`
	Meta                    map[string]interface{} `bson:"_meta,omitempty"`
	CreatedAt               time.Time              `bson:"createdAt"`
	UpdatedAt               time.Time              `bson:"updatedAt"`
}
