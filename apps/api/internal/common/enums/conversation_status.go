package enums

// ConversationStatus is the session lifecycle state (conversations.status).
type ConversationStatus string

const (
	ConversationStatusLive  ConversationStatus = "live"
	ConversationStatusEnded ConversationStatus = "ended"
)
