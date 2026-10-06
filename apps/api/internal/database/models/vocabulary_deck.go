package models
import "time"

type VocabularyDeck struct {
	ID           uint                `gorm:"primaryKey" json:"id"`
	UserID       *string             `gorm:"index" json:"user_id"`
	CategoryID   *uint               `gorm:"index" json:"category_id"`
	Name         string              `gorm:"type:varchar(255);not null" json:"name"`
	Description  string              `gorm:"type:text" json:"description"`
	ThumbnailURL string              `gorm:"type:varchar(500)" json:"thumbnail_url"`
	Level        string              `gorm:"type:varchar(20)" json:"level"`
	IsDefault    bool                `gorm:"default:false" json:"is_default"`
	CreatedAt    time.Time           `json:"created_at"`
	UpdatedAt    time.Time           `json:"updated_at"`
	Category     *VocabularyCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

func (VocabularyDeck) TableName() string {
	return "vocabulary_decks"
}
