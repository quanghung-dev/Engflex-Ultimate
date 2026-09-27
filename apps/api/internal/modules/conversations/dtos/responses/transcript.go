package responses

// TranscriptCommand is the web-facing request for the correction modal.
//
// The four actions are one state machine on the engine, so they are one
// endpoint. The client never names a turn: its row ordinal and the engine's
// collector position are separate bookkeeping, so the engine resolves the target
// and hands back its own copy of the text.
type TranscriptCommand struct {
	// Action is one of review, retake, send, dismiss.
	Action string `json:"action"`
	// Text is the learner's correction, used only by send.
	Text string `json:"text,omitempty"`
}

// TranscriptResult is the engine's reply: where the window is now, and the
// transcript text when the action produced any.
type TranscriptResult struct {
	State string `json:"state"`
	Text  string `json:"text,omitempty"`
}
