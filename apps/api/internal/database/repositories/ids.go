package repositories

import (
	"github.com/google/uuid"

	"engflex-api/internal/common"
)

// parseID converts a string ID into uuid.UUID, returning a
// *common.InvalidIDError (mapped to 400 by FromDBError) on failure.
// Repositories own the string->uuid transform so services never parse IDs.
func parseID(id, name string) (uuid.UUID, error) {
	parsed, err := uuid.Parse(id)
	if err != nil {
		return uuid.UUID{}, &common.InvalidIDError{Name: name}
	}
	return parsed, nil
}
