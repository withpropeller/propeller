package helpers

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"

	apperrors "github.com/propeller/propeller/libs/go-common/errors"
	"github.com/propeller/propeller/libs/go-common/response"
)

// BindAndValidateJSON binds JSON request body to a struct and validates it
// Returns true if successful, false if there was an error (error response already sent)
func BindAndValidateJSON(c *gin.Context, req interface{}) bool {
	// Attempt to bind JSON
	if err := c.ShouldBindJSON(req); err != nil {
		// Check if it's a JSON unmarshaling type error
		if jsonErr, ok := err.(*json.UnmarshalTypeError); ok {
			handleUnmarshalTypeError(c, jsonErr)
			return false
		}

		// Check if it's a JSON syntax error
		if syntaxErr, ok := err.(*json.SyntaxError); ok {
			response.ValidationError(c, "Invalid JSON syntax", map[string]string{
				"json": fmt.Sprintf("Syntax error at position %d", syntaxErr.Offset),
			})
			return false
		}

		// Generic binding error
		response.Error(c, apperrors.ErrBadRequest.WithMessage("invalid-request"))
		return false
	}

	// Validate the struct
	if valid, validationErrors := ValidateStruct(req); !valid {
		response.ValidationError(c, "Validation failed", validationErrors)
		return false
	}

	return true
}

// BindAndValidateQuery binds query parameters to a struct and validates it
// Returns true if successful, false if there was an error (error response already sent)
func BindAndValidateQuery(c *gin.Context, req interface{}) bool {
	// Attempt to bind query parameters
	if err := c.ShouldBindQuery(req); err != nil {
		response.Error(c, apperrors.ErrBadRequest.WithMessage("invalid-query-parameters"))
		return false
	}

	// Validate the struct
	if valid, validationErrors := ValidateStruct(req); !valid {
		response.ValidationError(c, "Validation failed", validationErrors)
		return false
	}

	return true
}

// BindAndValidateURI binds URI parameters to a struct and validates it
// Returns true if successful, false if there was an error (error response already sent)
func BindAndValidateURI(c *gin.Context, req interface{}) bool {
	// Attempt to bind URI parameters
	if err := c.ShouldBindUri(req); err != nil {
		response.Error(c, apperrors.ErrBadRequest.WithMessage("invalid-uri-parameters"))
		return false
	}

	// Validate the struct
	if valid, validationErrors := ValidateStruct(req); !valid {
		response.ValidationError(c, "Validation failed", validationErrors)
		return false
	}

	return true
}

// handleUnmarshalTypeError handles JSON type mismatch errors with detailed messages
func handleUnmarshalTypeError(c *gin.Context, jsonErr *json.UnmarshalTypeError) {
	fieldName := jsonErr.Field
	expectedType := jsonErr.Type.String()
	actualValue := jsonErr.Value

	// Convert field name to camelCase for consistency
	camelCaseField := convertToCamelCase(fieldName)

	// Create user-friendly error message based on expected type
	var errorMessage string
	switch expectedType {
	case "bool":
		errorMessage = fmt.Sprintf("%s must be a boolean value (true or false), received: %s",
			camelCaseField, actualValue)
	case "int", "int64", "int32":
		errorMessage = fmt.Sprintf("%s must be a valid integer, received: %s",
			camelCaseField, actualValue)
	case "float64", "float32":
		errorMessage = fmt.Sprintf("%s must be a valid number, received: %s",
			camelCaseField, actualValue)
	case "string":
		errorMessage = fmt.Sprintf("%s must be a string, received: %s",
			camelCaseField, actualValue)
	default:
		errorMessage = fmt.Sprintf("%s must be a valid %s, received: %s",
			camelCaseField, expectedType, actualValue)
	}

	response.ValidationError(c, "Invalid request data", map[string]string{
		camelCaseField: errorMessage,
	})
}

// convertToCamelCase converts a field name to camelCase
func convertToCamelCase(fieldName string) string {
	if fieldName == "" {
		return fieldName
	}

	// Handle nested fields (e.g., "User.FirstName" -> "user.firstName")
	if strings.Contains(fieldName, ".") {
		parts := strings.Split(fieldName, ".")
		for i, part := range parts {
			parts[i] = strings.ToLower(part[:1]) + part[1:]
		}
		return strings.Join(parts, ".")
	}

	return strings.ToLower(fieldName[:1]) + fieldName[1:]
}
