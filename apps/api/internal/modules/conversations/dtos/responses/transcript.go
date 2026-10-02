package responses

// TranscriptCommand is the web-facing request for the correction modal.
//
// The three actions share the reviewed turn on the engine, so they are one
// endpoint. The client never names a turn: its row ordinal and the engine's
// collector position are separate bookkeeping, so the engine resolves the target
// and hands back its own copy of the text.
type TranscriptCommand struct {
	// Action is one of review, send, dismiss.
	Action string `json:"action"`
	// Text is the learner's correction, used only by send.
	Text string `json:"text,omitempty"`
}

// TranscriptResult is the engine's reply: where the review is now, and the
// transcript text when the action produced any.
type TranscriptResult struct {
	State string `json:"state"`
	Text  string `json:"text,omitempty"`
}

// TranscribeResult is the engine's reply to a retake upload: the sentence it heard.
type TranscribeResult struct {
	Text string `json:"text"`
}

// MispronouncedWord is one engine-flagged word: expected vs heard IPA.
type MispronouncedWord struct {
	Word       string  `json:"word"`
	Expected   string  `json:"expected"`
	Heard      string  `json:"heard"`
	Confidence float64 `json:"confidence"`
}

// PronounceResult is the engine's reply to an exercise attempt: the score
// plus per-word errors. The engine owns scoring; Go forwards verbatim.
type PronounceResult struct {
	Score            float64             `json:"score"`
	Transcription    string              `json:"transcription"`
	PhonemeErrorRate float64             `json:"phonemeErrorRate"`
	WordErrorRate    float64             `json:"wordErrorRate"`
	AcousticDistance float64             `json:"acousticDistance"`
	Errors           []MispronouncedWord `json:"errors"`
}
