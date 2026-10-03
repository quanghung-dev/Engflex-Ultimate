package responses

type TranscriptResponse struct {
	ID             uint    `json:"id"`
	LessonID       uint    `json:"lesson_id"`
	Sequence       int     `json:"sequence"`
	Content        string  `json:"content"`
	Phonetic       string  `json:"phonetic"`
	Vietnamese     string  `json:"vietnamese"`
	StartTimestamp float64 `json:"start_timestamp"`
	EndTimestamp   float64 `json:"end_timestamp"`
}
