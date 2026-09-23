package models

import "time"

// LessonBookmark is the "Save for later" state for a lesson.
type LessonBookmark struct {
	UserID    string    `gorm:"type:text;primaryKey" json:"userId"`
	LessonID  string    `gorm:"type:uuid;primaryKey" json:"lessonId"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (LessonBookmark) TableName() string { return "lesson_bookmarks" }
