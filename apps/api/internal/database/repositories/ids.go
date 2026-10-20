package repositories

import (
	"github.com/google/uuid"

	"engflex-api/internal/common"
)

func parseID(id, name string) (uuid.UUID, error) {
	parsed, err := uuid.Parse(id)
	if err != nil {
		return uuid.UUID{}, &common.InvalidIDError{Name: name}
	}
	return parsed, nil
}
