package responses

import (
	"time"

	"engflex-api/internal/common/enums"
)

type VideoAttemptProgressResponse struct {
	AttemptID              string              `json:"attemptId"`
	VideoExerciseID        string              `json:"videoExerciseId"`
	Type                   enums.AttemptType   `json:"type"`
	Status                 enums.AttemptStatus `json:"status"`
	ActiveSequence         int                 `json:"activeSequence"`
	ActiveTranscriptID     *string             `json:"activeTranscriptId,omitempty"`
	Level                  string              `json:"level,omitempty"`
	CompletedTranscriptIDs []string            `json:"completedTranscriptIds"`
	Transcripts            map[string]any      `json:"transcripts"`
	Score                  *float64            `json:"score,omitempty"`
	DurationSec            *int                `json:"durationSec,omitempty"`
	CreatedAt              time.Time           `json:"createdAt"`
	UpdatedAt              time.Time           `json:"updatedAt"`
}
