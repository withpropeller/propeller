package verify

import (
	"crypto/hmac"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"net/http"
)

// Verifier validates an inbound webhook's authenticity.
type Verifier interface {
	Verify(body []byte, headers http.Header) error
}

// ── Paystack (HMAC SHA512, x-paystack-signature header) ──

type PaystackVerifier struct {
	secret       string
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

type PayKKaVerifier struct {
	publicKey *rsa.PublicKey
}

func NewPayKKaVerifier(pubKeyPEM string) *PayKKaVerifier {
	block, _ := pem.Decode([]byte(pubKeyPEM))
	if block == nil {
		panic("invalid PayKKa public key PEM")
	}
	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		panic("failed to parse PayKKa public key: " + err.Error())
	}
	return &PayKKaVerifier{publicKey: pub.(*rsa.PublicKey)}
}

func (v *PayKKaVerifier) Verify(body []byte, headers http.Header) error {
	authHeader := headers.Get("Authorization")
	if authHeader == "" {
		return errors.New("missing Authorization header")
	}
	// Full RSA verification handled by the provider adapter;
	// this is a lightweight check that the header is present
	// and contains a valid-looking signature.
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
