package models

import (
	"time"

	"gorm.io/datatypes"

	"github.com/gianghp123/engflex-ultimate/internal/common/enums"
)

// VocabularyItem is the shared dictionary entry (one row per term for all
// users). A non-null CreatedByUserID marks a user's custom word. details
// (jsonb) holds ipa, pos, audio, syllables, stress, etymology, contexts,
// collocations, and word forms.
type VocabularyItem struct {
	ID              string                  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Term            string                  `gorm:"not null" json:"term"`
	Definition      string                  `gorm:"not null;default:''" json:"definition"`
	CEFR            enums.CEFR              `gorm:"column:cefr;not null" json:"cefr"`
	Domain          *enums.VocabularyDomain `gorm:"column:domain" json:"domain"`
	CreatedByUserID *string                 `json:"createdByUserId"`
	Details         datatypes.JSON          `gorm:"type:jsonb;not null;default:'{}'" json:"details"`
	CreatedAt       time.Time               `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt       time.Time               `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (VocabularyItem) TableName() string { return "vocabulary_items" }
