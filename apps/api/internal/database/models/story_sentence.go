package models

import "time"

type StorySentence struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	StoryID        string    `gorm:"type:uuid;not null" json:"storyId"`
	Sequence       int       `gorm:"not null" json:"sequence"`
	EnglishText    string    `gorm:"not null" json:"englishText"`
	VietnameseText string    `gorm:"not null;default:''" json:"vietnameseText"`
	StartTimestamp float64   `gorm:"not null;default:0" json:"startTimestamp"`
	EndTimestamp   float64   `gorm:"not null;default:0" json:"endTimestamp"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (StorySentence) TableName() string { return "story_sentences" }
