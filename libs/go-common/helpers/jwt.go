package helpers

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWTClaims represents the claims in a JWT token
type JWTClaims struct {
	UserID     string `json:"user_id"`
	Email      string `json:"email"`
	EntityID   string `json:"entity_id,omitempty"`
	BusinessID string `json:"business_id,omitempty"` // Primary business ID (the one created during onboarding)
	IsAdmin    bool   `json:"is_admin"`
	AdminRole  string `json:"admin_role,omitempty"` // super-admin, admin, read-only
	jwt.RegisteredClaims
}

// GenerateJWT generates a new JWT access token
func GenerateJWT(userID, email, businessID, secret string, expiry time.Duration) (string, error) {
	claims := JWTClaims{
		UserID:     userID,
		Email:      email,
		BusinessID: businessID,
		IsAdmin:    false,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// GenerateAdminJWT generates a new JWT access token for admin users
func GenerateAdminJWT(userID, email, adminRole, secret string, expiry time.Duration) (string, error) {
	claims := JWTClaims{
		UserID:    userID,
		Email:     email,
		IsAdmin:   true,
		AdminRole: adminRole,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateJWT validates a JWT token and returns the claims
func ValidateJWT(tokenString, secret string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}
