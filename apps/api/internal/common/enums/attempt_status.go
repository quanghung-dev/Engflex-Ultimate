package enums

// AttemptStatus is the attempt lifecycle.
type AttemptStatus string

const (
	AttemptStatusInProgress AttemptStatus = "in_progress"
	AttemptStatusCompleted  AttemptStatus = "completed"
	AttemptStatusAbandoned  AttemptStatus = "abandoned"
)
