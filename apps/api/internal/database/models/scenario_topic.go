package models

import "time"

// ScenarioTopic is the fixed, ordered banner taxonomy grouping roleplay
// scenarios ("Job interview simulations").
type ScenarioTopic struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Slug      string    `gorm:"not null" json:"slug"`
	Name      string    `gorm:"not null" json:"name"`
	Position  int       `gorm:"not null" json:"position"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (ScenarioTopic) TableName() string { return "scenario_topics" }
