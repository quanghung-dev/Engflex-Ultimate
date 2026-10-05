package repositories

import (
	"gorm.io/gorm"
)

// AttemptRepository is the DB access layer for the attempts table.
//
// The read surface arrives with the module that needs it: no service queries
// this table yet, so there are no query methods to declare. WithTx is present
// from the start because every repository in this package carries it, and a
// transaction-scoped handle has to exist before the first write does. Add
// methods when a caller appears, not before.
type AttemptRepository interface {
	WithTx(tx *gorm.DB) AttemptRepository
}

type attemptRepository struct {
	db *gorm.DB
}

// NewAttemptRepository builds the repository over the shared DB handle.
func NewAttemptRepository(db *gorm.DB) AttemptRepository {
	return &attemptRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *attemptRepository) WithTx(tx *gorm.DB) AttemptRepository {
	return &attemptRepository{db: tx}
}
