package enums

// AttemptType is the attempt category (attempts.type). Superset of
// ActivityType: attempts also come from non-lesson flows (shadowing,
// flashcard drills, the onboarding benchmark).
type AttemptType string

const (
	AttemptTypeReading   AttemptType = "reading"
	AttemptTypeDictation AttemptType = "dictation"
	AttemptTypeWriting   AttemptType = "writing"
	AttemptTypeVoice     AttemptType = "voice"
	AttemptTypeShadowing AttemptType = "shadowing"
	AttemptTypeFlashcard AttemptType = "flashcard"
	AttemptTypeBenchmark AttemptType = "benchmark"
)
