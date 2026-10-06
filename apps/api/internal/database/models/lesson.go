package models

import (
	"database/sql/driver"
	"time"

	"engflex-api/internal/common/enums"
)

// Lesson is one curriculum unit ("Unit 4.2" folded into slug/title).
// Per-part content lives in lesson_activities.config.
type Lesson struct {
	ID          string            `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Slug        string            `gorm:"not null" json:"slug"`
	Title       string            `gorm:"not null" json:"title"`
	CategoryID  string            `gorm:"type:uuid;not null" json:"categoryId"`
	CEFRLevel   enums.CEFR        `gorm:"column:cefr_level;not null" json:"cefrLevel"`
	Description string            `gorm:"not null;default:''" json:"description"`
	Details     LessonDetails     `gorm:"type:jsonb;not null;default:'{}'" json:"details"`
	Category    *LessonCategory   `gorm:"->;foreignKey:CategoryID;references:ID" json:"category,omitempty"`
	Activities  []*LessonActivity `gorm:"->;foreignKey:LessonID;references:ID" json:"activities,omitempty"`
	CreatedAt   time.Time         `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time         `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Lesson) TableName() string { return "lessons" }

// LessonDetails is the typed view over lessons.details (jsonb). It mirrors
// responses.LessonDetails field for field, so utils.Map copies the document
// whole when the lessons module lands.
type LessonDetails struct {
	EstimatedDurationMin *int                `json:"estimatedDurationMin"`
	AcousticTargetPct    *int                `json:"acousticTargetPct"`
	CoverImageURL        string              `json:"coverImageUrl"`
	Skill                *enums.ActivityType `json:"skill"`
}

// GormDataType pins the column type for migrations handled outside GORM.
func (LessonDetails) GormDataType() string { return "jsonb" }

// Value marshals the document for writes.
func (d LessonDetails) Value() (driver.Value, error) { return jsonbValue(d) }

// Scan decodes the column on reads; a broken blob leaves the zero value.
func (d *LessonDetails) Scan(value any) error {
	jsonbScan(value, d)
	return nil
}
