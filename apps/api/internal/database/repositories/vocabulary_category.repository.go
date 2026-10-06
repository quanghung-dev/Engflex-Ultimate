package repositories

import (
	"context"
	"engflex-api/internal/database/models"

	"gorm.io/gorm"
)

type VocabularyCategoryRepository interface {
	List(ctx context.Context, limit int, offset int) ([]*models.VocabularyCategory, error)
	GetByID(ctx context.Context, id string) (*models.VocabularyCategory, error)
	Create(ctx context.Context, category *models.VocabularyCategory) error
	Update(ctx context.Context, category *models.VocabularyCategory) error
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int64, error)
	WithTx(tx *gorm.DB) VocabularyCategoryRepository
}

type vocabularyCategoryRepository struct {
	db *gorm.DB
}

func NewVocabularyCategoryRepository(db *gorm.DB) VocabularyCategoryRepository {
	return &vocabularyCategoryRepository{db: db}
}

func (r *vocabularyCategoryRepository) WithTx(tx *gorm.DB) VocabularyCategoryRepository {
	return &vocabularyCategoryRepository{db: tx}
}

func (r *vocabularyCategoryRepository) Create(ctx context.Context, category *models.VocabularyCategory) error {
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *vocabularyCategoryRepository) Update(ctx context.Context, category *models.VocabularyCategory) error {
	result := r.db.WithContext(ctx).Save(category)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *vocabularyCategoryRepository) Delete(ctx context.Context, id string) error {
	uintID, err := parseUintID(id, "id")
	if err != nil {
		return err
	}
	result := r.db.WithContext(ctx).Delete(&models.VocabularyCategory{}, uintID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *vocabularyCategoryRepository) GetByID(ctx context.Context, id string) (*models.VocabularyCategory, error) {
	var category models.VocabularyCategory
	uintID, err := parseUintID(id, "id")
	if err != nil {
		return nil, err
	}
	err = r.db.WithContext(ctx).First(&category, uintID).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *vocabularyCategoryRepository) List(ctx context.Context, limit int, offset int) ([]*models.VocabularyCategory, error) {
	categories := make([]*models.VocabularyCategory, 0)
	query := r.db.WithContext(ctx).Order("id asc")
	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}
	err := query.Find(&categories).Error
	if err != nil {
		return nil, err
	}
	return categories, nil
}

func (r *vocabularyCategoryRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.VocabularyCategory{}).Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}
