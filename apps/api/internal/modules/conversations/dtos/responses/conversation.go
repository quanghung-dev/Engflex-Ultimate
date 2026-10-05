package responses

import (
	"time"

	"engflex-api/internal/common/enums"
)

// Turn is one transcript line. The speaker display name is derived by
// joining scenario -> persona, not stored on the turn. Feedback mirrors
// models.ConversationTurn.Feedback — the coaching record the repository
// joined in — so utils.MapSlice copies the whole thing, payload included.
type Turn struct {
	ID             string         `json:"id"`
	Position       int            `json:"position"`
	Role           enums.TurnRole `json:"role"`
	Text           string         `json:"text"`
	WasInterrupted bool           `json:"wasInterrupted"`
	Feedback       *Feedback      `json:"feedback,omitempty"`
	CreatedAt      time.Time      `json:"createdAt"`
}

// Feedback is one coaching record attached to a turn. It mirrors
// models.Feedback minus the columns this view does not render: user_id,
// subject_type, and subject_id are relationship facts the join already
// proved, so only the coaching document crosses the wire. Flattening it
// instead (turn.feedback.tip) would break utils.Map silently — copier
// matches field names, and models.Feedback has no Corrected field.
type Feedback struct {
	Payload TurnFeedback `json:"payload"`
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
