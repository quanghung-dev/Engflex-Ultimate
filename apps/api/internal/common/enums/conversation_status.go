package enums

// ConversationStatus is the session lifecycle state (conversations.status).
type ConversationStatus string

const (
	ConversationStatusPending ConversationStatus = "pending"
	ConversationStatusLive    ConversationStatus = "live"
	ConversationStatusEnded   ConversationStatus = "ended"
	ConversationStatusFailed  ConversationStatus = "failed"
)
