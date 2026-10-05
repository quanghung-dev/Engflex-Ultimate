package repositories

import (
	"gorm.io/gorm"
)

// VocabularyItemRepository is the DB access layer for the vocabulary_items table.
//
// The read surface arrives with the module that needs it: no service queries
// this table yet, so there are no query methods to declare. WithTx is present
// from the start because every repository in this package carries it, and a
// transaction-scoped handle has to exist before the first write does. Add
// methods when a caller appears, not before.
type VocabularyItemRepository interface {
	WithTx(tx *gorm.DB) VocabularyItemRepository
}

type vocabularyItemRepository struct {
	db *gorm.DB
}

// NewVocabularyItemRepository builds the repository over the shared DB handle.
func NewVocabularyItemRepository(db *gorm.DB) VocabularyItemRepository {
	return &vocabularyItemRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *vocabularyItemRepository) WithTx(tx *gorm.DB) VocabularyItemRepository {
	return &vocabularyItemRepository{db: tx}
}
