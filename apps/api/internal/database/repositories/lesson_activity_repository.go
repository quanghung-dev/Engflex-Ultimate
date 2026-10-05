package repositories

import (
	"gorm.io/gorm"
)

// LessonActivityRepository is the DB access layer for the lesson_activities table.
//
// The read surface arrives with the module that needs it: no service queries
// this table yet, so there are no query methods to declare. WithTx is present
// from the start because every repository in this package carries it, and a
// transaction-scoped handle has to exist before the first write does. Add
// methods when a caller appears, not before.
type LessonActivityRepository interface {
	WithTx(tx *gorm.DB) LessonActivityRepository
}

type lessonActivityRepository struct {
	db *gorm.DB
}

// NewLessonActivityRepository builds the repository over the shared DB handle.
func NewLessonActivityRepository(db *gorm.DB) LessonActivityRepository {
	return &lessonActivityRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *lessonActivityRepository) WithTx(tx *gorm.DB) LessonActivityRepository {
	return &lessonActivityRepository{db: tx}
}
