package repositories

import (
	"context"

	"engflex-api/internal/database/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// LessonBookmarkRepository is the DB access layer for the lesson_bookmarks table.
type LessonBookmarkRepository interface {
	ListByUser(ctx context.Context, userID string) ([]*models.LessonBookmark, error)
	Get(ctx context.Context, userID, lessonID string) (*models.LessonBookmark, error)
	Create(ctx context.Context, b *models.LessonBookmark) error
	Delete(ctx context.Context, userID, lessonID string) error
	WithTx(tx *gorm.DB) LessonBookmarkRepository
}

type lessonBookmarkRepository struct {
	db *gorm.DB
}

// NewLessonBookmarkRepository builds the repository over the shared DB handle.
func NewLessonBookmarkRepository(db *gorm.DB) LessonBookmarkRepository {
	return &lessonBookmarkRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *lessonBookmarkRepository) WithTx(tx *gorm.DB) LessonBookmarkRepository {
	return &lessonBookmarkRepository{db: tx}
}

func (r *lessonBookmarkRepository) ListByUser(ctx context.Context, userID string) ([]*models.LessonBookmark, error) {
	out := make([]*models.LessonBookmark, 0)
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC").Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func (r *lessonBookmarkRepository) Get(ctx context.Context, userID, lessonID string) (*models.LessonBookmark, error) {
	if _, err := parseID(lessonID, "lessonId"); err != nil {
		return nil, err
	}
	var m models.LessonBookmark
	if err := r.db.WithContext(ctx).First(&m, "user_id = ? AND lesson_id = ?", userID, lessonID).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// Create saves a bookmark idempotently: a repeated save is a no-op, not a
// duplicate row (composite PK would conflict).
func (r *lessonBookmarkRepository) Create(ctx context.Context, b *models.LessonBookmark) error {
	if _, err := parseID(b.LessonID, "lessonId"); err != nil {
		return err
	}
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(b).Error
}

func (r *lessonBookmarkRepository) Delete(ctx context.Context, userID, lessonID string) error {
	if _, err := parseID(lessonID, "lessonId"); err != nil {
		return err
	}
	result := r.db.WithContext(ctx).Delete(&models.LessonBookmark{}, "user_id = ? AND lesson_id = ?", userID, lessonID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
