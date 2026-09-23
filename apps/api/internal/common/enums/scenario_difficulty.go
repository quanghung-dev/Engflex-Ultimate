package enums

// ScenarioDifficulty is the scenario difficulty value (scenarios.cefr_level).
// Separate from CEFR because "B1+" is a product half-step, not a CEFR level.
type ScenarioDifficulty string

const (
	ScenarioDifficultyB1Plus ScenarioDifficulty = "B1+"
	ScenarioDifficultyB2     ScenarioDifficulty = "B2"
	ScenarioDifficultyC1     ScenarioDifficulty = "C1"
)
