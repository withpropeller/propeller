package verify

import (
	"crypto"
	"crypto/hmac"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"errors"
	"net/http"
	"net/url"
)

// Verifier validates an inbound webhook's authenticity.
type Verifier interface {
	Verify(body []byte, headers http.Header) error
}

// ── Paystack (HMAC SHA512, x-paystack-signature header) ──

type PaystackVerifier struct {
	secret        string
	webhookSecret string
}

func NewPaystackVerifier(secret, webhookSecret string) *PaystackVerifier {
	return &PaystackVerifier{secret: secret, webhookSecret: webhookSecret}
}

func (v *PaystackVerifier) Verify(body []byte, headers http.Header) error {
	sig := headers.Get("x-paystack-signature")
	if sig == "" {
		return errors.New("missing x-paystack-signature")
	}
	mac := hmac.New(sha256.New, []byte(v.webhookSecret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(sig), []byte(expected)) {
		return errors.New("paystack signature mismatch")
	}
	return nil
}

// ── PayKKa (RSA SHA256, callback notification) ──
//
// PayKKa signs callbacks with their private key; we verify with their public key.
// The canonical string is PayKKa's standard 5-line structure:
//
//	path \n timestamp \n nonce \n merch_id \n body
//
// path is the callback path we registered with PayKKa (the path component of the
// HTTPS endpoint we gave them). It is part of the signed payload but is not
// recoverable from the body/headers, so it is configured on the verifier.

type PayKKaVerifier struct {
	publicKey    *rsa.PublicKey
	callbackPath string
}

func NewPayKKaVerifier(pubKeyPEM, callbackPath string) *PayKKaVerifier {
	block, _ := pem.Decode([]byte(pubKeyPEM))
	if block == nil {
		panic("invalid PayKKa public key PEM")
	}
	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		panic("failed to parse PayKKa public key: " + err.Error())
	}
	rsaPub, ok := pub.(*rsa.PublicKey)
	if !ok {
		panic("PayKKa public key is not RSA")
	}
	if callbackPath == "" {
		callbackPath = "/paykka"
	}
	return &PayKKaVerifier{publicKey: rsaPub, callbackPath: callbackPath}
}

func (v *PayKKaVerifier) Verify(body []byte, headers http.Header) error {
	authHeader := headers.Get("Authorization")
	if authHeader == "" {
		return errors.New("missing Authorization header")
	}

	decoded, err := url.QueryUnescape(authHeader)
	if err != nil {
		return errors.New("malformed Authorization header")
	}

	var auth struct {
		SignType  string `json:"sign_type"`
		Timestamp string `json:"timestamp"`
		Nonce     string `json:"nonce"`
		KeyID     string `json:"key_id"`
		Signature string `json:"signature"`
	}
	if err := json.Unmarshal([]byte(decoded), &auth); err != nil {
		return errors.New("invalid Authorization JSON")
	}
	if auth.Signature == "" {
		return errors.New("missing signature")
	}

	// merch_id line comes from the X-Merch-Id header (kept even if empty).
	merchID := headers.Get("X-Merch-Id")

	canonical := v.callbackPath + "\n" + auth.Timestamp + "\n" + auth.Nonce + "\n" + merchID + "\n" + string(body)
	hash := sha256.Sum256([]byte(canonical))

	sigBytes, err := base64.StdEncoding.DecodeString(auth.Signature)
	if err != nil {
		return errors.New("signature is not valid base64")
	}

	if err := rsa.VerifyPKCS1v15(v.publicKey, crypto.SHA256, hash[:], sigBytes); err != nil {
		return errors.New("paykka signature mismatch")
	}
	return nil
}

// ── Dojah (HMAC SHA256) ──

type DojahVerifier struct {
	webhookSecret string
}

func NewDojahVerifier(webhookSecret string) *DojahVerifier {
	return &DojahVerifier{webhookSecret: webhookSecret}
}

func (v *DojahVerifier) Verify(body []byte, headers http.Header) error {
	sig := headers.Get("x-dojah-signature")
	if sig == "" {
		return errors.New("missing x-dojah-signature")
	}
	mac := hmac.New(sha256.New, []byte(v.webhookSecret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(sig), []byte(expected)) {
		return errors.New("dojah signature mismatch")
	}
	return nil
}

// ── Globalstack (HMAC SHA256) ──

type GlobalstackVerifier struct {
	webhookSecret string
}

func NewGlobalstackVerifier(webhookSecret string) *GlobalstackVerifier {
	return &GlobalstackVerifier{webhookSecret: webhookSecret}
}

func (v *GlobalstackVerifier) Verify(body []byte, headers http.Header) error {
	sig := headers.Get("x-globalstack-signature")
	if sig == "" {
		return errors.New("missing x-globalstack-signature")
	}
	mac := hmac.New(sha256.New, []byte(v.webhookSecret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(sig), []byte(expected)) {
		return errors.New("globalstack signature mismatch")
	}
	return nil
}
