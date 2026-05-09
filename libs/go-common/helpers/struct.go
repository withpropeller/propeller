package helpers

import (
	"encoding/json"
	"reflect"
	"strings"
	"time"
)

// StructToMap converts a struct to map[string]interface{} using JSON tags
// It automatically handles:
// - JSON tag names (camelCase)
// - Omitting empty fields if json tag has omitempty
// - Converting time.Time to Unix timestamps (default for APIs)
// - Nested structs
func StructToMap2(data interface{}) map[string]interface{} {
	result := make(map[string]interface{})

	val := reflect.ValueOf(data)
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}

	if val.Kind() != reflect.Struct {
		return result
	}

	typ := val.Type()

	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)
		fieldValue := val.Field(i)

		// Skip unexported fields
		if !field.IsExported() {
			continue
		}

		// Get JSON tag name
		jsonTag := field.Tag.Get("json")
		if jsonTag == "" || jsonTag == "-" {
			continue
		}

		// Parse json tag (handle omitempty)
		tagParts := strings.Split(jsonTag, ",")
		fieldName := tagParts[0]

		// Check if field should be omitted when empty
		omitEmpty := false
		for _, part := range tagParts[1:] {
			if part == "omitempty" {
				omitEmpty = true
				break
			}
		}

		// Skip zero values if omitempty is set
		if omitEmpty && fieldValue.IsZero() {
			continue
		}

		// Convert time.Time to Unix timestamp
		if fieldValue.Type() == reflect.TypeOf(time.Time{}) {
			timeVal := fieldValue.Interface().(time.Time)
			if !timeVal.IsZero() {
				result[fieldName] = timeVal.Unix()
			} else if !omitEmpty {
				result[fieldName] = 0
			}
			continue
		}

		// Handle pointers
		if fieldValue.Kind() == reflect.Ptr {
			if fieldValue.IsNil() {
				if !omitEmpty {
					result[fieldName] = nil
				}
				continue
			}
			fieldValue = fieldValue.Elem()
		}

		// Add field to result
		result[fieldName] = fieldValue.Interface()
	}

	return result
}

// StructToMapWithTimeISO converts a struct to map[string]interface{} with time.Time as ISO 8601 strings
// Use this only if you specifically need ISO 8601 format instead of Unix timestamps
func StructToMapWithTimeISO(data interface{}) map[string]interface{} {
	result := make(map[string]interface{})

	// Use JSON marshaling and unmarshaling for automatic conversion
	// This respects json tags and converts time.Time to ISO 8601
	jsonData, err := json.Marshal(data)
	if err != nil {
		return result
	}

	if err := json.Unmarshal(jsonData, &result); err != nil {
		return result
	}

	return result
}

// MergeStructToMap converts a struct to map and merges it with additional fields
// Useful when you want to add extra fields to a struct response
func MergeStructToMap(data interface{}, additionalFields map[string]interface{}) map[string]interface{} {
	result := StructToMap2(data)

	// Merge additional fields
	for key, value := range additionalFields {
		result[key] = value
	}

	return result
}

// StringValue safely dereferences a string pointer, returning empty string if nil
// Useful when working with optional string fields from database or structs
func StringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
