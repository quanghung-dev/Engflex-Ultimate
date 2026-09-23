package responses

import "github.com/gianghp123/engflex-ultimate/internal/common/enums"

// QuestionOption is one multiple-choice option. Correctness is intentionally
// not exposed: answer checking becomes a server endpoint (see spec).
type QuestionOption struct {
	Key  string `json:"key"`
	Text string `json:"text"`
}

// Question is one comprehension question of a reading activity.
type Question struct {
	Stem        string           `json:"stem"`
	Instruction string           `json:"instruction"`
	Options     []QuestionOption `json:"options"`
}

// ReadingPayload is lesson_activities.config for type=reading.
type ReadingPayload struct {
	Passage   string     `json:"passage"`
	Questions []Question `json:"questions"`
}

// DictationSentence is one dictation queue item.
type DictationSentence struct {
	Prompt     string `json:"prompt"`
	Reference  string `json:"reference"`
	AudioURL   string `json:"audioUrl"`
	DurationMS int    `json:"durationMs"`
}

// DictationPayload is lesson_activities.config for type=dictation.
type DictationPayload struct {
	Sentences []DictationSentence `json:"sentences"`
}

// WritingPayload is lesson_activities.config for type=writing.
type WritingPayload struct {
	Title            string   `json:"title"`
	MinWords         int      `json:"minWords"`
	MaxWords         int      `json:"maxWords"`
	ContextQuestions []string `json:"contextQuestions"`
}

// VoicePayload is lesson_activities.config for type=voice.
type VoicePayload struct {
	ScenarioID string `json:"scenarioId"`
}

// Activity is one ordered lesson part. Exactly one of Reading, Dictation,
// Writing, or Voice is set, matching Type.
type Activity struct {
	ID          string             `json:"id"`
	PartNumber  int                `json:"partNumber"`
	Type        enums.ActivityType `json:"type"`
	Title       string             `json:"title"`
	Description string             `json:"description"`
	DurationMin int                `json:"durationMin"`
	SkillFocus  string             `json:"skillFocus"`
	Reading     *ReadingPayload    `json:"reading"`
	Dictation   *DictationPayload  `json:"dictation"`
	Writing     *WritingPayload    `json:"writing"`
	Voice       *VoicePayload      `json:"voice"`
}
