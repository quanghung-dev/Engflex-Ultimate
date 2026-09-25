package models

import "time"

// LessonPracticeCategory is the author-owned lesson taxonomy
// ("Cross-team coordination").
type LessonPracticeCategory struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Slug      string    `gorm:"not null" json:"slug"`
	Name      string    `gorm:"not null" json:"name"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (LessonPracticeCategory) TableName() string { return "lesson_practice_categories" }
