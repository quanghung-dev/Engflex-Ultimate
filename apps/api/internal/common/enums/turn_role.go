package enums

// TurnRole identifies who produced a conversation turn
// (conversation_turns.role).
type TurnRole string

const (
	TurnRoleUser TurnRole = "user"
	TurnRoleAI   TurnRole = "ai"
)
