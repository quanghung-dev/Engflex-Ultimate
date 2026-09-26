package responses

import "engflex-api/internal/common/enums"

// WordMark highlights one word inside an analyzed turn (feedback.marks[]).
type WordMark struct {
	Word   string               `json:"word"`
	Status enums.WordMarkStatus `json:"status"`
}

// PhraseUpgrade suggests replacing original with one of replacements
// ("primary concern" -> "decisive constraint").
type PhraseUpgrade struct {
	Original     string   `json:"original"`
	Replacements []string `json:"replacements"`
	Category     string   `json:"category"`
}

// PhonemeMark is one pronunciation diagnostic card (/θ/ in "both"). It only
// ever appears inside SpeechFeedback: phoneme scores are an acoustic
// measurement with no source in P2 (spec D11), so the contract does not ask
// for them and a model cannot return a number we would have to strip.
type PhonemeMark struct {
	IPA         string `json:"ipa"`
	Word        string `json:"word"`
	Feature     string `json:"feature"`
	AccuracyPct int    `json:"accuracyPct"`
	Label       string `json:"label"`
}

// TurnFeedback is the per-subject coaching payload. There is no `type`
// discriminator and no top-level `phonemes`: the subject-to-product mapping
// is a product invariant (spec D18), and phoneme scores are an acoustic
// measurement with no source in P2 (D11).
type TurnFeedback struct {
	Annotated string          `json:"annotated"`
	Marks     []WordMark      `json:"marks"`
	Upgrades  []PhraseUpgrade `json:"upgrades"`
	Tip       string          `json:"tip"`
	// Speech is reserved for a P3 provider. Always absent in P2.
	Speech *SpeechFeedback `json:"speech,omitempty"`
}

// SpeechFeedback is the acoustic assessment block produced by a provider that
// takes audio, not a transcript. It exists so the wire contract does not
// change when speech scoring arrives.
type SpeechFeedback struct {
	Provider string        `json:"provider"`
	Phonemes []PhonemeMark `json:"phonemes"`
	Fluency  *SpeechScore  `json:"fluency,omitempty"`
	Prosody  *SpeechScore  `json:"prosody,omitempty"`
	Overall  *SpeechScore  `json:"overall,omitempty"`
	// Transcript is the provider's own recognition result, which may differ
	// from the conversational STT text. Absent until a provider exists.
	Transcript string `json:"transcript,omitempty"`
}

// SpeechScore is one bounded assessment dimension.
type SpeechScore struct {
	Score int    `json:"score"`
	Label string `json:"label"`
}
