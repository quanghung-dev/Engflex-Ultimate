package common

import (
	"errors"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

// AppError is the shared API error type. Status always uses a net/http
// status code constant (never a hardcoded integer) at the call site, e.g.
// common.NotFound(), common.BadRequest("name is required").
type AppError struct {
	Status  int
	Message string
}

// Error implements the error interface.
func (e *AppError) Error() string {
	return e.Message
}

// New builds an *AppError for any HTTP status code. When msg is omitted or
// blank, the message defaults to http.StatusText(status).
func New(status int, msg ...string) *AppError {
	return &AppError{
		Status:  status,
		Message: firstNonBlankOrDefault(msg, defaultMessageFor(status)),
	}
}

// BadRequest creates a 400 error.
func BadRequest(msg ...string) *AppError {
	return New(http.StatusBadRequest, msg...)
}

// Unauthorized creates a 401 error.
func Unauthorized(msg ...string) *AppError {
	return New(http.StatusUnauthorized, msg...)
}

// Forbidden creates a 403 error.
func Forbidden(msg ...string) *AppError {
	return New(http.StatusForbidden, msg...)
}

// NotFound creates a 404 error.
func NotFound(msg ...string) *AppError {
	return New(http.StatusNotFound, msg...)
}

// Conflict creates a 409 error.
func Conflict(msg ...string) *AppError {
	return New(http.StatusConflict, msg...)
}

// UnprocessableEntity creates a 422 error.
func UnprocessableEntity(msg ...string) *AppError {
	return New(http.StatusUnprocessableEntity, msg...)
}

// TooManyRequests creates a 429 error.
func TooManyRequests(msg ...string) *AppError {
	return New(http.StatusTooManyRequests, msg...)
}

// Internal creates a 500 error.
func Internal(msg ...string) *AppError {
	return New(http.StatusInternalServerError, msg...)
}

// InvalidIDError reports a malformed ID for a named ID field.
// Repositories return it when a string ID cannot be parsed; FromDBError
// maps it to 400 so malformed IDs never reach the database.
type InvalidIDError struct {
	Name string // e.g. "id", "contentId", "attemptId"
}

func (e *InvalidIDError) Error() string {
	return "invalid " + e.Name
}

// FromDBError maps database errors to API errors: not found -> 404, unique
// violation (23505) -> 409, foreign-key violation (23503) -> 404, anything
// else -> 500 with the details hidden.
func FromDBError(err error, resource string) *AppError {
	if err == nil {
		return nil
	}
	var idErr *InvalidIDError
	if errors.As(err, &idErr) {
		return BadRequest(idErr.Error())
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return NotFound(resource + " not found")
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505":
			return Conflict(resource + " already exists")
		case "23503":
			return NotFound("referenced " + resource + " not found")
		}
	}
	return Internal()
}

// ServiceUnavailable creates a 503 error.
func ServiceUnavailable(msg ...string) *AppError {
	return New(http.StatusServiceUnavailable, msg...)
}

func defaultMessageFor(status int) string {
	if text := http.StatusText(status); text != "" {
		return text
	}
	return "Unknown error"
}

func firstNonBlankOrDefault(msgs []string, fallback string) string {
	for _, m := range msgs {
		if strings.TrimSpace(m) != "" {
			return m
		}
	}
	return fallback
}
