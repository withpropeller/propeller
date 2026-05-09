package helpers

import (
	"fmt"
	"reflect"
	"strings"
	"sync"

	"github.com/go-playground/validator/v10"
	"github.com/nyaruka/phonenumbers"
)

var (
	validate *validator.Validate
	once     sync.Once
)

// GetValidator returns a singleton validator instance
func GetValidator() *validator.Validate {
	once.Do(func() {
		validate = validator.New()

		// Register function to get JSON field name
		validate.RegisterTagNameFunc(func(fld reflect.StructField) string {
			name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
			if name == "-" {
				return ""
			}
			return name
		})

		// Register custom validators
		registerCustomValidators(validate)
	})
	return validate
}

// registerCustomValidators registers custom validation rules
func registerCustomValidators(v *validator.Validate) {
	// Register boolean validator (validates that field is a boolean type)
	if err := v.RegisterValidation("boolean", func(fl validator.FieldLevel) bool {
		// This just checks that the field is a boolean type
		// The actual validation happens at the type level in Go
		return fl.Field().Kind() == reflect.Bool
	}); err != nil {
		panic(fmt.Sprintf("failed to register boolean validator: %v", err))
	}

	// Register E164 phone validator using libphonenumber
	if err := v.RegisterValidation("e164", func(fl validator.FieldLevel) bool {
		phone := fl.Field().String()
		if phone == "" {
			return true // Let required handle empty values
		}

		// Parse phone number with region "ZZ" (unknown region)
		// This forces E.164 format validation (must have + prefix)
		num, err := phonenumbers.Parse(phone, "ZZ")
		if err != nil {
			return false
		}

		// Validate that it's a valid E.164 number
		if !phonenumbers.IsValidNumber(num) {
			return false
		}

		// Ensure it's in E.164 format (starts with +)
		formatted := phonenumbers.Format(num, phonenumbers.E164)
		return formatted == phone
	}); err != nil {
		panic(fmt.Sprintf("failed to register e164 validator: %v", err))
	}

	// Register lenient website URL validator
	if err := v.RegisterValidation("website", func(fl validator.FieldLevel) bool {
		url := fl.Field().String()
		if url == "" {
			return true // Let required handle empty values
		}
		valid, _ := ValidateWebsiteURL(url)
		return valid
	}); err != nil {
		panic(fmt.Sprintf("failed to register website validator: %v", err))
	}

	// Register industry validator
	if err := v.RegisterValidation("industry", func(fl validator.FieldLevel) bool {
		industry := fl.Field().String()
		if industry == "" {
			return true // Let required handle empty values
		}

		validIndustries := []string{
			"technology", "healthcare", "finance", "retail",
			"manufacturing", "education", "agriculture",
			"real_estate", "transportation", "energy",
			"hospitality", "other",
		}

		for _, valid := range validIndustries {
			if industry == valid {
				return true
			}
		}
		return false
	}); err != nil {
		panic(fmt.Sprintf("failed to register industry validator: %v", err))
	}

}

// FormatValidationErrors converts validator errors to user-friendly messages
// Field names are returned in camelCase (from JSON tags)
func FormatValidationErrors(err error) map[string]string {
	errors := make(map[string]string)

	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			// Field() returns the JSON tag name (camelCase) due to RegisterTagNameFunc
			field := e.Field()
			errors[field] = formatFieldError(e)
		}
	}

	return errors
}

// formatFieldError formats a single field error
func formatFieldError(e validator.FieldError) string {
	switch e.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", e.Field())
	case "email":
		return fmt.Sprintf("%s must be a valid email address", e.Field())
	case "min":
		return fmt.Sprintf("%s must be at least %s characters", e.Field(), e.Param())
	case "max":
		return fmt.Sprintf("%s must not exceed %s characters", e.Field(), e.Param())
	case "len":
		return fmt.Sprintf("%s must be exactly %s characters", e.Field(), e.Param())
	case "e164":
		return fmt.Sprintf("%s must be a valid phone number in E.164 format (e.g., +1234567890)", e.Field())
	case "url":
		return fmt.Sprintf("%s must be a valid URL", e.Field())
	case "website":
		return fmt.Sprintf("%s must be a valid website URL (e.g., example.com or www.example.com)", e.Field())
	case "industry":
		return fmt.Sprintf("%s must be one of: technology, healthcare, finance, retail, manufacturing, education, agriculture, real_estate, transportation, energy, hospitality, other", e.Field())
	case "oneof":
		return fmt.Sprintf("%s must be one of: %s", e.Field(), e.Param())
	case "gte":
		return fmt.Sprintf("%s must be greater than or equal to %s", e.Field(), e.Param())
	case "lte":
		return fmt.Sprintf("%s must be less than or equal to %s", e.Field(), e.Param())
	case "gt":
		return fmt.Sprintf("%s must be greater than %s", e.Field(), e.Param())
	case "lt":
		return fmt.Sprintf("%s must be less than %s", e.Field(), e.Param())
	default:
		return fmt.Sprintf("%s is invalid", e.Field())
	}
}

// ValidateStruct validates a struct and returns formatted errors
func ValidateStruct(s interface{}) (bool, map[string]string) {
	v := GetValidator()
	err := v.Struct(s)

	if err == nil {
		return true, nil
	}

	return false, FormatValidationErrors(err)
}
