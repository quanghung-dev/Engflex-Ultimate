package repositories

import (
	"gorm.io/gorm"
)

// LessonCategoryRepository is the DB access layer for the lesson_categories table.
//
// The read surface arrives with the module that needs it: no service queries
// this table yet, so there are no query methods to declare. WithTx is present
// from the start because every repository in this package carries it, and a
// transaction-scoped handle has to exist before the first write does. Add
// methods when a caller appears, not before.
type LessonCategoryRepository interface {
	WithTx(tx *gorm.DB) LessonCategoryRepository
}

type lessonCategoryRepository struct {
	db *gorm.DB
}

// NewLessonCategoryRepository builds the repository over the shared DB handle.
func NewLessonCategoryRepository(db *gorm.DB) LessonCategoryRepository {
	return &lessonCategoryRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *lessonCategoryRepository) WithTx(tx *gorm.DB) LessonCategoryRepository {
	return &lessonCategoryRepository{db: tx}
}
