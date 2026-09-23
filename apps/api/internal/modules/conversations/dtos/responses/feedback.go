package responses

import "github.com/gianghp123/engflex-ultimate/internal/common/enums"

// WordMark highlights one word inside an analyzed turn (feedback.marks[]).
type WordMark struct {
	Word   string               `json:"word"`
	Status enums.WordMarkStatus `json:"status"`
}

// PhonemeMark is one pronunciation diagnostic card (/θ/ in "both").
type PhonemeMark struct {
	IPA         string `json:"ipa"`
	Word        string `json:"word"`
	Feature     string `json:"feature"`
	AccuracyPct int    `json:"accuracyPct"`
	Label       string `json:"label"`
}

// PhraseUpgrade suggests replacing original with one of replacements
// ("primary concern" -> "decisive constraint").
type PhraseUpgrade struct {
	Original     string   `json:"original"`
	Replacements []string `json:"replacements"`
	Category     string   `json:"category"`
}

// TurnFeedback mirrors conversation_turns.feedback (jsonb).
type TurnFeedback struct {
	Annotated string          `json:"annotated"`
	Marks     []WordMark      `json:"marks"`
	Phonemes  []PhonemeMark   `json:"phonemes"`
	Upgrades  []PhraseUpgrade `json:"upgrades"`
	Tip       string          `json:"tip"`
}
