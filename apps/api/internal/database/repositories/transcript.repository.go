package repositories

import (
	"context"

	"engflex-api/internal/database/models"

	"gorm.io/gorm"
)

type TranscriptRepository interface {
	List(ctx context.Context, limit, offset int) ([]*models.Transcript, error)
	GetByID(ctx context.Context, id string) (*models.Transcript, error)
	GetByLessonID(ctx context.Context, lessonID string) ([]*models.Transcript, error)
	Create(ctx context.Context, transcript *models.Transcript) error
	Update(ctx context.Context, transcript *models.Transcript) error
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int64, error)
	WithTx(tx *gorm.DB) TranscriptRepository
}

type transcriptRepository struct {
	db *gorm.DB
}

func NewTranscriptRepository(db *gorm.DB) TranscriptRepository {
	return &transcriptRepository{db: db}
}

func (r *transcriptRepository) Create(ctx context.Context, transcript *models.Transcript) error {
	return r.db.WithContext(ctx).Create(transcript).Error
}

func (r *transcriptRepository) Update(ctx context.Context, transcript *models.Transcript) error {
	result := r.db.WithContext(ctx).Save(transcript)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *transcriptRepository) Delete(ctx context.Context, id string) error {
	uintID, err := parseUintID(id, "id")
	if err != nil {
		return err
	}
	result := r.db.WithContext(ctx).Delete(&models.Transcript{}, uintID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *transcriptRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Transcript{}).Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *transcriptRepository) List(ctx context.Context, limit, offset int) ([]*models.Transcript, error) {
	transcripts := make([]*models.Transcript, 0)
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

func (r *transcriptRepository) GetByID(ctx context.Context, id string) (*models.Transcript, error) {
	var transcript models.Transcript
	uintID, err := parseUintID(id, "id")
	if err != nil {
		return nil, err
	}
	err = r.db.WithContext(ctx).First(&transcript, uintID).Error
	if err != nil {
		return nil, err
	}
	return &transcript, nil
}

func (r *transcriptRepository) GetByLessonID(ctx context.Context, lessonID string) ([]*models.Transcript, error) {
	transcripts := make([]*models.Transcript, 0)
	uintLessonID, err := parseUintID(lessonID, "lesson_id")
	if err != nil {
		return nil, err
	}
	err = r.db.WithContext(ctx).Where("lesson_id = ?", uintLessonID).Order("sequence asc").Find(&transcripts).Error
	if err != nil {
		return nil, err
	}
	return transcripts, nil
}

func (r *transcriptRepository) WithTx(tx *gorm.DB) TranscriptRepository {
	return &transcriptRepository{db: tx}
}
