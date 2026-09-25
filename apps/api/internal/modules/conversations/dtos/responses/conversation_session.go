package responses

// ConversationSession is returned by POST /conversations/:id/start.
// SessionID is the EngFlex conversation id (the engine id stays server-side).
type ConversationSession struct {
	SessionID   string     `json:"sessionId"`
	IceConfig   *IceConfig `json:"iceConfig,omitempty"`
	MaxDuration int        `json:"maxDuration"`
}
