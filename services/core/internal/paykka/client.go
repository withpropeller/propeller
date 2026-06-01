// Package paykka provides a Go client for PayKKa's merchant Risk Assessment API.
//
// We integrate PayKKa's Risk Assessment product (assessment/apply + notify),
// not the Onboarding product: assessment/apply returns only a merch_id (no
// authorize_link) and the notify callback carries a status + risk_level — the
// right fit for our Merchant-of-Record model.
package paykka

import (
	"bytes"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

// Client is a PayKKa API client with RSA signing.
type Client struct {
	baseURL    string
	httpClient *http.Client
	privateKey *rsa.PrivateKey
	publicKey  *rsa.PublicKey
	keyID      string
	merchID    string
}

// NewClient creates a PayKKa client from PEM-encoded keys.
func NewClient(baseURL, privateKeyPEM, publicKeyPEM, keyID, merchID string) (*Client, error) {
	if baseURL == "" {
		baseURL = "https://open-fat.cb.paykka.com"
	}

	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil {
		return nil, errors.New("invalid private key PEM")
	}
	privKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		// Try PKCS1
		privKey, err = x509.ParsePKCS1PrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse private key: %w", err)
		}
	}

	block, _ = pem.Decode([]byte(publicKeyPEM))
	if block == nil {
		return nil, errors.New("invalid public key PEM")
	}
	pubKeyInterface, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse public key: %w", err)
	}
	pubKey, ok := pubKeyInterface.(*rsa.PublicKey)
	if !ok {
		return nil, errors.New("public key is not RSA")
	}

	return &Client{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 30 * time.Second},
		privateKey: privKey.(*rsa.PrivateKey),
		publicKey:  pubKey,
		keyID:      keyID,
		merchID:    merchID,
	}, nil
}

// OnboardRequest is the shared MerchOnboardCreateReq body used by both the
// onboarding and assessment products. We submit it to assessment/apply.
type OnboardRequest struct {
	RequestID       string        `json:"request_id"`
	ContactPerson   ContactPerson `json:"contact_person"`
	License         License       `json:"license"`
	Business        Business      `json:"business"`
	StakeholderList []Stakeholder `json:"stakeholder_list"`
	ResidentAddress Address       `json:"resident_address"`
}

// ContactPerson represents the contact for onboarding.
type ContactPerson struct {
	PhonePrefix string `json:"phone_prefix"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
}

// License represents business license info.
type License struct {
	Region             string  `json:"region"`
	EntName            string  `json:"ent_name"`
	EntNameEn          string  `json:"ent_name_en"`
	FoundDate          string  `json:"found_date"`
	RegisteredCurrency string  `json:"registered_currency"`
	RegisteredCapital  int64   `json:"registered_capital"`
	Address            Address `json:"address"`
}

// Business represents business details.
type Business struct {
	MainIndustry   string   `json:"main_industry"`
	SubIndustry    []string `json:"sub_industry"`
	Industry       int      `json:"industry"`
	EmployeeNumber string   `json:"employee_number"`
	Address        Address  `json:"address"`
	ExportCountry  []string `json:"export_country"`
	ExportType     []string `json:"export_type"`
	TradeVolume    string   `json:"trade_volume"`
	Website        string   `json:"website,omitempty"`
	BusinessModels []string `json:"business_models,omitempty"`
}

// Stakeholder represents a business stakeholder.
type Stakeholder struct {
	IdentityType          string  `json:"identity_type"`
	Name                  string  `json:"name"`
	Nationality           string  `json:"nationality"`
	BirthDate             string  `json:"birth_date"`
	DocType               string  `json:"doc_type"`
	IDNumber              string  `json:"id_number"`
	DocPortraitSideFileID int     `json:"doc_portrait_side_file_id"`
	DocAddress            string  `json:"doc_address,omitempty"`
	EffDateStart          string  `json:"eff_date_start"`
	EffDateEnd            string  `json:"eff_date_end,omitempty"`
	LongTerm              bool    `json:"long_term,omitempty"`
	Share                 float64 `json:"share,omitempty"`
	ResidentAddress       Address `json:"resident_address"`
}

// Address represents a physical address.
type Address struct {
	Province string `json:"province,omitempty"`
	City     string `json:"city,omitempty"`
	Zipcode  string `json:"zipcode,omitempty"`
	Address1 string `json:"address1"`
	Address2 string `json:"address2,omitempty"`
}

// AssessmentResponse is returned by assessment/apply — just the assigned merch_id.
type AssessmentResponse struct {
	MerchID string `json:"merch_id"`
}

// AssessmentResult is the inner result shared by assessment/result and the
// assessment/notify webhook (under the "data" field).
//
// Status is one of: INIT | WAIT | PASS | REFUSED | AUTH_FAIL | REJECTED.
// RiskLevel is one of: LOW | MIDDLE | HIGH.
type AssessmentResult struct {
	RequestID string `json:"request_id"`
	MerchID   string `json:"merch_id"`
	Status    string `json:"status"`
	Msg       string `json:"msg,omitempty"`
	RiskLevel string `json:"risk_level,omitempty"`
}

// AssessmentNotification is the body PayKKa POSTs to our callback endpoint.
// Every PayKKa callback is wrapped in { type, version, data }.
type AssessmentNotification struct {
	Type    string           `json:"type"`    // ASSESSMENT | MERCH | ...
	Version string           `json:"version"` // V1 | V2 | ...
	Data    AssessmentResult `json:"data"`
}

// SubmitAssessment submits a merchant risk-assessment application.
// Per PayKKa, X-Merch-Id must NOT be sent for this endpoint.
func (c *Client) SubmitAssessment(req OnboardRequest) (*AssessmentResponse, error) {
	authHeader, err := c.signRequest("/api/v2/merch/assessment/apply", req, "")
	if err != nil {
		return nil, err
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", c.baseURL+"/api/v2/merch/assessment/apply", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Authorization", authHeader)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("paykka assessment apply failed: %d %s", resp.StatusCode, string(respBody))
	}

	var result AssessmentResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// GetAssessmentResult queries the current assessment result for a merch_id.
func (c *Client) GetAssessmentResult(merchID string) (*AssessmentResult, error) {
	payload := map[string]string{"merch_id": merchID}
	authHeader, err := c.signRequest("/api/v2/merch/assessment/result", payload, merchID)
	if err != nil {
		return nil, err
	}

	body, _ := json.Marshal(payload)
	httpReq, err := http.NewRequest("POST", c.baseURL+"/api/v2/merch/assessment/result", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Authorization", authHeader)
	httpReq.Header.Set("X-Merch-Id", merchID)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("paykka assessment result query failed: %d %s", resp.StatusCode, string(respBody))
	}

	var result AssessmentResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// VerifyCallbackSignature verifies a PayKKa callback signature against PayKKa's
// public key. The canonical string is PayKKa's standard 5-line structure:
//
//	path \n timestamp \n nonce \n merch_id \n body
//
// path is the request path PayKKa POSTed to, merchID comes from the X-Merch-Id
// header (empty string if absent — the line is still kept), and rawBody is the
// exact bytes received.
func (c *Client) VerifyCallbackSignature(path, merchID, signature, rawBody string) bool {
	decoded, err := url.QueryUnescape(signature)
	if err != nil {
		return false
	}

	var auth struct {
		SignType  string `json:"sign_type"`
		Timestamp string `json:"timestamp"`
		Nonce     string `json:"nonce"`
		KeyID     string `json:"key_id"`
		Signature string `json:"signature"`
	}
	if err := json.Unmarshal([]byte(decoded), &auth); err != nil {
		return false
	}

	canonical := path + "\n" + auth.Timestamp + "\n" + auth.Nonce + "\n" + merchID + "\n" + rawBody
	hash := sha256.Sum256([]byte(canonical))
	sigBytes, err := base64.StdEncoding.DecodeString(auth.Signature)
	if err != nil {
		return false
	}

	err = rsa.VerifyPKCS1v15(c.publicKey, crypto.SHA256, hash[:], sigBytes)
	return err == nil
}

// signRequest creates the PayKKa Authorization header.
func (c *Client) signRequest(path string, body interface{}, merchIDOverride string) (string, error) {
	timestamp := strconv.FormatInt(time.Now().UnixMilli(), 10)
	nonce := generateNonce(16)
	merchID := merchIDOverride
	if merchID == "" && c.merchID != "" {
		merchID = c.merchID
	}

	var bodyStr string
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return "", err
		}
		bodyStr = string(b)
	}

	var canonical string
	if bodyStr != "" {
		canonical = path + "\n" + timestamp + "\n" + nonce + "\n" + merchID + "\n" + bodyStr
	} else {
		canonical = path + "\n" + timestamp + "\n" + nonce + "\n" + merchID
	}

	hash := sha256.Sum256([]byte(canonical))
	signature, err := rsa.SignPKCS1v15(rand.Reader, c.privateKey, crypto.SHA256, hash[:])
	if err != nil {
		return "", err
	}

	auth := map[string]string{
		"sign_type": "SHA256_WITH_RSA",
		"timestamp": timestamp,
		"nonce":     nonce,
		"key_id":    c.keyID,
		"signature": base64.StdEncoding.EncodeToString(signature),
	}
	authJSON, _ := json.Marshal(auth)
	return url.QueryEscape(string(authJSON)), nil
}

func generateNonce(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		randByte := make([]byte, 1)
		rand.Read(randByte)
		b[i] = charset[int(randByte[0])%len(charset)]
	}
	return string(b)
}
