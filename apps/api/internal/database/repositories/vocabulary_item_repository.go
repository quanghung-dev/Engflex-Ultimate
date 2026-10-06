package repositories

import (
	"context"

	"engflex-api/internal/database/models"

	"gorm.io/gorm"
)

// VocabularyItemRepository is the DB access layer for the vocabulary_items table.
//
// The read surface arrives with the module that needs it: the vocabulary
// module now queries this table, so List/Count/GetByID/Create are declared.
// WithTx is present because every repository in this package carries it.
type VocabularyItemRepository interface {
	List(ctx context.Context, limit, offset int) ([]*models.VocabularyItem, error)
	Count(ctx context.Context) (int64, error)
	GetByID(ctx context.Context, id string) (*models.VocabularyItem, error)
	Create(ctx context.Context, i *models.VocabularyItem) error
	WithTx(tx *gorm.DB) VocabularyItemRepository
}

type vocabularyItemRepository struct {
	db *gorm.DB
}

// NewVocabularyItemRepository builds the repository over the shared DB handle.
func NewVocabularyItemRepository(db *gorm.DB) VocabularyItemRepository {
	return &vocabularyItemRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *vocabularyItemRepository) WithTx(tx *gorm.DB) VocabularyItemRepository {
	return &vocabularyItemRepository{db: tx}
}

func (r *vocabularyItemRepository) List(ctx context.Context, limit, offset int) ([]*models.VocabularyItem, error) {
	var out []*models.VocabularyItem
	if err := r.db.WithContext(ctx).Order("created_at DESC").Limit(limit).Offset(offset).Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func (r *vocabularyItemRepository) Count(ctx context.Context) (int64, error) {
	var n int64
	if err := r.db.WithContext(ctx).Model(&models.VocabularyItem{}).Count(&n).Error; err != nil {
		return 0, err
	}
	return n, nil
}

func (r *vocabularyItemRepository) GetByID(ctx context.Context, id string) (*models.VocabularyItem, error) {
	if _, err := parseID(id, "id"); err != nil {
		return nil, err
	}
	var m models.VocabularyItem
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *vocabularyItemRepository) Create(ctx context.Context, i *models.VocabularyItem) error {
	return r.db.WithContext(ctx).Create(i).Error
}
