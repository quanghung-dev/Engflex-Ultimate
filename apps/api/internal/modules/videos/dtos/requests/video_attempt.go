package requests

type StartVideoAttempt struct {
	ForceNew bool `json:"forceNew"`
}

type SaveVideoProgress struct {
	ActiveSequence         int            `json:"activeSequence" binding:"min=0"`
	ActiveTranscriptID     *string        `json:"activeTranscriptId" binding:"omitempty,uuid"`
	Level                  *string        `json:"level" binding:"omitempty,oneof=easy normal hard"`
	CompletedTranscriptIDs []string       `json:"completedTranscriptIds"`
	Transcripts            map[string]any `json:"transcripts"`
}

type CompleteVideoAttempt struct {
	Score       *float64 `json:"score" binding:"omitempty,min=0,max=100"`
	DurationSec *int     `json:"durationSec" binding:"omitempty,min=0"`
}
