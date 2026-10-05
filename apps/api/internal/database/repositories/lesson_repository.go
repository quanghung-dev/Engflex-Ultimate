package repositories

import (
	"gorm.io/gorm"
)

// LessonRepository is the DB access layer for the lessons table.
//
// The read surface arrives with the module that needs it: no service queries
// this table yet, so there are no query methods to declare. WithTx is present
// from the start because every repository in this package carries it, and a
// transaction-scoped handle has to exist before the first write does. Add
// methods when a caller appears, not before.
type LessonRepository interface {
	WithTx(tx *gorm.DB) LessonRepository
}

type lessonRepository struct {
	db *gorm.DB
}

// NewLessonRepository builds the repository over the shared DB handle.
func NewLessonRepository(db *gorm.DB) LessonRepository {
	return &lessonRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *lessonRepository) WithTx(tx *gorm.DB) LessonRepository {
	return &lessonRepository{db: tx}
}
