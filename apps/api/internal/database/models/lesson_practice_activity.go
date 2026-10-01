package models

import (
	"time"

	"gorm.io/datatypes"

	"engflex-api/internal/common/enums"
)

// LessonPracticeActivity is one ordered practice part of a lesson practice ("Part 1 of 4").
// config (jsonb) holds the per-type content: passage+questions for reading,
// sentences for dictation, the writing prompt, or a scenario link for voice.
type LessonPracticeActivity struct {
	ID               string             `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	LessonPracticeID string             `gorm:"column:lesson_practice_id;type:uuid;not null" json:"lessonPracticeId"`
	PartNumber       int                `gorm:"column:part_number;not null" json:"partNumber"`
	Type             enums.ActivityType `gorm:"not null" json:"type"`
	Title            string             `gorm:"not null" json:"title"`
	Description      string             `gorm:"not null;default:''" json:"description"`
	Config           datatypes.JSON     `gorm:"type:jsonb;not null;default:'{}'" json:"config"`
	CreatedAt        time.Time          `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt        time.Time          `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (LessonPracticeActivity) TableName() string { return "lesson_practice_activities" }
