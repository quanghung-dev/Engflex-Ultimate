package requests

import "github.com/gianghp123/engflex-ultimate/internal/common/enums"

// StartConversation provisions a session. scenarioId is required for
// roleplay and omitted for free talk.
type StartConversation struct {
	Mode       enums.ConversationMode `json:"mode" binding:"required,oneof=free_talk roleplay"`
	ScenarioID *string                `json:"scenarioId" binding:"omitempty,uuid"`
}

// WordMarkInput highlights one word inside an analyzed turn. Request-side
// shapes carry an Input suffix so the contracts barrel can re-export both
// requests and responses without name collisions (see spec §6).
type WordMarkInput struct {
	Word   string               `json:"word"`
	Status enums.WordMarkStatus `json:"status"`
}

// PhonemeMarkInput is one pronunciation diagnostic card (/θ/ in "both").
type PhonemeMarkInput struct {
	IPA         string `json:"ipa"`
	Word        string `json:"word"`
	Feature     string `json:"feature"`
	AccuracyPct int    `json:"accuracyPct"`
	Label       string `json:"label"`
}

// PhraseUpgradeInput suggests replacing original with one of replacements.
type PhraseUpgradeInput struct {
	Original     string   `json:"original"`
	Replacements []string `json:"replacements"`
	Category     string   `json:"category"`
}

// TurnFeedbackInput carries per-turn analysis (word marks, phoneme
// accuracy, phrase upgrades, coaching tip).
type TurnFeedbackInput struct {
	Annotated string               `json:"annotated"`
	Marks     []WordMarkInput      `json:"marks"`
	Phonemes  []PhonemeMarkInput   `json:"phonemes"`
	Upgrades  []PhraseUpgradeInput `json:"upgrades"`
	Tip       string               `json:"tip"`
}

// CreateTurn appends one transcript line (used by the voice result
// ingestion flow). position keeps transcript order deterministic.
type CreateTurn struct {
	Position int                `json:"position" binding:"required,min=0"`
	Role     enums.TurnRole     `json:"role" binding:"required,oneof=user ai"`
	Text     string             `json:"text" binding:"required,max=10000"`
	Feedback *TurnFeedbackInput `json:"feedback"`
}
