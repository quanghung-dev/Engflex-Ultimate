package requests

import "engflex-api/internal/common/enums"

// CreateCustomScenario builds a user-authored roleplay scenario
// ("Build custom scenario" CTA).
type CreateCustomScenario struct {
	Title       string                   `json:"title" binding:"required,max=255"`
	Objective   string                   `json:"objective" binding:"required,max=1000"`
	Difficulty  enums.ScenarioDifficulty `json:"difficulty" binding:"required,oneof=B1+ B2 C1"`
	DurationMin int                      `json:"durationMin" binding:"required,min=1"`
	DurationMax int                      `json:"durationMax" binding:"required,min=1"`
}
