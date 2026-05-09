// Package common — shared utility functions for Propeller Go services.
package common

import (
	"crypto/sha256"
	"encoding/hex"
)

// HashString returns a hex-encoded SHA-256 hash of the input.
func HashString(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:])
}
