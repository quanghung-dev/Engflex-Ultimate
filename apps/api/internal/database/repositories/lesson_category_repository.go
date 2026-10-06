package repositories

import (
	"context"

	"engflex-api/internal/database/models"

	"gorm.io/gorm"
)

// LessonCategoryRepository is the DB access layer for the lesson_categories table.
type LessonCategoryRepository interface {
	List(ctx context.Context, limit, offset int) ([]*models.LessonCategory, error)
	Count(ctx context.Context) (int64, error)
	GetByID(ctx context.Context, id string) (*models.LessonCategory, error)
	GetBySlug(ctx context.Context, slug string) (*models.LessonCategory, error)
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

func (r *lessonCategoryRepository) List(ctx context.Context, limit, offset int) ([]*models.LessonCategory, error) {
	var out []*models.LessonCategory
	if err := r.db.WithContext(ctx).Order("name asc").Limit(limit).Offset(offset).Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func (r *lessonCategoryRepository) Count(ctx context.Context) (int64, error) {
	var n int64
	if err := r.db.WithContext(ctx).Model(&models.LessonCategory{}).Count(&n).Error; err != nil {
		return 0, err
	}
	return n, nil
}

func (r *lessonCategoryRepository) GetByID(ctx context.Context, id string) (*models.LessonCategory, error) {
	if _, err := parseID(id, "id"); err != nil {
		return nil, err
	}
	var m models.LessonCategory
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *lessonCategoryRepository) GetBySlug(ctx context.Context, slug string) (*models.LessonCategory, error) {
	var m models.LessonCategory
	if err := r.db.WithContext(ctx).First(&m, "slug = ?", slug).Error; err != nil {
		return nil, err
	}
	return &m, nil
}
