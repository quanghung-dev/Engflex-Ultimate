package repositories

import (
	"gorm.io/gorm"
)

// LessonBookmarkRepository is the DB access layer for the lesson_bookmarks table.
//
// The read surface arrives with the module that needs it: no service queries
// this table yet, so there are no query methods to declare. WithTx is present
// from the start because every repository in this package carries it, and a
// transaction-scoped handle has to exist before the first write does. Add
// methods when a caller appears, not before.
type LessonBookmarkRepository interface {
	WithTx(tx *gorm.DB) LessonBookmarkRepository
}

type lessonBookmarkRepository struct {
	db *gorm.DB
}

// NewLessonBookmarkRepository builds the repository over the shared DB handle.
func NewLessonBookmarkRepository(db *gorm.DB) LessonBookmarkRepository {
	return &lessonBookmarkRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *lessonBookmarkRepository) WithTx(tx *gorm.DB) LessonBookmarkRepository {
	return &lessonBookmarkRepository{db: tx}
}
