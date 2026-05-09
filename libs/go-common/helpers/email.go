package helpers

import (
	"bufio"
	"strings"
	"sync"

	"github.com/propeller/propeller/libs/go-common/assets"
)

var (
	blacklistedDomains map[string]bool
	emailOnce          sync.Once
	emailLoadError     error
)

// LoadBlacklistedDomains loads the email domain blacklist into memory
func LoadBlacklistedDomains() error {
	emailOnce.Do(func() {
		blacklistedDomains = make(map[string]bool)

		// Load from embedded assets
		data, err := assets.SharedAssets.ReadFile("blacklisted-email-domains.conf")
		if err != nil {
			emailLoadError = err
			return
		}

		scanner := bufio.NewScanner(strings.NewReader(string(data)))
		for scanner.Scan() {
			domain := strings.TrimSpace(scanner.Text())
			if domain != "" && !strings.HasPrefix(domain, "#") {
				blacklistedDomains[strings.ToLower(domain)] = true
			}
		}

		if err := scanner.Err(); err != nil {
			emailLoadError = err
		}
	})

	return emailLoadError
}

// IsBlacklistedDomain checks if an email domain is blacklisted (public domain)
func IsBlacklistedDomain(domain string) bool {
	if blacklistedDomains == nil {
		_ = LoadBlacklistedDomains()
	}
	return blacklistedDomains[strings.ToLower(domain)]
}

// IsPrivateEmailDomain checks if an email uses a private domain (not public like Gmail)
func IsPrivateEmailDomain(email string) bool {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return false
	}

	domain := strings.ToLower(parts[1])
	return !IsBlacklistedDomain(domain)
}

// ExtractEmailDomain extracts the domain from an email address
func ExtractEmailDomain(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return ""
	}
	return strings.ToLower(parts[1])
}

// ValidateEmail performs basic email validation
func ValidateEmail(email string) bool {
	email = strings.TrimSpace(email)
	if email == "" {
		return false
	}

	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return false
	}

	local, domain := parts[0], parts[1]
	if local == "" || domain == "" {
		return false
	}

	// Check for at least one dot in domain
	if !strings.Contains(domain, ".") {
		return false
	}

	return true
}
