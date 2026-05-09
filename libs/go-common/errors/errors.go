package errors

import (
	"fmt"
	"net/http"
)

// AppError represents an application error with HTTP status
type AppError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	StatusCode int    `json:"-"`
	Err        error  `json:"-"`
}

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

// Unwrap returns the underlying error
func (e *AppError) Unwrap() error {
	return e.Err
}

// New creates a new AppError
func New(code, message string, statusCode int) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		StatusCode: statusCode,
	}
}

// Wrap wraps an existing error with application context
func Wrap(err error, code, message string, statusCode int) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		StatusCode: statusCode,
		Err:        err,
	}
}

// Common error codes (kebab-case)
const (
	CodeBadRequest          = "bad-request"
	CodeUnauthorized        = "unauthorized"
	CodeForbidden           = "forbidden"
	CodeNotFound            = "not-found"
	CodeConflict            = "conflict"
	CodeDomainAlreadyExists = "domain-already-exists"
	CodeInternalServerError = "internal-server-error"
	CodeValidationError     = "validation-error"
)

// Common errors
var (
	ErrBadRequest          = New(CodeBadRequest, "Bad request", http.StatusBadRequest)
	ErrUnauthorized        = New(CodeUnauthorized, "Unauthorized", http.StatusUnauthorized)
	ErrForbidden           = New(CodeForbidden, "Forbidden", http.StatusForbidden)
	ErrNotFound            = New(CodeNotFound, "Resource not found", http.StatusNotFound)
	ErrConflict            = New(CodeConflict, "Resource conflict", http.StatusConflict)
	ErrDomainAlreadyExists = New(CodeDomainAlreadyExists, "Email domain already registered", http.StatusConflict)
	ErrInternalServerError = New(CodeInternalServerError, "Internal server error", http.StatusInternalServerError)
	ErrValidation          = New(CodeValidationError, "Validation error", http.StatusUnprocessableEntity)
)

// WithMessage returns a copy of the error with a new message
func (e *AppError) WithMessage(message string) *AppError {
	return &AppError{
		Code:       e.Code,
		Message:    message,
		StatusCode: e.StatusCode,
		Err:        e.Err,
	}
}

// WithError returns a copy of the error with a wrapped error
func (e *AppError) WithError(err error) *AppError {
	return &AppError{
		Code:       e.Code,
		Message:    e.Message,
		StatusCode: e.StatusCode,
		Err:        err,
	}
}
