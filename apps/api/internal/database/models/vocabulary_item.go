package models

import "time"

type VocabularyItem struct {
	ID               uint            `gorm:"primaryKey" json:"id"`
	DeckID           uint            `gorm:"not null;index" json:"deck_id"`
	LessonID         *uint           `json:"lesson_id"`
	TranscriptID     *uint           `json:"transcript_id"`
	Phrase           string          `gorm:"type:varchar(500);not null" json:"phrase"`
	NormalizedPhrase string          `gorm:"type:varchar(500);not null" json:"normalized_phrase"`
	Meaning          string          `gorm:"type:text;not null" json:"meaning"`
	ExampleSentence  string          `gorm:"type:text" json:"example_sentence"`
	Note             string          `gorm:"type:text" json:"note"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
	Deck             *VocabularyDeck `gorm:"foreignKey:DeckID" json:"deck,omitempty"`
}

func (VocabularyItem) TableName() string {
	return "vocabulary_items"
}

