package responses

import (
	"time"

	"engflex-api/internal/common/enums"
)

type StorySentence struct {
	ID             string  `json:"id"`
	StoryID        string  `json:"storyId"`
	Sequence       int     `json:"sequence"`
	EnglishText    string  `json:"englishText"`
	VietnameseText string  `json:"vietnameseText"`
	StartTimestamp float64 `json:"startTimestamp"`
	EndTimestamp   float64 `json:"endTimestamp"`
}

type StoryItem struct {
	ID              string      `json:"id"`
	Slug            string      `json:"slug"`
	Title           string      `json:"title"`
	TitleVietnamese *string     `json:"titleVietnamese"`
	CEFRLevel       *enums.CEFR `json:"cefrLevel"`
	Topic           string      `json:"topic"`
	ThumbnailURL    *string     `json:"thumbnailUrl"`
	AudioURL        string      `json:"audioUrl"`
	Duration        float64     `json:"duration"`
	CreatedAt       time.Time   `json:"createdAt"`
}

type StoryDetail struct {
	ID              string           `json:"id"`
	Slug            string           `json:"slug"`
	Title           string           `json:"title"`
	TitleVietnamese *string          `json:"titleVietnamese"`
	CEFRLevel       *enums.CEFR      `json:"cefrLevel"`
	Topic           string           `json:"topic"`
	ThumbnailURL    *string          `json:"thumbnailUrl"`
	AudioURL        string           `json:"audioUrl"`
	Duration        float64          `json:"duration"`
	Sentences       []*StorySentence `json:"sentences"`
	CreatedAt       time.Time        `json:"createdAt"`
}
