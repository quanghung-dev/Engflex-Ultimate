package requests

type CreateVideoTranscript struct {
	VideoExerciseID string  `json:"videoExerciseId" binding:"required,uuid"`
	Sequence        int     `json:"sequence" binding:"required"`
	Content         string  `json:"content" binding:"required"`
	Phonetic        string  `json:"phonetic"`
	Vietnamese      string  `json:"vietnamese"`
	StartTimestamp  float64 `json:"startTimestamp"`
	EndTimestamp    float64 `json:"endTimestamp"`
}

type UpdateVideoTranscript struct {
	Sequence       *int     `json:"sequence"`
	Content        *string  `json:"content"`
	Phonetic       *string  `json:"phonetic"`
	Vietnamese     *string  `json:"vietnamese"`
	StartTimestamp *float64 `json:"startTimestamp"`
	EndTimestamp   *float64 `json:"endTimestamp"`
}
