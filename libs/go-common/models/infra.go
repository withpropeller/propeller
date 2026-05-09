package models

import (
	"time"
)

var AllaweePaymentStatus = struct {
	New     string
	Success string
	Pending string
	Failed  string
}{
	New:     "new",
	Success: "success",
	Pending: "pending",
	Failed:  "failed",
}

type AllaweeEventBodyDataNetworkData struct {
	Rrn                      string `json:"rrn"`
	Stan                     string `json:"stan"`
	Network                  string `json:"network"`
	TxnReference             string `json:"txnReference"`
	Mcc                      string `json:"mcc"`
	CardAcceptorNameLocation string `json:"cardAcceptorNameLocation"`
}

type AllaweeCardData struct {
	Id        string             `json:"id"`
	Reference string             `json:"reference"`
	Currency  string             `json:"currency"`
	Customer  string             `json:"customer"`
	Details   AllaweeCardDetails `json:"details"`
	Network   string             `json:"network"`
	Object    string             `json:"object"`
	Program   string             `json:"program"`
	Status    string             `json:"status"`
	Type      string             `json:"type"`
	CreatedAt time.Time          `json:"createdAt"`
	UpdatedAt time.Time          `json:"updatedAt"`
}

type AllaweeRequestDataResponseBody struct {
	Code string      `json:"code"`
	Data interface{} `json:"data"`
}

type AllaweeRequestData struct {
	Id           string                         `json:"id"`
	Path         string                         `json:"path"`
	Method       string                         `json:"method"`
	Status       string                         `json:"status"`
	StatusCode   int                            `json:"statusCode"`
	RequestBody  interface{}                    `json:"requestBody"`
	ResponseBody AllaweeRequestDataResponseBody `json:"responseBody"`
}

type AllaweeDisputeData struct {
	Amount    int64     `json:"amount"`
	Business  string    `json:"business"`
	CreatedAt time.Time `json:"createdAt"`
	Currency  string    `json:"currency"`
	Id        string    `json:"id"`
	Object    string    `json:"object"`
	Reason    string    `json:"reason"`
	Source    string    `json:"source"`
	Status    string    `json:"status"`
	Timeline  []struct {
		Action    string    `json:"action"`
		ActorType string    `json:"actorType"`
		CreatedAt time.Time `json:"createdAt"`
		UpdatedAt time.Time `json:"updatedAt"`
		User      string    `json:"user"`
	} `json:"timeline"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type AllaweeCardDetails struct {
	Last4          string `json:"last4"`
	Expiry         string `json:"expiry"`
	CardHolderName string `json:"cardHolderName"`
}

type AllaweeAuthorizationData struct {
	Card          string                           `json:"card"`
	Type          string                           `json:"type"`
	Id            string                           `json:"id"`
	Details       *AllaweeCardDetails              `json:"details"`
	Amount        int64                            `json:"amount"`
	Fees          int64                            `json:"fees"`
	Merchant      *string                          `json:"merchant"`
	Channel       string                           `json:"channel"`
	Reserved      bool                             `json:"reserved"`
	NetworkData   *AllaweeEventBodyDataNetworkData `json:"networkData"`
	CreatedAt     time.Time                        `json:"createdAt"`
	Status        string                           `json:"status"`
	DeclineReason string                           `json:"declineReason"`
	DecisionType  string                           `json:"decisionType"`
	Currency      string                           `json:"currency"`
}

func (c *AllaweeAuthorizationData) AmountAndFees() int64 {
	return c.Amount + c.Fees
}

type AllaweeEventBodyMetadata struct {
	CreatedAt time.Time `json:"createdAt"`
	Event     string    `json:"event"`
}

type AllaweeEventBody struct {
	Event    string                   `json:"event"`
	Data     AllaweeAuthorizationData `json:"data"`
	Metadata AllaweeEventBodyMetadata `json:"metadata"`
}

type AllaweeAuthEventBody struct {
	Event    string                   `json:"event"`
	Data     AllaweeAuthorizationData `json:"data"`
	Metadata AllaweeEventBodyMetadata `json:"metadata"`
}

type AllaweeBankTransferData struct {
	DepositAccountNumber string `json:"depositAccountNumber"`
	AccountNumber        string `json:"accountNumber"`
	BankCode             string `json:"bankCode"`
	Narration            string `json:"narration"`
	AccountName          string `json:"accountName"`
	BankName             string `json:"bankName"`
}

type AllaweeFxRefundData struct {
	Type     string  `json:"type"`
	Card     string  `json:"card"`
	Rate     float64 `json:"rate"`
	Amount   int64   `json:"amount"`
	Currency string  `json:"currency"`
	For      string  `json:"for"`
}

type AllaweePaymentEventMethodData struct {
	BankTransfer *AllaweeBankTransferData `json:"bankTransfer"`
	FxRefund     *AllaweeFxRefundData     `json:"fxRefund"`
}

type AllaweePaymentEventProcessorData struct {
	SessionId *string `json:"sessionId"`
}

type AllaweePaymentData struct {
	Type          string                           `json:"type"`
	Reference     string                           `json:"reference"`
	Id            string                           `json:"id"`
	Account       string                           `json:"account"`
	Amount        int64                            `json:"amount"`
	Fees          int64                            `json:"fees"`
	Channel       string                           `json:"channel"`
	Reserved      bool                             `json:"reserved"`
	Method        string                           `json:"method"`
	MethodData    AllaweePaymentEventMethodData    `json:"methodData"`
	ProcessorData AllaweePaymentEventProcessorData `json:"processorData"`
	CreatedAt     time.Time                        `json:"createdAt"`
	Status        string                           `json:"status"`
	Currency      string                           `json:"currency"`
}

type AllaweeCardAuthorizationData struct {
	Id     string `json:"id"`
	Status string `json:"status"`
}

type AllaweePaymentEventBody struct {
	Event    string                   `json:"event"`
	Data     AllaweePaymentData       `json:"data"`
	Metadata AllaweeEventBodyMetadata `json:"metadata"`
}

type AllaweeCardAuthEventBody struct {
	Event    string                   `json:"event"`
	Data     AllaweeAuthorizationData `json:"data"`
	Metadata AllaweeEventBodyMetadata `json:"metadata"`
}

type AllaweeCardOpsEventBody struct {
	Event    string                   `json:"event"`
	Data     AllaweeCardData          `json:"data"`
	Metadata AllaweeEventBodyMetadata `json:"metadata"`
}

type AllaweeRequestEventBody struct {
	Event    string                   `json:"event"`
	Data     AllaweeRequestData       `json:"data"`
	Metadata AllaweeEventBodyMetadata `json:"metadata"`
}

type AllaweeDisputeEventBody struct {
	Event    string                   `json:"event"`
	Data     AllaweeDisputeData       `json:"data"`
	Metadata AllaweeEventBodyMetadata `json:"metadata"`
}

type AllaweeCardResponse struct {
	Code  string          `json:"code"`
	Data  AllaweeCardData `json:"data"`
	Error string          `json:"error"`
}

type AllaweeCardBalanceResponse struct {
	Code string `json:"code"`
	Data struct {
		Available int64 `json:"available"`
	} `json:"data"`
	Error string `json:"error"`
}

type AllaweeCardAuthorizationResponse struct {
	Code  string                       `json:"code"`
	Data  AllaweeCardAuthorizationData `json:"data"`
	Error string                       `json:"error"`
}

type AllaweePaymentResponse struct {
	Code  string             `json:"code"`
	Data  AllaweePaymentData `json:"data"`
	Error string             `json:"error"`
}

type AllaweeRequestResponse struct {
	Code  string             `json:"code"`
	Data  AllaweeRequestData `json:"data"`
	Error string             `json:"error"`
}
