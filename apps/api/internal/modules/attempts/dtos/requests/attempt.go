package requests

import "engflex-api/internal/common/enums"

// CreateAttempt records one practice run. result carries per-type detail
// (typed schemas come with the practice endpoints). score and duration are
// optional; free talk has no score.
type CreateAttempt struct {
	LessonPracticeID *string           `json:"lessonPracticeId" binding:"omitempty,uuid"`
	ActivityID       *string           `json:"activityId" binding:"omitempty,uuid"`
	ConversationID *string           `json:"conversationId" binding:"omitempty,uuid"`
	Type           enums.AttemptType `json:"type" binding:"required,oneof=reading dictation writing voice shadowing flashcard benchmark"`
	Score          *float64          `json:"score"`
	Result         map[string]any    `json:"result"`
	DurationSec    *int              `json:"durationSec" binding:"omitempty,min=0"`
}
