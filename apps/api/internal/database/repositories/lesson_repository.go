package repositories

import (
	"context"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"

	"gorm.io/gorm"
)

// LessonRepository is the DB access layer for the lessons table.
// GetDetail reads two more tables (Category, Activities) in one call. It
// lives here because it returns a lesson; the file is named for what comes
// back, not for every table the SQL happens to touch.
type LessonRepository interface {
	List(ctx context.Context, categoryID *string, level enums.CEFR, limit, offset int) ([]*models.Lesson, error)
	Count(ctx context.Context, categoryID *string, level enums.CEFR) (int64, error)
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

func (r *lessonRepository) List(ctx context.Context, categoryID *string, level enums.CEFR, limit, offset int) ([]*models.Lesson, error) {
	q := r.db.WithContext(ctx).Model(&models.Lesson{}).Joins("Category")
	if categoryID != nil && *categoryID != "" {
		q = q.Where("lessons.category_id = ?", *categoryID)
	}
	if level != "" {
		q = q.Where("lessons.cefr_level = ?", string(level))
	}
	var out []*models.Lesson
	if err := q.Order("lessons.created_at DESC").Limit(limit).Offset(offset).Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func (r *lessonRepository) Count(ctx context.Context, categoryID *string, level enums.CEFR) (int64, error) {
	q := r.db.WithContext(ctx).Model(&models.Lesson{})
	if categoryID != nil && *categoryID != "" {
		q = q.Where("category_id = ?", *categoryID)
	}
	if level != "" {
		q = q.Where("cefr_level = ?", string(level))
	}
	var n int64
	if err := q.Count(&n).Error; err != nil {
		return 0, err
	}
	return n, nil
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

// GetDetail returns one lesson with its category joined in a single round
// trip and its activities attached from a second query ordered by
// part_number. Activities stay out of the join: a has-many join would
// cartesian-duplicate the parent and break pagination.
func (r *lessonRepository) GetDetail(ctx context.Context, id string) (*models.Lesson, error) {
	if _, err := parseID(id, "id"); err != nil {
		return nil, err
	}
	var m models.Lesson
	if err := r.db.WithContext(ctx).Joins("Category").First(&m, "lessons.id = ?", id).Error; err != nil {
		return nil, err
	}
	activities := make([]*models.LessonActivity, 0)
	if err := r.db.WithContext(ctx).Where("lesson_id = ?", id).Order("part_number asc").Find(&activities).Error; err != nil {
		return nil, err
	}
	m.Activities = activities
	return &m, nil
}
