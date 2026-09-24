package models

import (
	"time"

	"gorm.io/datatypes"

	"engflex-api/internal/common/enums"
)

// Scenario is a roleplay practice card under a topic banner. A non-null
// UserID marks a user's custom scenario; details (jsonb) holds
// {duration_min, duration_max}.
type Scenario struct {
	ID        string                   `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TopicID   string                   `gorm:"type:uuid;not null" json:"topicId"`
	PersonaID *string                  `gorm:"type:uuid" json:"personaId"`
	Title     string                   `gorm:"not null" json:"title"`
	Objective string                   `gorm:"not null;default:''" json:"objective"`
	CEFRLevel enums.ScenarioDifficulty `gorm:"column:cefr_level;not null" json:"cefrLevel"`
	Details   datatypes.JSON           `gorm:"type:jsonb;not null;default:'{}'" json:"details"`
	UserID    *string                  `json:"userId"`
	CreatedAt time.Time                `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time                `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Scenario) TableName() string { return "scenarios" }
