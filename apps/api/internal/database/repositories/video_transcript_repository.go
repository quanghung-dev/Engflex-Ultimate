package repositories

import (
	"context"

	"engflex-api/internal/database/models"

	"gorm.io/gorm"
)

type VideoTranscriptRepository interface {
	List(ctx context.Context, limit, offset int) ([]*models.VideoTranscript, error)
	GetByID(ctx context.Context, id string) (*models.VideoTranscript, error)
	GetByVideoExerciseID(ctx context.Context, videoExerciseID string) ([]*models.VideoTranscript, error)
	Create(ctx context.Context, transcript *models.VideoTranscript) error
	Update(ctx context.Context, transcript *models.VideoTranscript) error
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int64, error)
	WithTx(tx *gorm.DB) VideoTranscriptRepository
}

type videoTranscriptRepository struct {
	db *gorm.DB
}

func NewVideoTranscriptRepository(db *gorm.DB) VideoTranscriptRepository {
	return &videoTranscriptRepository{db: db}
}

func (r *videoTranscriptRepository) Create(ctx context.Context, transcript *models.VideoTranscript) error {
	return r.db.WithContext(ctx).Create(transcript).Error
}

func (r *videoTranscriptRepository) Update(ctx context.Context, transcript *models.VideoTranscript) error {
	result := r.db.WithContext(ctx).Save(transcript)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *videoTranscriptRepository) Delete(ctx context.Context, id string) error {
	_, err := parseID(id, "id")
	if err != nil {
		return err
	}
	result := r.db.WithContext(ctx).Delete(&models.VideoTranscript{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *videoTranscriptRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.VideoTranscript{}).Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *videoTranscriptRepository) List(ctx context.Context, limit, offset int) ([]*models.VideoTranscript, error) {
	transcripts := make([]*models.VideoTranscript, 0)
	query := r.db.WithContext(ctx).Order("id asc")
	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}
	err := query.Find(&transcripts).Error
	if err != nil {
		return nil, err
	}
	return transcripts, nil
}

func (r *videoTranscriptRepository) GetByID(ctx context.Context, id string) (*models.VideoTranscript, error) {
	var transcript models.VideoTranscript
	_, err := parseID(id, "id")
	if err != nil {
		return nil, err
	}
	err = r.db.WithContext(ctx).First(&transcript, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &transcript, nil
}

func (r *videoTranscriptRepository) GetByVideoExerciseID(ctx context.Context, videoExerciseID string) ([]*models.VideoTranscript, error) {
	transcripts := make([]*models.VideoTranscript, 0)
	_, err := parseID(videoExerciseID, "video_exercise_id")
	if err != nil {
		return nil, err
	}
	err = r.db.WithContext(ctx).Where("video_exercise_id = ?", videoExerciseID).Order("sequence asc").Find(&transcripts).Error
	if err != nil {
		return nil, err
	}
	return transcripts, nil
}

func (r *videoTranscriptRepository) WithTx(tx *gorm.DB) VideoTranscriptRepository {
	return &videoTranscriptRepository{db: tx}
}
