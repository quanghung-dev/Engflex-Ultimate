package models

import "time"

// VideoTranscript is one caption segment of a video_exercises row.
type VideoTranscript struct {
	ID              string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	VideoExerciseID string    `gorm:"type:uuid;not null" json:"videoExerciseId"`
	Sequence        int       `gorm:"not null" json:"sequence"`
	Content         string    `gorm:"not null" json:"content"`
	Phonetic        string    `json:"phonetic"`
	Vietnamese      string    `json:"vietnamese"`
	StartTimestamp  float64   `json:"startTimestamp"`
	EndTimestamp    float64   `json:"endTimestamp"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (VideoTranscript) TableName() string { return "video_transcripts" }
