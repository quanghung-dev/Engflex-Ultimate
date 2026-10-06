package models

import "time"

// VocabularyDeck is a user-owned flashcard deck (dev vocabulary stack).
type VocabularyDeck struct {
	ID           string              `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID       *string             `json:"userId"`
	CategoryID   *string             `gorm:"type:uuid" json:"categoryId"`
	Name         string              `gorm:"not null" json:"name"`
	Description  string              `gorm:"not null;default:''" json:"description"`
	ThumbnailURL string              `json:"thumbnailUrl"`
	Level        string              `json:"level"`
	IsDefault    bool                `gorm:"default:false" json:"isDefault"`
	CreatedAt    time.Time           `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time           `gorm:"autoUpdateTime" json:"updatedAt"`
	Category     *VocabularyCategory `gorm:"->;foreignKey:CategoryID;references:ID" json:"category,omitempty"`
}

func (VocabularyDeck) TableName() string { return "vocabulary_decks" }
