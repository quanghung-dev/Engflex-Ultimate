package requests

type CreateTranscript struct {
	LessonID       uint    `json:"lesson_id" binding:"required"`
	Sequence       int     `json:"sequence" binding:"required"`
	Content        string  `json:"content" binding:"required"`
	Phonetic       string  `json:"phonetic"`
	Vietnamese     string  `json:"vietnamese"`
	StartTimestamp float64 `json:"start_timestamp"`
	EndTimestamp   float64 `json:"end_timestamp"`
}

type UpdateTranscript struct {
	Sequence       *int     `json:"sequence"`
	Content        *string  `json:"content"`
	Phonetic       *string  `json:"phonetic"`
	Vietnamese     *string  `json:"vietnamese"`
	StartTimestamp *float64 `json:"start_timestamp"`
	EndTimestamp   *float64 `json:"end_timestamp"`
}