package config

import "os"

type Config struct {
	Port    string
	FloAddr string

	// Provider enable flags
	PaystackEnabled    bool
	PayKKaEnabled      bool
	DojahEnabled       bool
	GlobalstackEnabled bool

	// Verification secrets (from Rune in prod)
	PaystackSecret           string
	PaystackWebhookSecret    string
	PayKKaPublicKey          string
	DojahWebhookSecret       string
	GlobalstackWebhookSecret string
}

func Load() (*Config, error) {
	return &Config{
		Port:    getEnv("PORT", "4000"),
		FloAddr: getEnv("FLO_ADDR", "localhost:9000"),

		PaystackEnabled:    getEnv("PAYSTACK_ENABLED", "false") == "true",
		PayKKaEnabled:      getEnv("PAYKKA_ENABLED", "false") == "true",
		DojahEnabled:       getEnv("DOJAH_ENABLED", "false") == "true",
		GlobalstackEnabled: getEnv("GLOBALSTACK_ENABLED", "false") == "true",

		PaystackSecret:           os.Getenv("PAYSTACK_SECRET_KEY"),
		PaystackWebhookSecret:    os.Getenv("PAYSTACK_WEBHOOK_SECRET"),
		PayKKaPublicKey:          os.Getenv("PAYKKA_PUBLIC_KEY_PEM"),
		DojahWebhookSecret:       os.Getenv("DOJAH_WEBHOOK_SECRET"),
		GlobalstackWebhookSecret: os.Getenv("GLOBALSTACK_WEBHOOK_SECRET"),
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
