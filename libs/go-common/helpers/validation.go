package helpers

import (
	"regexp"
	"strings"
	"unicode"
)

var (
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
)

// ValidatePassword validates password strength
// Requirements: min 8 chars, at least one letter and one number
func ValidatePassword(password string) (bool, string) {
	if len(password) < 8 {
		return false, "Password must be at least 8 characters long"
	}

	hasLetter := false
	hasNumber := false

	for _, char := range password {
		if unicode.IsLetter(char) {
			hasLetter = true
		}
		if unicode.IsNumber(char) {
			hasNumber = true
		}
	}

	if !hasLetter {
		return false, "Password must contain at least one letter"
	}

	if !hasNumber {
		return false, "Password must contain at least one number"
	}

	return true, ""
}

// ValidateEmailFormat validates email format
func ValidateEmailFormat(email string) bool {
	email = strings.TrimSpace(email)
	return emailRegex.MatchString(email)
}

// ValidateBusinessName validates business name
func ValidateBusinessName(name string) (bool, string) {
	name = strings.TrimSpace(name)
	if name == "" {
		return false, "Business name is required"
	}

	if len(name) < 2 {
		return false, "Business name must be at least 2 characters"
	}

	if len(name) > 255 {
		return false, "Business name must not exceed 255 characters"
	}

	return true, ""
}

// SanitizeString removes dangerous characters from string input
func SanitizeString2(input string) string {
	input = strings.TrimSpace(input)
	// Remove any potential script tags or HTML
	input = regexp.MustCompile(`<[^>]*>`).ReplaceAllString(input, "")
	return input
}

// ValidateWebsiteURL validates website URLs with lenient rules
// Accepts URLs with or without protocol, with or without www
func ValidateWebsiteURL(url string) (bool, string) {
	url = strings.TrimSpace(url)
	if url == "" {
		return false, "Website URL is required"
	}

	// Add protocol if missing
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		url = "https://" + url
	}

	// Basic URL validation - check for domain pattern
	// Must have at least one dot and valid characters
	if !strings.Contains(url, ".") {
		return false, "Website URL must contain a domain (e.g., example.com)"
	}

	// Check for valid characters (alphanumeric, dots, hyphens, slashes)
	// Must have at least one dot in the domain part
	validChars := regexp.MustCompile(`^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$`)
	if !validChars.MatchString(url) {
		return false, "Website URL contains invalid characters"
	}

	// Must have a valid TLD (at least 2 characters after last dot)
	parts := strings.Split(url, ".")
	if len(parts) < 2 {
		return false, "Website URL must have a valid domain extension"
	}

	lastPart := parts[len(parts)-1]
	// Remove any path after the domain
	if strings.Contains(lastPart, "/") {
		lastPart = strings.Split(lastPart, "/")[0]
	}
	if len(lastPart) < 2 {
		return false, "Website URL must have a valid domain extension (e.g., .com, .io)"
	}

	return true, ""
}
