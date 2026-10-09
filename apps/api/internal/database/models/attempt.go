package models

import (
	"time"

	"gorm.io/datatypes"

	"engflex-api/internal/common/enums"
)

// Attempt is the single source of truth for progress: one row per lesson
// run (1 attempt = 1 lesson). Per-part results accumulate in result (jsonb)
// keyed by activity id; lesson_id is denormalized for cheap lesson
// aggregation. There are no per-activity or per-conversation rows: parts
// live in the map, conversations live in feedbacks.
type Attempt struct {
	ID          string              `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID      string              `gorm:"not null" json:"userId"`
	LessonID    *string             `gorm:"type:uuid" json:"lessonId"`
	Type        enums.AttemptType   `gorm:"not null" json:"type"`
	Status      enums.AttemptStatus `gorm:"not null;default:in_progress" json:"status"`
	Score       *float64            `gorm:"type:numeric(5,2)" json:"score"`
	Result      datatypes.JSON      `gorm:"type:jsonb;not null;default:'{}'" json:"result"`
	DurationSec *int                `json:"durationSec"`
	CreatedAt   time.Time           `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time           `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Attempt) TableName() string { return "attempts" }
