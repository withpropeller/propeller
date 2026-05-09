package response

import (
	"github.com/gin-gonic/gin"

	"github.com/propeller/propeller/libs/go-common/errors"
)

// Response represents a standard API response
type Response struct {
	Code     string      `json:"code"`
	Message  string      `json:"message"`
	Data     interface{} `json:"data,omitempty"`
	Metadata interface{} `json:"metadata,omitempty"`
	Errors   interface{} `json:"errors,omitempty"`
}

// Success sends a success response
func Success(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, Response{
		Code:    "success",
		Message: message,
		Data:    data,
	})
}

// Error sends an error response
func Error(c *gin.Context, err error) {
	appErr, ok := err.(*errors.AppError)
	if !ok {
		// Unknown error, return internal server error
		appErr = errors.ErrInternalServerError.WithError(err)
	}

	res := Response{
		Code:    appErr.Code,
		Message: appErr.Message,
	}
	if appErr.Err != nil {
		res.Errors = appErr.Err.Error()
	}
	c.JSON(appErr.StatusCode, res)
}

// ValidationError sends a validation error response
func ValidationError(c *gin.Context, message string, validationErrors interface{}) {
	c.JSON(422, Response{
		Code:    errors.CodeValidationError,
		Message: message,
		Errors:  validationErrors,
	})
}

// OK sends a 200 OK response with data
func OK(c *gin.Context, data interface{}) {
	Success(c, 200, "Success", data)
}

// Created sends a 201 Created response
func Created(c *gin.Context, data interface{}, messages ...string) {
	message := "Resource created"
	if len(messages) > 0 {
		message = messages[0]
	}
	Success(c, 201, message, data)
}

// NoContent sends a 204 No Content response
func NoContent(c *gin.Context) {
	c.Status(204)
}

// SuccessWithMetadata sends a success response with metadata at top level
func SuccessWithMetadata(c *gin.Context, statusCode int, message string, data interface{}, metadata interface{}) {
	c.JSON(statusCode, Response{
		Code:     "success",
		Message:  message,
		Data:     data,
		Metadata: metadata,
	})
}
