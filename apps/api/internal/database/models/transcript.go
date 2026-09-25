package models

type Transcript struct {
	ID             uint    `gorm:"primaryKey" json:"id"`
	LessonID       uint    `gorm:"not null;index" json:"lesson_id"`
	Sequence       int     `gorm:"not null" json:"sequence"`
	Content        string  `gorm:"type:text;not null" json:"content"`
	Phonetic       string  `gorm:"type:varchar(500)" json:"phonetic"`
	Vietnamese     string  `gorm:"type:text" json:"vietnamese"`
	StartTimestamp float64 `json:"start_timestamp"`
	EndTimestamp   float64 `json:"end_timestamp"`
}

func (Transcript) TableName() string {
	return "transcripts"
}
