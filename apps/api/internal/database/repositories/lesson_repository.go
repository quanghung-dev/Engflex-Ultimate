package repositories

import (
	"context"

	"engflex-api/internal/database/models"

	"gorm.io/gorm"
)

type LessonRepository interface {
	GetByID(ctx context.Context, id string) (*models.Lesson, error)
	GetDetail(ctx context.Context, id string) (*models.Lesson, error)
	GetDetailBySlug(ctx context.Context, slug string) (*models.Lesson, error)
	WithTx(tx *gorm.DB) LessonRepository
}

type lessonRepository struct {
	db *gorm.DB
}

func NewLessonRepository(db *gorm.DB) LessonRepository {
	return &lessonRepository{db: db}
}

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

func (r *lessonRepository) GetDetailBySlug(ctx context.Context, slug string) (*models.Lesson, error) {
	var m models.Lesson
	if err := r.db.WithContext(ctx).Joins("Section").First(&m, "lessons.slug = ?", slug).Error; err != nil {
		return nil, err
	}
	activities := make([]*models.LessonActivity, 0)
	if err := r.db.WithContext(ctx).Where("lesson_id = ?", m.ID).Order("part_number asc").Find(&activities).Error; err != nil {
		return nil, err
	}
	m.Activities = activities
	return &m, nil
}
