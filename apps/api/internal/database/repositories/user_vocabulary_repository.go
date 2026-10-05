package repositories

import (
	"gorm.io/gorm"
)

// UserVocabularyRepository is the DB access layer for the user_vocabulary table.
//
// The read surface arrives with the module that needs it: no service queries
// this table yet, so there are no query methods to declare. WithTx is present
// from the start because every repository in this package carries it, and a
// transaction-scoped handle has to exist before the first write does. Add
// methods when a caller appears, not before.
type UserVocabularyRepository interface {
	WithTx(tx *gorm.DB) UserVocabularyRepository
}

type userVocabularyRepository struct {
	db *gorm.DB
}

// NewUserVocabularyRepository builds the repository over the shared DB handle.
func NewUserVocabularyRepository(db *gorm.DB) UserVocabularyRepository {
	return &userVocabularyRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *userVocabularyRepository) WithTx(tx *gorm.DB) UserVocabularyRepository {
	return &userVocabularyRepository{db: tx}
}
