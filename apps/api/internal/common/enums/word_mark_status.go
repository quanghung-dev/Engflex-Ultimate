package enums

// WordMarkStatus is the per-word highlight status inside
// conversation_turns.feedback.marks[].status (API-only, nested jsonb).
type WordMarkStatus string

const (
	WordMarkStatusAccurate WordMarkStatus = "accurate"
	WordMarkStatusWarning  WordMarkStatus = "warning"
	WordMarkStatusError    WordMarkStatus = "error"
)
