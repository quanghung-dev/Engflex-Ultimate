package repositories

import (
	"context"

	"engflex-api/internal/database/models"

	"gorm.io/gorm"
)

// LessonRepository is the DB access layer for the lessons table (units on
// the path). The hub reads section-first via LessonSectionRepository;
// this repo answers single-unit reads.
type LessonRepository interface {
	GetByID(ctx context.Context, id string) (*models.Lesson, error)
	GetDetail(ctx context.Context, id string) (*models.Lesson, error)
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

func (r *lessonRepository) GetByID(ctx context.Context, id string) (*models.Lesson, error) {
	if _, err := parseID(id, "id"); err != nil {
		return nil, err
	}
	var m models.Lesson
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// GetDetail returns one unit with its section joined in a single round trip
// and its activities attached from a second query ordered by part_number.
// Activities stay out of the join: a has-many join would cartesian-duplicate
// the parent and break pagination.
func (r *lessonRepository) GetDetail(ctx context.Context, id string) (*models.Lesson, error) {
	if _, err := parseID(id, "id"); err != nil {
		return nil, err
	}
	var m models.Lesson
	if err := r.db.WithContext(ctx).Joins("Section").First(&m, "lessons.id = ?", id).Error; err != nil {
		return nil, err
	}
	activities := make([]*models.LessonActivity, 0)
	if err := r.db.WithContext(ctx).Where("lesson_id = ?", id).Order("part_number asc").Find(&activities).Error; err != nil {
		return nil, err
	}
	m.Activities = activities
	return &m, nil
}
