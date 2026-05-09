package config

import "os"

type ConfigType struct {
	AppEnv   string
	LogLevel string

	// Flo connection
	FloAddr string

	// Email provider (Resend)
	ResendAPIKey string
	FromEmail    string
}

func GetConfig() *ConfigType {
	c := &ConfigType{
		AppEnv:       envOrDefault("APP_ENV", "dev"),
		LogLevel:     envOrDefault("LOG_LEVEL", "info"),
		FloAddr:      envOrDefault("FLO_ADDR", "localhost:9000"),
		ResendAPIKey: os.Getenv("RESEND_API_KEY"),
		FromEmail:    envOrDefault("FROM_EMAIL", "Propeller <onboarding@usepropeller.com>"),
	}
	return c
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
