package responses

import "time"

type VideoTranscriptResponse struct {
	ID              string    `json:"id"`
	VideoExerciseID string    `json:"videoExerciseId"`
	Sequence        int       `json:"sequence"`
	Content         string    `json:"content"`
	Phonetic        string    `json:"phonetic"`
	Vietnamese      string    `json:"vietnamese"`
	StartTimestamp  float64   `json:"startTimestamp"`
	EndTimestamp    float64   `json:"endTimestamp"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}
