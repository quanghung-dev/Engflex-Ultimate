package models

import "time"

type Lesson struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	CategoryID   *uint     `gorm:"index" json:"category_id"`
	Title        string    `gorm:"type:varchar(255)" json:"title"`
	Description  string    `gorm:"type:text" json:"description"`
	VideoURL     string    `gorm:"type:varchar(500);not null" json:"video_url"`
	ThumbnailURL string    `gorm:"type:varchar(500)" json:"thumbnail_url"`
	Level        string    `gorm:"type:varchar(20)" json:"level"`
	Duration     float64   `json:"duration"`
	CreatedAt    time.Time `json:"created_at"`
}

func (Lesson) TableName() string {
	return "lessons"
}
