package models

import (
	"time"

	"gorm.io/datatypes"

	"github.com/gianghp123/engflex-ultimate/internal/common/enums"
)

// Attempt is the single source of truth for progress: every practice run
// writes one row here, and lesson status, streak, daily minutes, and
// dashboard metrics are derived from it. result (jsonb) carries per-type
// detail plus voice metrics; lesson_id is denormalized for cheap lesson
// aggregation.
type Attempt struct {
	ID             string            `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID         string            `gorm:"not null" json:"userId"`
	LessonID       *string           `gorm:"type:uuid" json:"lessonId"`
	ActivityID     *string           `gorm:"type:uuid" json:"activityId"`
	ConversationID *string           `gorm:"type:uuid" json:"conversationId"`
	Type           enums.AttemptType `gorm:"not null" json:"type"`
	Score          *float64          `gorm:"type:numeric(5,2)" json:"score"`
	Result         datatypes.JSON    `gorm:"type:jsonb;not null;default:'{}'" json:"result"`
	DurationSec    *int              `json:"durationSec"`
	CreatedAt      time.Time         `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt      time.Time         `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Attempt) TableName() string { return "attempts" }
