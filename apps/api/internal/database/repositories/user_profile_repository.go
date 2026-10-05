package repositories

import (
	"gorm.io/gorm"
)

// UserProfileRepository is the DB access layer for the user_profiles table.
//
// The read surface arrives with the module that needs it: no service queries
// this table yet, so there are no query methods to declare. WithTx is present
// from the start because every repository in this package carries it, and a
// transaction-scoped handle has to exist before the first write does. Add
// methods when a caller appears, not before.
type UserProfileRepository interface {
	WithTx(tx *gorm.DB) UserProfileRepository
}

type userProfileRepository struct {
	db *gorm.DB
}

// NewUserProfileRepository builds the repository over the shared DB handle.
func NewUserProfileRepository(db *gorm.DB) UserProfileRepository {
	return &userProfileRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *userProfileRepository) WithTx(tx *gorm.DB) UserProfileRepository {
	return &userProfileRepository{db: tx}
}
