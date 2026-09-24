package responses

import (
	"time"

	"engflex-api/internal/common/enums"
)

// Attempt is one recorded practice run (the progress source of truth).
// result stays loosely typed this phase; typed per-practice schemas come
// with the practice endpoints.
type Attempt struct {
	ID             string            `json:"id"`
	UserID         string            `json:"userId"`
	LessonID       *string           `json:"lessonId"`
	ActivityID     *string           `json:"activityId"`
	ConversationID *string           `json:"conversationId"`
	Type           enums.AttemptType `json:"type"`
	Score          *float64          `json:"score"`
	Result         map[string]any    `json:"result"`
	DurationSec    *int              `json:"durationSec"`
	CreatedAt      time.Time         `json:"createdAt"`
}

// ProgressSummary is the dashboard rollup, composed later by services from
// attempts (streak, minutes, voice metrics) and user_vocabulary (due count).
type ProgressSummary struct {
	StreakDays       int `json:"streakDays"`
	TodayMinutes     int `json:"todayMinutes"`
	DailyGoalMinutes int `json:"dailyGoalMinutes"`
	FluencyPct       int `json:"fluencyPct"`
	PronunciationPct int `json:"pronunciationPct"`
	WPM              int `json:"wpm"`
	DueVocabulary    int `json:"dueVocabulary"`
}
