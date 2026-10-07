package models

import (
	"time"

	"engflex-api/internal/common/enums"
)

// LessonSection is one path section (Duolingo convention): an ordered,
// titled group of units within a CEFR band. Keyed on its own id — never on
// the CEFR value: difficulty labels on other tables (vocabulary, scenarios,
// videos) are attributes to filter on, not membership in this path, and only
// lessons belong to a section.
type LessonSection struct {
	ID          string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Slug        string     `gorm:"not null" json:"slug"`
	Title       string     `gorm:"not null" json:"title"`
	Description string     `gorm:"not null;default:''" json:"description"`
	CEFRBand    enums.CEFR `gorm:"column:cefr_band;not null" json:"cefrBand"`
	Position    int        `gorm:"not null" json:"position"`
	Units       []*Lesson  `gorm:"->;foreignKey:SectionID;references:ID" json:"units,omitempty"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (LessonSection) TableName() string { return "lesson_sections" }
