package enums

// LessonStatus is the API-only completion status derived from attempts
// (never stored as a column).
type LessonStatus string

const (
	LessonStatusUnstarted  LessonStatus = "unstarted"
	LessonStatusInProgress LessonStatus = "in_progress"
	LessonStatusCompleted  LessonStatus = "completed"
)
