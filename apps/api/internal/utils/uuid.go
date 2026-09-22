package utils

import (
	"github.com/google/uuid"
)

// ParseUUID parses a canonical UUID string.
func ParseUUID(raw string) (uuid.UUID, error) {
	return uuid.Parse(raw)
}

// MustUUID parses or panics (tests/fixtures only).
func MustUUID(raw string) uuid.UUID {
	return uuid.MustParse(raw)
}

// UUIDString renders uuid.UUID in canonical form.
func UUIDString(id uuid.UUID) string {
	return id.String()
}

// NewUUIDString generates a random UUID string.
func NewUUIDString() string {
	return uuid.NewString()
}
