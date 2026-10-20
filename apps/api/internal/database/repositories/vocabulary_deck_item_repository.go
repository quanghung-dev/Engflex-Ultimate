package repositories

import (
	"context"

	"engflex-api/internal/database/models"

	"gorm.io/gorm"
)

type VocabularyDeckItemRepository interface {
	ListByDeck(ctx context.Context, userID, deckID string) ([]*models.VocabularyDeckItem, error)
	GetByID(ctx context.Context, id string) (*models.VocabularyDeckItem, error)

	GetByDeckAndItem(ctx context.Context, deckID, itemID string) (*models.VocabularyDeckItem, error)

	CountByDeck(ctx context.Context, deckID string) (int64, error)

	ListPreviewByDeckIDs(ctx context.Context, userID string, deckIDs []string, previewK int) ([]*models.VocabularyDeckItem, error)
	Create(ctx context.Context, i *models.VocabularyDeckItem) error
	Update(ctx context.Context, i *models.VocabularyDeckItem) error
	Delete(ctx context.Context, id string) error
	WithTx(tx *gorm.DB) VocabularyDeckItemRepository
}

type vocabularyDeckItemRepository struct {
	db *gorm.DB
}

func NewVocabularyDeckItemRepository(db *gorm.DB) VocabularyDeckItemRepository {
	return &vocabularyDeckItemRepository{db: db}
}

func (r *vocabularyDeckItemRepository) WithTx(tx *gorm.DB) VocabularyDeckItemRepository {
	return &vocabularyDeckItemRepository{db: tx}
}

const rankedDeckItemIDs = `
SELECT ranked.id FROM (
    SELECT di2.id,
           ROW_NUMBER() OVER (PARTITION BY di2.deck_id ORDER BY di2.sequence ASC, di2.created_at ASC, di2.id ASC) AS rn
    FROM vocabulary_deck_items di2
) AS ranked WHERE ranked.rn <= ?`

func (r *vocabularyDeckItemRepository) ListByDeck(ctx context.Context, userID, deckID string) ([]*models.VocabularyDeckItem, error) {
	if _, err := parseID(deckID, "deckId"); err != nil {
		return nil, err
	}
	out := make([]*models.VocabularyDeckItem, 0)
	if err := r.db.WithContext(ctx).
		Joins("Item").
		Where("vocabulary_deck_items.deck_id = ?", deckID).
		Order("vocabulary_deck_items.sequence asc, vocabulary_deck_items.created_at asc").
		Find(&out).Error; err != nil {
		return nil, err
	}
	if err := attachUserState(ctx, r.db, userID, out); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *vocabularyDeckItemRepository) ListPreviewByDeckIDs(ctx context.Context, userID string, deckIDs []string, previewK int) ([]*models.VocabularyDeckItem, error) {
	if len(deckIDs) == 0 {
		return []*models.VocabularyDeckItem{}, nil
	}
	out := make([]*models.VocabularyDeckItem, 0)
	if err := r.db.WithContext(ctx).
		Joins("Item").
		Where("vocabulary_deck_items.deck_id IN ?", deckIDs).
		Where("vocabulary_deck_items.id IN ("+rankedDeckItemIDs+")", previewK).
		Order("vocabulary_deck_items.deck_id ASC, vocabulary_deck_items.sequence asc, vocabulary_deck_items.created_at asc").
		Find(&out).Error; err != nil {
		return nil, err
	}
	if err := attachUserState(ctx, r.db, userID, out); err != nil {
		return nil, err
	}
	return out, nil
}

func attachUserState(ctx context.Context, db *gorm.DB, userID string, rows []*models.VocabularyDeckItem) error {
	ids := make([]string, 0, len(rows))
	seen := make(map[string]bool, len(rows))
	for _, row := range rows {
		if row.ItemID != "" && !seen[row.ItemID] {
			ids = append(ids, row.ItemID)
			seen[row.ItemID] = true
		}
	}
	if len(ids) == 0 {
		return nil
	}
	states := make([]*models.UserVocabulary, 0, len(ids))
	if err := db.WithContext(ctx).
		Where("user_id = ? AND item_id IN ?", userID, ids).
		Find(&states).Error; err != nil {
		return err
	}
	byItem := make(map[string]*models.UserVocabulary, len(states))
	for _, st := range states {
		byItem[st.ItemID] = st
	}
	for _, row := range rows {
		if row.Item != nil {
			row.Item.UserState = byItem[row.ItemID]
		}
	}
	return nil
}

func (r *vocabularyDeckItemRepository) GetByID(ctx context.Context, id string) (*models.VocabularyDeckItem, error) {
	if _, err := parseID(id, "id"); err != nil {
		return nil, err
	}
	var m models.VocabularyDeckItem
	if err := r.db.WithContext(ctx).Joins("Item").First(&m, "vocabulary_deck_items.id = ?", id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *vocabularyDeckItemRepository) GetByDeckAndItem(ctx context.Context, deckID, itemID string) (*models.VocabularyDeckItem, error) {
	if _, err := parseID(deckID, "deckId"); err != nil {
		return nil, err
	}
	if _, err := parseID(itemID, "itemId"); err != nil {
		return nil, err
	}
	var m models.VocabularyDeckItem
	if err := r.db.WithContext(ctx).
		Where("deck_id = ? AND item_id = ?", deckID, itemID).
		First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *vocabularyDeckItemRepository) CountByDeck(ctx context.Context, deckID string) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&models.VocabularyDeckItem{}).
		Where("deck_id = ?", deckID).Count(&n).Error
	return n, err
}

func (r *vocabularyDeckItemRepository) Create(ctx context.Context, i *models.VocabularyDeckItem) error {
	if _, err := parseID(i.DeckID, "deckId"); err != nil {
		return err
	}
	if _, err := parseID(i.ItemID, "itemId"); err != nil {
		return err
	}
	return r.db.WithContext(ctx).Create(i).Error
}

func (r *vocabularyDeckItemRepository) Update(ctx context.Context, i *models.VocabularyDeckItem) error {
	result := r.db.WithContext(ctx).Save(i)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *vocabularyDeckItemRepository) Delete(ctx context.Context, id string) error {
	if _, err := parseID(id, "id"); err != nil {
		return err
	}
	result := r.db.WithContext(ctx).Delete(&models.VocabularyDeckItem{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
