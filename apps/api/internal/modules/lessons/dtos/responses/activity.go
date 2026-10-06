package responses

import (
	"encoding/json"

	"gorm.io/datatypes"

	"engflex-api/internal/common/enums"
)

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

// SplitPayload unmarshals the raw config blob into exactly one typed payload
// by activity type. utils.Map cannot do this split (it matches Go field
// names; Config has no Reading/Dictation/Writing/Voice counterpart), so every
// controller that renders an Activity calls this after Map. Unknown types
// and broken blobs leave all payloads nil — the part header still renders.
func (a *Activity) SplitPayload(activityType enums.ActivityType, config datatypes.JSON) {
	if len(config) == 0 {
		return
	}
	switch activityType {
	case enums.ActivityTypeReading:
		var p ReadingPayload
		if json.Unmarshal(config, &p) == nil {
			a.Reading = &p
		}
	case enums.ActivityTypeDictation:
		var p DictationPayload
		if json.Unmarshal(config, &p) == nil {
			a.Dictation = &p
		}
	case enums.ActivityTypeWriting:
		var p WritingPayload
		if json.Unmarshal(config, &p) == nil {
			a.Writing = &p
		}
	case enums.ActivityTypeVoice:
		var p VoicePayload
		if json.Unmarshal(config, &p) == nil {
			a.Voice = &p
		}
	}
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
