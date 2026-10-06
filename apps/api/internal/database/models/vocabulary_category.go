package models

import "time"

// VocabularyCategory is the author-owned deck taxonomy for the vocabulary
// deck stack.
type VocabularyCategory struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `gorm:"not null;default:''" json:"description"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (VocabularyCategory) TableName() string { return "vocabulary_categories" }
