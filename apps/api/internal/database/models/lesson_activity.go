package models

import (
	"time"

	"gorm.io/datatypes"

	"engflex-api/internal/common/enums"
)

// LessonActivity is one ordered practice part of a lesson ("Part 1 of 4").
// config (jsonb) holds the per-type content: text+questions for reading,
// audio+script+questions for listening, the writing task, or read-aloud
// items for speaking.
type LessonActivity struct {
	ID          string             `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	LessonID    string             `gorm:"type:uuid;not null" json:"lessonId"`
	PartNumber  int                `gorm:"column:part_number;not null" json:"partNumber"`
	Type        enums.ActivityType `gorm:"not null" json:"type"`
	Title       string             `gorm:"not null" json:"title"`
	Description string             `gorm:"not null;default:''" json:"description"`
	SkillFocus  string             `gorm:"column:skill_focus;not null;default:''" json:"skillFocus"`
	DurationMin int                `gorm:"column:duration_min;not null;default:0" json:"durationMin"`
	Config      datatypes.JSON     `gorm:"type:jsonb;not null;default:'{}'" json:"config"`
	CreatedAt   time.Time          `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time          `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (LessonActivity) TableName() string { return "lesson_activities" }
