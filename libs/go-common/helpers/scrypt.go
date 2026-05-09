package helpers

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"io"
	"log"
	"strings"

	"golang.org/x/crypto/scrypt"
)

const (
	SCRYPT_OPT_COST        = 1 << 15
	SCRYPT_OPT_BLOCK_SIZE  = 8
	SCRYPT_OPT_PARALLELIZE = 1
	SCRYPT_SALT_LENGTH     = 24
	SCRYPT_KEY_LENGTH      = 32
)

// SCryptHash generates a scrypt hash with a random salt
func SCryptHash(password string) (*string, error) {
	salt := make([]byte, SCRYPT_SALT_LENGTH)
	_, err := io.ReadFull(rand.Reader, salt)
	if err != nil {
		log.Fatal(err)
	}

	return SCryptHashWithSalt(password, salt)
}

// SCryptHashWithSalt generates a scrypt hash with the provided salt
func SCryptHashWithSalt(password string, salt []byte) (*string, error) {
	hash, err := scryptHash([]byte(password), salt)
	if err != nil {
		return nil, err
	}
	hashStr := base64.StdEncoding.EncodeToString(salt) + "." + base64.StdEncoding.EncodeToString(hash)
	return &hashStr, nil
}

// SCryptHashWithoutSalt generates a scrypt hash without salt
func SCryptHashWithoutSalt(password string) (*string, error) {
	hash, err := scryptHash([]byte(password), nil)
	if err != nil {
		return nil, err
	}
	hashStr := base64.StdEncoding.EncodeToString(hash)
	return &hashStr, nil
}

func scryptHash(password []byte, salt []byte) ([]byte, error) {
	hash, err := scrypt.Key(password, salt, SCRYPT_OPT_COST, SCRYPT_OPT_BLOCK_SIZE, SCRYPT_OPT_PARALLELIZE, SCRYPT_KEY_LENGTH)
	if err != nil {
		return nil, err
	}
	return hash, nil
}

// SCryptVerify verifies a password against a scrypt hash (with salt)
func SCryptVerify(checkPassword string, saltWithHash string) bool {
	parts := strings.Split(saltWithHash, ".")
	if len(parts) != 2 {
		return false
	}

	saltByte, err := base64.StdEncoding.DecodeString(parts[0])
	if err != nil {
		return false
	}

	hashByte, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return false
	}

	checkHashByte, err := scryptHash([]byte(checkPassword), saltByte)
	if err != nil {
		return false
	}

	return subtle.ConstantTimeCompare(checkHashByte, hashByte) == 1
}

// SCryptVerifyWithoutSalt verifies a password against a scrypt hash (without salt)
func SCryptVerifyWithoutSalt(checkPassword string, _hash string) bool {
	hashByte, err := base64.StdEncoding.DecodeString(_hash)
	if err != nil {
		return false
	}

	checkHashByte, err := scryptHash([]byte(checkPassword), nil)
	if err != nil {
		return false
	}

	return subtle.ConstantTimeCompare(checkHashByte, hashByte) == 1
}
