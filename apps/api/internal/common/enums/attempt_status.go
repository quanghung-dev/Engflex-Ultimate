package enums

// AttemptStatus is the lesson-attempt lifecycle (Moodle parity).
type AttemptStatus string

const (
	AttemptStatusInProgress AttemptStatus = "in_progress"
	AttemptStatusCompleted  AttemptStatus = "completed"
	AttemptStatusAbandoned  AttemptStatus = "abandoned"
)
