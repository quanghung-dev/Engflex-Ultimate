package enums

// Level is the onboarding proficiency bucket
// (user_profiles.preferences.level).
type Level string

const (
	LevelBeginner     Level = "beginner"
	LevelIntermediate Level = "intermediate"
	LevelAdvanced     Level = "advanced"
)
