package enums

// ActivityType is a lesson activity type (lesson_activities.type) and the
// lesson skill tag (lessons.details.skill).
type ActivityType string

const (
	ActivityTypeReading   ActivityType = "reading"
	ActivityTypeDictation ActivityType = "dictation"
	ActivityTypeWriting   ActivityType = "writing"
	ActivityTypeVoice     ActivityType = "voice"
)
