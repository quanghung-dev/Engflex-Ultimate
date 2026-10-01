package models

import "time"

// LessonPracticeBookmark is the "Save for later" state for a lesson practice.
type LessonPracticeBookmark struct {
	UserID           string    `gorm:"type:text;primaryKey" json:"userId"`
	LessonPracticeID string    `gorm:"column:lesson_practice_id;type:uuid;primaryKey" json:"lessonPracticeId"`
	CreatedAt        time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (LessonPracticeBookmark) TableName() string { return "lesson_practice_bookmarks" }
