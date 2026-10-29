package repositories

import (
	"context"
	"time"

	"engflex-api/internal/database/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserVocabularyRepository interface {
	Get(ctx context.Context, userID, itemID string) (*models.UserVocabulary, error)
	Upsert(ctx context.Context, u *models.UserVocabulary, updateMastered bool) error
	Patch(ctx context.Context, userID, itemID string, mastered *bool, note *string) error
	UpdateSchedule(ctx context.Context, u *models.UserVocabulary) error
	Delete(ctx context.Context, userID, itemID string) error
	CountByUser(ctx context.Context, userID string) (int64, error)
	CountMastered(ctx context.Context, userID string) (int64, error)
	CountDue(ctx context.Context, userID string, now time.Time) (int64, error)

	CountSavedBetween(ctx context.Context, userID string, from, to time.Time) (int64, error)
	WithTx(tx *gorm.DB) UserVocabularyRepository
}

type userVocabularyRepository struct {
	db *gorm.DB
}

func NewUserVocabularyRepository(db *gorm.DB) UserVocabularyRepository {
	return &userVocabularyRepository{db: db}
}

func (r *userVocabularyRepository) WithTx(tx *gorm.DB) UserVocabularyRepository {
	return &userVocabularyRepository{db: tx}
}

func (r *userVocabularyRepository) Get(ctx context.Context, userID, itemID string) (*models.UserVocabulary, error) {
	if _, err := parseID(itemID, "itemId"); err != nil {
		return nil, err
	}
	var m models.UserVocabulary
	if err := r.db.WithContext(ctx).First(&m, "user_id = ? AND item_id = ?", userID, itemID).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *userVocabularyRepository) Upsert(ctx context.Context, u *models.UserVocabulary, updateMastered bool) error {
	if _, err := parseID(u.ItemID, "itemId"); err != nil {
		return err
	}
	cols := []string{"source_type", "source_id", "note", "updated_at"}
	if updateMastered {
		cols = append(cols, "mastered")
	}
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "item_id"}},
		DoUpdates: clause.AssignmentColumns(cols),
	}).Create(u).Error
}

func (r *userVocabularyRepository) Patch(ctx context.Context, userID, itemID string, mastered *bool, note *string) error {
	if _, err := parseID(itemID, "itemId"); err != nil {
		return err
	}
	updates := map[string]any{}
	if mastered != nil {
		updates["mastered"] = *mastered
	}
	if note != nil {
		updates["note"] = *note
	}
	if len(updates) == 0 {

		return nil
	}
	res := r.db.WithContext(ctx).Model(&models.UserVocabulary{}).
		Where("user_id = ? AND item_id = ?", userID, itemID).
		Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *userVocabularyRepository) UpdateSchedule(ctx context.Context, u *models.UserVocabulary) error {
	if _, err := parseID(u.ItemID, "itemId"); err != nil {
		return err
	}
	res := r.db.WithContext(ctx).Model(&models.UserVocabulary{}).
		Where("user_id = ? AND item_id = ?", u.UserID, u.ItemID).
		Updates(map[string]any{
			"srs_due_at":       u.SRSDueAt,
			"interval_days":    u.IntervalDays,
			"review_count":     u.ReviewCount,
			"last_reviewed_at": u.LastReviewedAt,
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *userVocabularyRepository) Delete(ctx context.Context, userID, itemID string) error {
	if _, err := parseID(itemID, "itemId"); err != nil {
		return err
	}
	result := r.db.WithContext(ctx).Delete(&models.UserVocabulary{}, "user_id = ? AND item_id = ?", userID, itemID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *userVocabularyRepository) CountByUser(ctx context.Context, userID string) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&models.UserVocabulary{}).Where("user_id = ?", userID).Count(&n).Error
	return n, err
}

func (r *userVocabularyRepository) CountMastered(ctx context.Context, userID string) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&models.UserVocabulary{}).
		Where("user_id = ? AND mastered = true", userID).Count(&n).Error
	return n, err
}

func (r *userVocabularyRepository) CountDue(ctx context.Context, userID string, now time.Time) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&models.UserVocabulary{}).
		Where("user_id = ? AND mastered = false AND srs_due_at IS NOT NULL AND srs_due_at <= ?", userID, now).
		Count(&n).Error
	return n, err
}

func (r *userVocabularyRepository) CountSavedBetween(ctx context.Context, userID string, from, to time.Time) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&models.UserVocabulary{}).
		Where("user_id = ? AND created_at >= ? AND created_at < ?", userID, from, to).
		Count(&n).Error
	return n, err
}
