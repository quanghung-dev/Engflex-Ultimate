package models

import (
	"time"

	"engflex-api/internal/common/enums"
)

// VideoExercise is one watchable video (the former video "lessons" stack).
// Its caption segments live in video_transcripts; category_id points at the
// content-format taxonomy (trailer, podcast, ...) in video_categories.
type VideoExercise struct {
	ID           string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CategoryID   *string     `gorm:"type:uuid" json:"categoryId"`
	Title        string      `gorm:"not null" json:"title"`
	Description  string      `gorm:"not null;default:''" json:"description"`
	VideoURL     string      `gorm:"not null" json:"videoUrl"`
	ThumbnailURL string      `json:"thumbnailUrl"`
	CEFRLevel    *enums.CEFR `gorm:"column:cefr_level" json:"cefrLevel"`
	Duration     float64     `json:"duration"`
	CreatedAt    time.Time   `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time   `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (VideoExercise) TableName() string { return "video_exercises" }
