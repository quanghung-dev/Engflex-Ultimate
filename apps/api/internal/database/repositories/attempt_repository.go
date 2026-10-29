package repositories

import (
	"context"
	"time"

	"gorm.io/gorm"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
)

type AttemptRepository interface {
	Create(ctx context.Context, m *models.Attempt) error
	GetByID(ctx context.Context, id string) (*models.Attempt, error)
	GetOpenAttempt(ctx context.Context, userID, lessonID string) (*models.Attempt, error)
	Update(ctx context.Context, m *models.Attempt) error
	ListCompletedDays(ctx context.Context, userID string, since time.Time) ([]string, error)
	CountCompleted(ctx context.Context, userID string) (int64, error)
	ListLessonAttempts(ctx context.Context, userID string) ([]*models.Attempt, error)
	ListCompletedVideo(ctx context.Context, userID string, videoExerciseIDs []string) ([]*models.Attempt, error)
	GetVideoAttempt(ctx context.Context, userID, videoExerciseID string, attemptType enums.AttemptType) (*models.Attempt, error)
	WithTx(tx *gorm.DB) AttemptRepository
}

type attemptRepository struct {
	db *gorm.DB
}

func NewAttemptRepository(db *gorm.DB) AttemptRepository {
	return &attemptRepository{db: db}
}

func (r *attemptRepository) Create(ctx context.Context, m *models.Attempt) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *attemptRepository) GetByID(ctx context.Context, id string) (*models.Attempt, error) {
	var m models.Attempt
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *attemptRepository) GetOpenAttempt(ctx context.Context, userID, lessonID string) (*models.Attempt, error) {
	var m models.Attempt
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND lesson_id = ? AND status = ?", userID, lessonID, enums.AttemptStatusInProgress).
		Order("created_at DESC").First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *attemptRepository) Update(ctx context.Context, m *models.Attempt) error {
	return r.db.WithContext(ctx).Save(m).Error
}

func (r *attemptRepository) ListCompletedDays(ctx context.Context, userID string, since time.Time) ([]string, error) {
	var days []string
	err := r.db.WithContext(ctx).Model(&models.Attempt{}).
		Select("DISTINCT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')").
		Where("user_id = ? AND status = ? AND created_at >= ?", userID, enums.AttemptStatusCompleted, since).
		Scan(&days).Error
	return days, err
}

func (r *attemptRepository) CountCompleted(ctx context.Context, userID string) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&models.Attempt{}).
		Where("user_id = ? AND status = ?", userID, enums.AttemptStatusCompleted).
		Count(&n).Error
	return n, err
}

func (r *attemptRepository) ListLessonAttempts(ctx context.Context, userID string) ([]*models.Attempt, error) {
	var rows []*models.Attempt
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND lesson_id IS NOT NULL AND status IN ?", userID,
			[]enums.AttemptStatus{enums.AttemptStatusInProgress, enums.AttemptStatusCompleted}).
		Order("created_at DESC").
		Find(&rows).Error
	return rows, err
}

func (r *attemptRepository) WithTx(tx *gorm.DB) AttemptRepository {
	return &attemptRepository{db: tx}
}

func (r *attemptRepository) ListCompletedVideo(ctx context.Context, userID string, videoExerciseIDs []string) ([]*models.Attempt, error) {
	if len(videoExerciseIDs) == 0 {
		return nil, nil
	}
	var attempts []*models.Attempt
	err := r.db.WithContext(ctx).Where("user_id = ? AND video_exercise_id IN ? AND status = ?", userID, videoExerciseIDs, enums.AttemptStatusCompleted).Find(&attempts).Error
	if err != nil {
		return nil, err
	}
	return attempts, err
}

func (r *attemptRepository) GetVideoAttempt(ctx context.Context, userID, videoExerciseID string, attemptType enums.AttemptType) (*models.Attempt, error) {
	var m models.Attempt
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND video_exercise_id = ? AND type = ? AND status = ?",
			userID, videoExerciseID, attemptType, enums.AttemptStatusInProgress).
		Order("created_at DESC").First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}
