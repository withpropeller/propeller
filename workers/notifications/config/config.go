package config

import "os"

type ConfigType struct {
	AppEnv   string
	LogLevel string

	// Flo connection (namespace matches gateway/api: NODE_ENV → dev|stg|prod)
	FloAddr      string
	FloNamespace string

	// Email provider (Resend)
	ResendAPIKey string
	FromEmail    string
}

func GetConfig() *ConfigType {
	c := &ConfigType{
		AppEnv:       envOrDefault("APP_ENV", "dev"),
		LogLevel:     envOrDefault("LOG_LEVEL", "info"),
		FloAddr:      envOrDefault("FLO_ADDR", "localhost:9000"),
		FloNamespace: envOrDefault("APP_ENV", "dev"),
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
