package main

import "os"

// Config holds runtime configuration for the compliance worker.
type Config struct {
	FloAddr string
}

func loadConfig() *Config {
	addr := os.Getenv("FLO_ADDR")
	if addr == "" {
		addr = "localhost:9000"
	}
	return &Config{FloAddr: addr}
}
