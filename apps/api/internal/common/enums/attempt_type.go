package enums

// AttemptType is the attempt category (attempts.type). Superset of
// ActivityType: attempts also come from non-lesson flows (shadowing,
// flashcard drills, the onboarding benchmark, standalone dictation).
type AttemptType string

const (
	AttemptTypeReading   AttemptType = "reading"
	AttemptTypeListening AttemptType = "listening"
	AttemptTypeWriting   AttemptType = "writing"
	AttemptTypeSpeaking  AttemptType = "speaking"
	AttemptTypeShadowing AttemptType = "shadowing"
	AttemptTypeFlashcard AttemptType = "flashcard"
	AttemptTypeBenchmark AttemptType = "benchmark"
	AttemptTypeDictation AttemptType = "dictation"
)
