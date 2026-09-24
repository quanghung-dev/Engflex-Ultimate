package models

import (
	"time"

	"gorm.io/datatypes"

	"engflex-api/internal/common/enums"
)

// Lesson is one curriculum unit ("Unit 4.2" folded into slug/title).
// Per-part content lives in lesson_activities.config.
type Lesson struct {
	ID          string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Slug        string         `gorm:"not null" json:"slug"`
	Title       string         `gorm:"not null" json:"title"`
	CategoryID  string         `gorm:"type:uuid;not null" json:"categoryId"`
	CEFRLevel   enums.CEFR     `gorm:"column:cefr_level;not null" json:"cefrLevel"`
	Description string         `gorm:"not null;default:''" json:"description"`
	Details     datatypes.JSON `gorm:"type:jsonb;not null;default:'{}'" json:"details"`
	CreatedAt   time.Time      `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Lesson) TableName() string { return "lessons" }
