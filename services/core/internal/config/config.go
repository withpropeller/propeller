package config

import "os"

type Config struct {
	Port    string
	FloAddr string

	// MongoDB
	MongoURI string
	MongoDB  string

	// TigerBeetle
	TBAddresses   []string
	TBClusterID   uint64
	TBConcurrency uint

	// Provider enable flags
	PaystackEnabled    bool
	PayKKaEnabled      bool
	DojahEnabled       bool
	GlobalstackEnabled bool

	// Provider secrets
	PaystackSecret      string
	PayKKaBaseURL       string
	PayKKaPrivateKeyPEM string
	PayKKaPublicKeyPEM  string
	PayKKaKeyID         string
	PayKKaMerchID       string
	DojahAppID          string
	DojahSecretKey      string
	GlobalstackAPIKey   string
	GlobalstackBaseURL  string

	LogLevel string
}

func Load() (*Config, error) {
	return &Config{
		Port:    getEnv("PORT", "4001"),
		FloAddr: getEnv("FLO_ADDR", "localhost:9000"),

		MongoURI:      getEnv("MONGO_URI", "mongodb://localhost:27017/?replicaSet=rs0"),
		MongoDB:       getEnv("MONGO_DB", "propeller"),
		TBAddresses:   []string{getEnv("TB_ADDRESSES", "localhost:4000")},
		TBConcurrency: 32,

		PaystackEnabled:    getEnv("PAYSTACK_ENABLED", "false") == "true",
		PayKKaEnabled:      getEnv("PAYKKA_ENABLED", "false") == "true",
		DojahEnabled:       getEnv("DOJAH_ENABLED", "false") == "true",
		GlobalstackEnabled: getEnv("GLOBALSTACK_ENABLED", "false") == "true",

		PaystackSecret:      os.Getenv("PAYSTACK_SECRET_KEY"),
		PayKKaBaseURL:       getEnv("PAYKKA_BASE_URL", "https://open-fat.cb.paykka.com"),
		PayKKaPrivateKeyPEM: os.Getenv("PAYKKA_PRIVATE_KEY_PEM"),
		PayKKaPublicKeyPEM:  os.Getenv("PAYKKA_PUBLIC_KEY_PEM"),
		PayKKaKeyID:         os.Getenv("PAYKKA_KEY_ID"),
		PayKKaMerchID:       os.Getenv("PAYKKA_MERCH_ID"),
		DojahAppID:          os.Getenv("DOJAH_APP_ID"),
		DojahSecretKey:      os.Getenv("DOJAH_SECRET_KEY"),
		GlobalstackAPIKey:   os.Getenv("GLOBALSTACK_API_KEY"),
		GlobalstackBaseURL:  getEnv("GLOBALSTACK_BASE_URL", "https://sandbox.globalstack.io"),

		LogLevel: getEnv("LOG_LEVEL", "info"),
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
