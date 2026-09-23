package models

import (
	"time"

	"github.com/gianghp123/engflex-ultimate/internal/common/enums"
)

// Conversation is one voice session (free talk or roleplay). Duration is
// derived from started_at/ended_at.
type Conversation struct {
	ID         string                   `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     string                   `gorm:"not null" json:"userId"`
	Mode       enums.ConversationMode   `gorm:"not null" json:"mode"`
	ScenarioID *string                  `gorm:"type:uuid" json:"scenarioId"`
	Status     enums.ConversationStatus `gorm:"not null" json:"status"`
	StartedAt  time.Time                `gorm:"not null;default:now()" json:"startedAt"`
	EndedAt    *time.Time               `json:"endedAt"`
	CreatedAt  time.Time                `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt  time.Time                `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Conversation) TableName() string { return "conversations" }
