package enums

// FeedbackSubjectType names what a feedback row is about. The subject is a
// polymorphic reference: there is no foreign key, so ownership is verified
// in the service before a row is written (spec section 3.1).
type FeedbackSubjectType string

const (
	// FeedbackSubjectConversationTurn is one learner turn in a voice
	// conversation. Its payload carries the language block; the speech block
	// stays absent until a provider is chosen (P3).
	FeedbackSubjectConversationTurn FeedbackSubjectType = "conversation_turn"
	// FeedbackSubjectWritingResponse and FeedbackSubjectReadingAnswer are
	// reserved for the writing and reading activities; unused in P2.
	FeedbackSubjectWritingResponse FeedbackSubjectType = "writing_response"
	FeedbackSubjectReadingAnswer   FeedbackSubjectType = "reading_answer"
)
