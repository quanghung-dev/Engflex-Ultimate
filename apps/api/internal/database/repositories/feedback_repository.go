package repositories

import (
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"engflex-api/internal/database/models"
)

// FeedbackRepository is the DB access layer for the global feedback table.
// Upsert (not insert) because re-analysis must replace the coaching for a
// subject rather than accumulate rows.
type FeedbackRepository interface {
	Upsert(ctx context.Context, f *models.Feedback) error
	ListForSubjects(ctx context.Context, userID, subjectType string, subjectIDs []string) ([]*models.Feedback, error)
	WithTx(tx *gorm.DB) FeedbackRepository
}

type feedbackRepository struct {
	db *gorm.DB
}

// NewFeedbackRepository builds the repository over the shared DB handle.
func NewFeedbackRepository(db *gorm.DB) FeedbackRepository {
	return &feedbackRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *feedbackRepository) WithTx(tx *gorm.DB) FeedbackRepository {
	return &feedbackRepository{db: tx}
}

// Upsert writes the payload for a subject, replacing any previous one. The
// unique (subject_type, subject_id) constraint makes re-analysis idempotent.
func (r *feedbackRepository) Upsert(ctx context.Context, f *models.Feedback) error {
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "subject_type"}, {Name: "subject_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"payload", "user_id", "updated_at"}),
		}).
		Create(f).Error
}

func (r *feedbackRepository) ListForSubjects(ctx context.Context, userID, subjectType string, subjectIDs []string) ([]*models.Feedback, error) {
	if len(subjectIDs) == 0 {
		return nil, nil
	}
	var out []*models.Feedback
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND subject_type = ? AND subject_id IN ?", userID, subjectType, subjectIDs).
		Order("created_at ASC").
		Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}
