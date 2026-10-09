package repositories

import (
	"context"

	"gorm.io/gorm"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
)

// AttemptRepository is the DB access layer for the attempts table.
//
// The read surface arrives with the module that needs it: StartAttempt and
// AttachPartResult are the first callers, so Create/GetByID/GetOpenAttempt/
// Update are declared now. WithTx scopes multi-write flows later.
type AttemptRepository interface {
	Create(ctx context.Context, m *models.Attempt) error
	GetByID(ctx context.Context, id string) (*models.Attempt, error)
	GetOpenAttempt(ctx context.Context, userID, lessonID string) (*models.Attempt, error)
	Update(ctx context.Context, m *models.Attempt) error
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

// WithTx returns the repository bound to the given transaction handle.
func (r *attemptRepository) WithTx(tx *gorm.DB) AttemptRepository {
	return &attemptRepository{db: tx}
}
