package models

import "time"

// LessonCategory is the author-owned lesson taxonomy
// ("Cross-team coordination").
type LessonCategory struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Slug      string    `gorm:"not null" json:"slug"`
	Name      string    `gorm:"not null" json:"name"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (LessonCategory) TableName() string { return "lesson_categories" }
