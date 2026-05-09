package helpers

import (
	"crypto/rand"
	"encoding/base32"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(bytes), err
}

// ComparePassword compares a password with its hash
func ComparePassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateRandomToken generates a random token for email verification, etc.
func GenerateRandomToken(length int) string {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return uuid.New().String()
	}

	encoded := base32.StdEncoding.EncodeToString(b)
	encoded = strings.ToLower(encoded)
	encoded = strings.ReplaceAll(encoded, "=", "")

	if len(encoded) > length {
		return encoded[:length]
	}
	return encoded
}

// HashToken hashes a token using bcrypt
func HashToken(token string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(token), bcrypt.DefaultCost)
	return string(bytes), err
}

// CompareTokenHash compares a token with its hash
func CompareTokenHash(token, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(token))
	return err == nil
}
