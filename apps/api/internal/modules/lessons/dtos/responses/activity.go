package responses

import (
	"engflex-api/internal/common/enums"
)

// QuestionOption is one multiple-choice option; correctness never crosses.
type QuestionOption struct {
	Key  string `json:"key"`
	Text string `json:"text"`
}

// Question is one checkable reading/listening item (answers stay server-side).
type Question struct {
	Stem        string           `json:"stem"`
	Instruction string           `json:"instruction"`
	Options     []QuestionOption `json:"options"`
}

type ReadingPayload struct {
	Text      string     `json:"text"`
	Questions []Question `json:"questions"`
}

type ListeningPayload struct {
	AudioURL   string     `json:"audioUrl"`
	Transcript string     `json:"transcript"`
	Questions  []Question `json:"questions"`
}

type WritingPayload struct {
	Task         string   `json:"task"`
	Instructions string   `json:"instructions"`
	Stimulus     string   `json:"stimulus"`
	MinWords     int      `json:"minWords"`
	MaxWords     int      `json:"maxWords"`
	ModelAnswer  string   `json:"modelAnswer"`
	Checklist    []string `json:"checklist"`
}

type SpeakingItem struct {
	Text          string `json:"text"`
	ModelAudioURL string `json:"modelAudioUrl"`
}

type SpeakingPayload struct {
	Items []SpeakingItem `json:"items"`
}

// CheckResult is the grading outcome for one question. The explanation is
// revealed only after the learner commits an answer.
type CheckResult struct {
	Correct     bool   `json:"correct"`
	CorrectKey  string `json:"correctKey"`
	Explanation string `json:"explanation"`
}

// PhoneDetail is one mispronounced phone: expected vs heard IPA with confidence.
type PhoneDetail struct {
	Expected   string  `json:"expected"`
	Heard      string  `json:"heard"`
	Confidence float64 `json:"confidence"`
}

// ReferencePhone is one reference word's expected IPA, in sentence order.
// The panel renders it under every word chip, flagged or not.
type ReferencePhone struct {
	Word   string `json:"word"`
	Phones string `json:"phones"`
}

// MispronouncedWord is one engine-flagged word: expected vs heard IPA.
type MispronouncedWord struct {
	Word       string        `json:"word"`
	Expected   string        `json:"expected"`
	Heard      string        `json:"heard"`
	Confidence float64       `json:"confidence"`
	Phones     []PhoneDetail `json:"phones"`
}

// Prosody carries the learner's pitch and energy contours, downsampled by
// the engine to at most 120 points each.
type Prosody struct {
	F0     []float64 `json:"f0"`
	Energy []float64 `json:"energy"`
}

// PronunciationResult is the engine's assessment of one read-aloud attempt.
type PronunciationResult struct {
	Score            float64             `json:"score"`
	Transcription    string              `json:"transcription"`
	PhonemeErrorRate float64             `json:"phonemeErrorRate"`
	WordErrorRate    float64             `json:"wordErrorRate"`
	AcousticDistance float64             `json:"acousticDistance"`
	Errors           []MispronouncedWord `json:"errors"`
	Prosody          Prosody             `json:"prosody"`
	ModelCurve       []float64           `json:"modelCurve"`
	LearnerCurve     []float64           `json:"learnerCurve"`
	ReferencePhones  []ReferencePhone    `json:"referencePhones"`
}

// Activity is one ordered lesson part. Exactly one payload pointer is set,
// matching Type. DurationMin and SkillFocus are plain columns on the model.
type Activity struct {
	ID          string             `json:"id"`
	PartNumber  int                `json:"partNumber"`
	Type        enums.ActivityType `json:"type"`
	Title       string             `json:"title"`
	Description string             `json:"description"`
	DurationMin int                `json:"durationMin"`
	SkillFocus  string             `json:"skillFocus"`
	Reading     *ReadingPayload    `json:"reading"`
	Listening   *ListeningPayload  `json:"listening"`
	Writing     *WritingPayload    `json:"writing"`
	Speaking    *SpeakingPayload   `json:"speaking"`
}
