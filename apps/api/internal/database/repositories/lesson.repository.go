package repositories

import (
	"context"
	"engflex-api/internal/database/models"

	"gorm.io/gorm"
)

type LessonRepository interface {
	List(ctx context.Context, limit int, offset int) ([]*models.Lesson, error)
	GetByID(ctx context.Context, id string) (*models.Lesson, error)
	Create(ctx context.Context, lesson *models.Lesson) error
	Update(ctx context.Context, lesson *models.Lesson) error
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int64, error)
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

func (r *lessonRepository) List(ctx context.Context, limit int, offset int) ([]*models.Lesson, error) {
	var lessons []*models.Lesson
	query := r.db.WithContext(ctx).Order("id asc")
	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}
	err := query.Find(&lessons).Error
	if err != nil {
		return nil, err
	}
	return lessons, nil
}

func (r *lessonRepository) GetByID(ctx context.Context, id string) (*models.Lesson, error) {
	var lesson models.Lesson
	uintID, err := parseUintID(id, "id")
	if err != nil {
		return nil, err
	}
	err = r.db.WithContext(ctx).First(&lesson, uintID).Error
	if err != nil {
		return nil, err
	}
	return &lesson, nil
}

func (r *lessonRepository) Create(ctx context.Context, lesson *models.Lesson) error {
	return r.db.WithContext(ctx).Create(lesson).Error
}

func (r *lessonRepository) Update(ctx context.Context, lesson *models.Lesson) error {
	result := r.db.WithContext(ctx).Save(lesson)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *lessonRepository) Delete(ctx context.Context, id string) error {
	uintID, err := parseUintID(id, "id")
	if err != nil {
		return err
	}
	result := r.db.WithContext(ctx).Delete(&models.Lesson{}, uintID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *lessonRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Lesson{}).Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}
