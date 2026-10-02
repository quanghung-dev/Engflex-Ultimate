package enums

// SpanStatus is the severity of one analysis span
// (conversation_turns.feedback.spans[].status).
type SpanStatus string

const (
	SpanStatusIncorrect SpanStatus = "incorrect"
	SpanStatusAwkward   SpanStatus = "awkward"
)
