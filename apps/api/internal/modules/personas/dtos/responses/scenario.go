package responses

import "engflex-api/internal/common/enums"

// Scenario is one roleplay practice card. Durations come from
// scenarios.details (jsonb); a non-null Persona marks curated scenarios
// (custom ones show only the "Partner" label).
type Scenario struct {
	ID          string                   `json:"id"`
	TopicID     string                   `json:"topicId"`
	Persona     *Persona                 `json:"persona"`
	Title       string                   `json:"title"`
	Objective   string                   `json:"objective"`
	CEFRLevel   enums.ScenarioDifficulty `json:"cefrLevel"`
	DurationMin int                      `json:"durationMin"`
	DurationMax int                      `json:"durationMax"`
	IsCustom    bool                     `json:"isCustom"`
}

// ScenarioTopic is one persona-picker banner with its scenarios.
type ScenarioTopic struct {
	ID        string     `json:"id"`
	Slug      string     `json:"slug"`
	Name      string     `json:"name"`
	Position  int        `json:"position"`
	Scenarios []Scenario `json:"scenarios"`
}
