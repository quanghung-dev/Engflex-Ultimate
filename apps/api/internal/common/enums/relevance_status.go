package enums

// RelevanceStatus judges whether a learner turn answers its conversation
// context (conversation_turns.feedback.relevance.status).
type RelevanceStatus string

const (
	RelevanceRelevant          RelevanceStatus = "relevant"
	RelevancePartiallyRelevant RelevanceStatus = "partially_relevant"
	RelevanceOffTopic          RelevanceStatus = "off_topic"
	RelevanceNotApplicable     RelevanceStatus = "not_applicable"
)
