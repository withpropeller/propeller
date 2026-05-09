// Package handlers contains flo action handler functions for the core service.
//
// Each handler is a thin adapter — parse input, call into ledger or
// providers, return result. Business logic lives in the libraries.
package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strconv"
	"time"

	flo "github.com/floruntime/flo-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/propeller/propeller/libs/go-common/models"
	evts "github.com/propeller/propeller/libs/go-events"
	mutex "github.com/propeller/propeller/libs/go-mutex"
	"github.com/propeller/propeller/services/core/internal/config"
	"github.com/propeller/propeller/services/core/internal/ledger"
	"github.com/propeller/propeller/services/core/internal/paykka"
)

// Deps holds dependencies injected into action handlers.
type Deps struct {
	Cfg    *config.Config
	Flo    *flo.Client
	Ledger *ledger.Ledger
	PayKKa *paykka.Client
	Mongo  *mongo.Database
}

// newMutex returns a fresh per-call mutex bound to the deps' flo client.
func (d *Deps) newMutex() *mutex.Mutex { return mutex.New(d.Flo) }

// ── Payment handlers ──

// ReceivePayment credits a successful Paystack PWT collection into
// paystack_suspense. Attribution to the business happens later.
func ReceivePayment(deps *Deps) flo.ActionHandler {
	return func(ctx *flo.ActionContext) (interface{}, error) {
		var input struct {
			Reference        string `json:"reference"`
			Amount           int64  `json:"amount"` // kobo
			PaymentRequestID string `json:"paymentRequestId"`
			BusinessID       string `json:"businessId"`
		}
		if err := ctx.Into(&input); err != nil {
			return nil, err
		}

		txnID := "txn." + input.Reference

		// External money in: nothing to debit. We model this by debiting
		// fx_settled (contra) and crediting paystack_suspense — keeps TB
		// happy while accurately representing "money entered the system".
		_, err := deps.Ledger.ExecuteTransfer(ctx.Ctx(), models.TransferRequest{
			TransactionID: txnID,
			Reference:     input.Reference,
			Currency:      "NGN",
			LedgerCode:    ledger.CodeSettlement,
			Legs: []models.TransferLegRequest{{
				DebitOwnerID:      models.SystemOwner,
				DebitAccountType:  models.AccountFxSettled,
				CreditOwnerID:     models.SystemOwner,
				CreditAccountType: models.AccountPaystackSuspense,
				Amount:            uint64(input.Amount),
			}},
			TimelineAction: "funds-received",
		})
		if err != nil {
			return nil, err
		}

		return map[string]string{
			"status":        "received",
			"reference":     input.Reference,
			"businessId":    input.BusinessID,
			"transactionId": txnID,
		}, nil
	}
}

// RejectPayment is a no-op on the ledger (money was never received).
func RejectPayment(deps *Deps) flo.ActionHandler {
	return func(ctx *flo.ActionContext) (interface{}, error) {
		var input struct {
			Reference  string `json:"reference"`
			Message    string `json:"message"`
			BusinessID string `json:"businessId"`
		}
		if err := ctx.Into(&input); err != nil {
			return nil, err
		}
		return map[string]string{
			"status":    "rejected",
			"reference": input.Reference,
			"message":   input.Message,
		}, nil
	}
}

// ── KYB handlers ──

func SubmitKyb(deps *Deps) flo.ActionHandler {
	return func(ctx *flo.ActionContext) (interface{}, error) {
		var input struct {
			BusinessID string `json:"businessId"`
			RequestID  string `json:"requestId"`
		}
		if err := ctx.Into(&input); err != nil {
			return nil, err
		}

		if deps.PayKKa == nil {
			return nil, errors.New("paykka client not configured")
		}

		// 1. Fetch BusinessKYC from MongoDB and map to OnboardRequest
		objID, err := primitive.ObjectIDFromHex(input.BusinessID)
		if err != nil {
			return nil, fmt.Errorf("invalid business id: %w", err)
		}

		onboardReq, err := buildOnboardRequest(ctx.Ctx(), deps.Mongo, objID, input.RequestID)
		if err != nil {
			return nil, fmt.Errorf("build onboard request: %w", err)
		}

		// 2. Call PayKKa apply onboarding
		resp, err := deps.PayKKa.ApplyOnboarding(*onboardReq)
		if err != nil {
			return nil, fmt.Errorf("paykka apply onboarding failed: %w", err)
		}

		// 3. Persist merch_id + authorize_link in Mongo
		_, err = deps.Mongo.Collection("businesses").UpdateOne(
			ctx.Ctx(),
			bson.M{"_id": objID},
			bson.M{"$set": bson.M{
				"paykka_merch_id": resp.MerchID,
				"paykka_status":   "submitted",
				"updatedAt":       time.Now().UTC(),
			}},
		)
		if err != nil {
			return nil, fmt.Errorf("failed to update business: %w", err)
		}

		// 4. Emit kyb.submitted event
		event := evts.KybSubmittedEvent{
			BusinessID:    input.BusinessID,
			RequestID:     input.RequestID,
			MerchID:       resp.MerchID,
			AuthorizeLink: resp.AuthorizeLink,
		}
		if err := publishEvent(ctx.Ctx(), deps.Flo, evts.StreamKybEvents, evts.EventKybSubmitted, event); err != nil {
			// Log but don't fail — event can be replayed
			slog.Warn("failed to publish kyb.submitted", "error", err)
		}

		return map[string]interface{}{
			"status":        "submitted",
			"businessId":    input.BusinessID,
			"merchId":       resp.MerchID,
			"authorizeLink": resp.AuthorizeLink,
		}, nil
	}
}

// ── KYC document helper types (mirrors the gateway's BusinessKYC Mongoose schema) ──

type kycBusinessInfo struct {
	BusinessName     string `bson:"businessName"`
	RegistrationType string `bson:"registrationType"`
	RegistrationNo   string `bson:"registrationNumber"`
	Description      string `bson:"businessDescription"`
	TIN              string `bson:"tin"`
}

type kycBusinessAddress struct {
	City          string `bson:"city"`
	State         string `bson:"state"`
	CountryCode   string `bson:"countryCode"`
	Phone         string `bson:"phone"`
	AddressLine1  string `bson:"addressLineOne"`
	AddressLine2  string `bson:"addressLineTwo"`
	Email         string `bson:"email"`
}

type kycDocFile struct {
	KeyName         string `bson:"keyName"`
	URL             string `bson:"url"`
	PaykkaFileID    int    `bson:"paykkaFileId"`
}

type kycDocumentation struct {
	CACCertificate              kycDocFile `bson:"cacCertificate"`
	CACCertificatePaykkaFileID  int        `bson:"cacCertificatePaykkaFileId"`
	ApplicationDoc              kycDocFile `bson:"applicationDoc"`
	ApplicationDocPaykkaFileID  int        `bson:"applicationDocPaykkaFileId"`
}

type kycLeadership struct {
	FirstName     string `bson:"firstName"`
	MiddleName    string `bson:"middleName"`
	LastName      string `bson:"lastName"`
	Role          string `bson:"role"`
	Nationality   string `bson:"nationalityCode"`
	Phone         string `bson:"phone"`
	Email         string `bson:"email"`
	DateOfBirth   string `bson:"dateOfBirth"`
	BVN           string `bson:"bvn"`
	PaykkaDocFileID int  `bson:"paykkaDocFileId"`
}

type businessKYCDoc struct {
	ID                  primitive.ObjectID `bson:"_id"`
	Business            primitive.ObjectID `bson:"business"`
	BusinessInformation kycBusinessInfo    `bson:"businessInformation"`
	BusinessAddress     kycBusinessAddress `bson:"businessAddress"`
	Leadership          []kycLeadership    `bson:"leadership"`
	Documentation       kycDocumentation   `bson:"documentation"`
}

// buildOnboardRequest reads the BusinessKYC document for the given business
// and maps it to a paykka.OnboardRequest. Fields not yet captured in the KYC
// schema (industry, registered capital, etc.) are set to safe defaults.
func buildOnboardRequest(ctx context.Context, mdb *mongo.Database, businessID primitive.ObjectID, requestID string) (*paykka.OnboardRequest, error) {
	var kyc businessKYCDoc
	err := mdb.Collection("businesskycs").FindOne(ctx, bson.M{"business": businessID}).Decode(&kyc)
	if err != nil {
		return nil, fmt.Errorf("fetch businesskyc for %s: %w", businessID.Hex(), err)
	}

	addr := paykka.Address{
		City:     kyc.BusinessAddress.City,
		Province: kyc.BusinessAddress.State,
		Address1: kyc.BusinessAddress.AddressLine1,
		Address2: kyc.BusinessAddress.AddressLine2,
	}

	// Contact person: use first leadership entry if available, else business address
	contactPhone := kyc.BusinessAddress.Phone
	contactEmail := kyc.BusinessAddress.Email
	if len(kyc.Leadership) > 0 {
		contactPhone = kyc.Leadership[0].Phone
		contactEmail = kyc.Leadership[0].Email
	}

	// Map leadership to PayKKa stakeholders
	stakeholders := make([]paykka.Stakeholder, 0, len(kyc.Leadership))
	for _, l := range kyc.Leadership {
		fullName := l.FirstName
		if l.MiddleName != "" {
			fullName += " " + l.MiddleName
		}
		fullName += " " + l.LastName

		stakeholders = append(stakeholders, paykka.Stakeholder{
			IdentityType:         "INDIVIDUAL",
			Name:                 fullName,
			Nationality:          l.Nationality,
			BirthDate:            l.DateOfBirth,
			DocType:              "BVN",
			IDNumber:             l.BVN,
			DocPortraitSideFileID: l.PaykkaDocFileID,
			ResidentAddress:      addr,
			// EffDateStart/End and Share are set per business requirements;
			// left as zero value until additional KYC fields are captured.
		})
	}

	req := &paykka.OnboardRequest{
		RequestID: requestID,
		ContactPerson: paykka.ContactPerson{
			Phone: contactPhone,
			Email: contactEmail,
		},
		License: paykka.License{
			EntName:   kyc.BusinessInformation.BusinessName,
			EntNameEn: kyc.BusinessInformation.BusinessName,
			Region:    kyc.BusinessAddress.State,
			// FoundDate and financial fields require additional KYC capture (TODO)
		},
		Business: paykka.Business{
			// MainIndustry / SubIndustry: requires industry taxonomy (TODO: Wave 2 next step 9)
			Address: addr,
		},
		StakeholderList: stakeholders,
		ResidentAddress: addr,
	}

	return req, nil
}

func CompleteKyb(deps *Deps) flo.ActionHandler {
	return func(ctx *flo.ActionContext) (interface{}, error) {
		var input struct {
			BusinessID string `json:"businessId"`
			MerchID    string `json:"merchId"`
			Status     string `json:"status"`
			Message    string `json:"message,omitempty"`
		}
		if err := ctx.Into(&input); err != nil {
			return nil, err
		}

		objID, err := primitive.ObjectIDFromHex(input.BusinessID)
		if err != nil {
			return nil, fmt.Errorf("invalid business id: %w", err)
		}

		// 1. Persist PayKKa status in Mongo
		status := models.BusinessEntityStatusUnderReview
		switch input.Status {
		case "APPROVED":
			status = models.BusinessEntityStatusApproved
		case "REJECTED":
			status = models.BusinessEntityStatusRejected
		case "SUPPLEMENT":
			status = models.BusinessEntityStatusPending
		}

		_, err = deps.Mongo.Collection("business_entities").UpdateOne(
			ctx.Ctx(),
			bson.M{"business": objID},
			bson.M{"$set": bson.M{
				"partnerCustomerId": input.MerchID,
				"status":            status,
				"updatedAt":         time.Now().UTC(),
			}},
		)
		if err != nil {
			return nil, fmt.Errorf("failed to update business entity: %w", err)
		}

		// 2. Emit appropriate flo event
		var eventType string
		var event interface{}

		switch input.Status {
		case "APPROVED":
			eventType = evts.EventBusinessActivated
			event = evts.BusinessActivatedEvent{
				BusinessID: input.BusinessID,
				MerchID:    input.MerchID,
				Provider:   "paykka",
			}
		case "REJECTED":
			eventType = evts.EventKybRejected
			event = evts.KybCompletedEvent{
				Provider: "paykka",
				MerchID:  input.MerchID,
				Status:   "REJECTED",
				Message:  input.Message,
			}
		case "SUPPLEMENT":
			eventType = evts.EventKybManualReview
			event = evts.KybCompletedEvent{
				Provider: "paykka",
				MerchID:  input.MerchID,
				Status:   "SUPPLEMENT",
				Message:  input.Message,
			}
		default:
			return nil, fmt.Errorf("unknown kyb status: %s", input.Status)
		}

		stream := evts.StreamBusinessEvents
		if input.Status != "APPROVED" {
			stream = evts.StreamKybEvents
		}

		if err := publishEvent(ctx.Ctx(), deps.Flo, stream, eventType, event); err != nil {
			slog.Warn("failed to publish kyb completion event", "error", err, "eventType", eventType)
		}

		return map[string]interface{}{
			"status":     input.Status,
			"businessId": input.BusinessID,
			"merchId":    input.MerchID,
		}, nil
	}
}

func CompleteKyc(deps *Deps) flo.ActionHandler {
	return func(ctx *flo.ActionContext) (interface{}, error) {
		var input struct {
			ReferenceID string `json:"referenceId"`
			Status      string `json:"status"`
			BusinessID  string `json:"businessId"`
		}
		if err := ctx.Into(&input); err != nil {
			return nil, err
		}
		return map[string]string{
			"status":      input.Status,
			"referenceId": input.ReferenceID,
		}, nil
	}
}

// ── Payout handlers ──

func RoutePayout(deps *Deps) flo.ActionHandler {
	return func(ctx *flo.ActionContext) (interface{}, error) {
		var input struct {
			BusinessID string `json:"businessId"`
			Amount     int64  `json:"amount"`
			Currency   string `json:"currency"`
		}
		if err := ctx.Into(&input); err != nil {
			return nil, err
		}
		return map[string]string{
			"deliveryNetwork": "globalstack",
			"businessId":      input.BusinessID,
			"amount":          strconv.FormatInt(input.Amount, 10),
		}, nil
	}
}

// DeliverPayout reserves NGN (collected → payout_pending) under a per-business
// distributed lock, then triggers the provider call.
func DeliverPayout(deps *Deps) flo.ActionHandler {
	return func(ctx *flo.ActionContext) (interface{}, error) {
		var input struct {
			BusinessID string `json:"businessId"`
			QuoteID    string `json:"quoteId"`
			Reference  string `json:"reference"`
			Amount     int64  `json:"amount"`
		}
		if err := ctx.Into(&input); err != nil {
			return nil, err
		}

		// Lock the business's collected balance for the duration of the
		// reservation so we can safely check-then-reserve elsewhere.
		m := deps.newMutex()
		if err := m.Lock(ctx.Ctx(), "ledger:business:"+input.BusinessID); err != nil {
			return nil, err
		}
		defer m.Unlock(ctx.Ctx())

		txnID := "txn." + input.Reference + ":reserve"
		_, err := deps.Ledger.ExecuteTransfer(ctx.Ctx(), models.TransferRequest{
			TransactionID: txnID,
			Reference:     input.Reference + ":reserve",
			Currency:      "NGN",
			LedgerCode:    ledger.CodeReserve,
			Legs: []models.TransferLegRequest{{
				DebitOwnerID:      input.BusinessID,
				DebitAccountType:  models.AccountBusinessCollected,
				CreditOwnerID:     input.BusinessID,
				CreditAccountType: models.AccountBusinessPayoutPending,
				Amount:            uint64(input.Amount),
			}},
			TimelineAction: "payout-reserved",
		})
		if err != nil {
			return nil, err
		}

		// TODO: Globalstack.PlaceOrder(quoteID).

		return map[string]string{
			"status":        "delivering",
			"businessId":    input.BusinessID,
			"transactionId": txnID,
		}, nil
	}
}

// SettlePayout finalises a successful payout: payout_pending →
// globalstack_fees + fx_settled.
func SettlePayout(deps *Deps) flo.ActionHandler {
	return func(ctx *flo.ActionContext) (interface{}, error) {
		var input struct {
			BusinessID string `json:"businessId"`
			Reference  string `json:"reference"`
			OrderID    string `json:"orderId"`
			TxHash     string `json:"txHash"`
			Amount     int64  `json:"amount"`
			Fee        int64  `json:"fee"`
		}
		if err := ctx.Into(&input); err != nil {
			return nil, err
		}

		txnID := "txn." + input.Reference + ":settle"
		_, err := deps.Ledger.ExecuteTransfer(ctx.Ctx(), models.TransferRequest{
			TransactionID: txnID,
			Reference:     input.Reference + ":settle",
			Currency:      "NGN",
			LedgerCode:    ledger.CodeSettlement,
			Legs: []models.TransferLegRequest{
				{
					DebitOwnerID:      input.BusinessID,
					DebitAccountType:  models.AccountBusinessPayoutPending,
					CreditOwnerID:     models.SystemOwner,
					CreditAccountType: models.AccountGlobalstackFees,
					Amount:            uint64(input.Fee),
				},
				{
					DebitOwnerID:      input.BusinessID,
					DebitAccountType:  models.AccountBusinessPayoutPending,
					CreditOwnerID:     models.SystemOwner,
					CreditAccountType: models.AccountFxSettled,
					Amount:            uint64(input.Amount - input.Fee),
				},
			},
			TimelineAction: "payout-settled",
		})
		if err != nil {
			return nil, err
		}
		return map[string]string{
			"status":        "settled",
			"businessId":    input.BusinessID,
			"orderId":       input.OrderID,
			"transactionId": txnID,
		}, nil
	}
}

// FailPayout reverses the reservation back to the business's collected
// balance.
func FailPayout(deps *Deps) flo.ActionHandler {
	return func(ctx *flo.ActionContext) (interface{}, error) {
		var input struct {
			BusinessID string `json:"businessId"`
			Reference  string `json:"reference"`
			Amount     int64  `json:"amount"`
			Reason     string `json:"reason"`
		}
		if err := ctx.Into(&input); err != nil {
			return nil, err
		}

		m := deps.newMutex()
		if err := m.Lock(ctx.Ctx(), "ledger:business:"+input.BusinessID); err != nil {
			return nil, err
		}
		defer m.Unlock(ctx.Ctx())

		txnID := "txn." + input.Reference + ":reverse"
		_, err := deps.Ledger.ExecuteTransfer(ctx.Ctx(), models.TransferRequest{
			TransactionID: txnID,
			Reference:     input.Reference + ":reverse",
			Currency:      "NGN",
			LedgerCode:    ledger.CodeReversal,
			Legs: []models.TransferLegRequest{{
				DebitOwnerID:      input.BusinessID,
				DebitAccountType:  models.AccountBusinessPayoutPending,
				CreditOwnerID:     input.BusinessID,
				CreditAccountType: models.AccountBusinessCollected,
				Amount:            uint64(input.Amount),
			}},
			TimelineAction: "payout-reversed",
		})
		if err != nil {
			return nil, err
		}
		return map[string]string{
			"status":        "failed",
			"businessId":    input.BusinessID,
			"reason":        input.Reason,
			"transactionId": txnID,
		}, nil
	}
}

// ── Business handlers ──

// ActivateBusiness provisions the per-business TB + Mongo accounts.
func ActivateBusiness(deps *Deps) flo.ActionHandler {
	return func(ctx *flo.ActionContext) (interface{}, error) {
		var input struct {
			BusinessID string `json:"businessId"`
			MerchID    string `json:"merchId"`
		}
		if err := ctx.Into(&input); err != nil {
			return nil, err
		}
		if err := deps.Ledger.EnsureBusinessAccounts(ctx.Ctx(), input.BusinessID, "NGN"); err != nil {
			return nil, err
		}
		return map[string]string{
			"status":     "active",
			"businessId": input.BusinessID,
		}, nil
	}
}

// ── Generic ledger handlers (admin / direct) ──
//
// These are intentionally no-ops in WAVE_2 — all real ledger movement
// goes through typed payment/payout handlers above.

func DebitLedger(deps *Deps) flo.ActionHandler {
	return func(ctx *flo.ActionContext) (interface{}, error) {
		return map[string]string{"status": "noop"}, nil
	}
}

func CreditLedger(deps *Deps) flo.ActionHandler {
	return func(ctx *flo.ActionContext) (interface{}, error) {
		return map[string]string{"status": "noop"}, nil
	}
}

// publishEvent is a helper to publish a typed event to a flo stream.
func publishEvent(ctx context.Context, floClient *flo.Client, stream, eventType string, payload interface{}) error {
	event := map[string]interface{}{
		"type":      eventType,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"payload":   payload,
	}
	data, err := json.Marshal(event)
	if err != nil {
		return err
	}
	_, err = floClient.Stream.Append(stream, data, nil)
	return err
}
