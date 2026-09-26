package responses

import (
	"time"

	"engflex-api/internal/common/enums"
)

// Turn is one transcript line. The speaker display name is derived by
// joining scenario -> persona, not stored on the turn. Feedback is attached
// after the read by matching feedbacks rows on subject id.
type Turn struct {
	ID             string         `json:"id"`
	Position       int            `json:"position"`
	Role           enums.TurnRole `json:"role"`
	Text           string         `json:"text"`
	WasInterrupted bool           `json:"wasInterrupted"`
	Feedback       *TurnFeedback  `json:"feedback,omitempty"`
	CreatedAt      time.Time      `json:"createdAt"`
}

// Conversation is a voice session with its transcript.
type Conversation struct {
	ID          string                   `json:"id"`
	Mode        enums.ConversationMode   `json:"mode"`
	ScenarioID  *string                  `json:"scenarioId"`
	Status      enums.ConversationStatus `json:"status"`
	StartedAt   time.Time                `json:"startedAt"`
	EndedAt     *time.Time               `json:"endedAt"`
	DurationSec *int                     `json:"durationSec,omitempty"`
	Turns       []Turn                   `json:"turns"`
}
