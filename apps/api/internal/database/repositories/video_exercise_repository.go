package repositories

import (
	"context"
	"engflex-api/internal/database/models"

	"gorm.io/gorm"
)

type VideoExerciseRepository interface {
	List(ctx context.Context, limit int, offset int) ([]*models.VideoExercise, error)
	GetByID(ctx context.Context, id string) (*models.VideoExercise, error)
	Create(ctx context.Context, lesson *models.VideoExercise) error
	Update(ctx context.Context, lesson *models.VideoExercise) error
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int64, error)
	WithTx(tx *gorm.DB) VideoExerciseRepository
}

type videoExerciseRepository struct {
	db *gorm.DB
}

func NewVideoExerciseRepository(db *gorm.DB) VideoExerciseRepository {
	return &videoExerciseRepository{db: db}
}
func (r *videoExerciseRepository) WithTx(tx *gorm.DB) VideoExerciseRepository {
	return &videoExerciseRepository{db: tx}
}

func (r *videoExerciseRepository) List(ctx context.Context, limit int, offset int) ([]*models.VideoExercise, error) {
	lessons := make([]*models.VideoExercise, 0)
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

func (r *videoExerciseRepository) GetByID(ctx context.Context, id string) (*models.VideoExercise, error) {
	var lesson models.VideoExercise
	_, err := parseID(id, "id")
	if err != nil {
		return nil, err
	}
	err = r.db.WithContext(ctx).First(&lesson, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &lesson, nil
}

func (r *videoExerciseRepository) Create(ctx context.Context, lesson *models.VideoExercise) error {
	return r.db.WithContext(ctx).Create(lesson).Error
}

func (r *videoExerciseRepository) Update(ctx context.Context, lesson *models.VideoExercise) error {
	result := r.db.WithContext(ctx).Save(lesson)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *videoExerciseRepository) Delete(ctx context.Context, id string) error {
	_, err := parseID(id, "id")
	if err != nil {
		return err
	}
	result := r.db.WithContext(ctx).Delete(&models.VideoExercise{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *videoExerciseRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.VideoExercise{}).Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}
