package models

import (
	"time"

	"gorm.io/datatypes"

	"engflex-api/internal/common/enums"
)

// ConversationTurn is one transcript line. position keeps transcript order
// deterministic (created_at alone ties within a transaction). feedback
// (jsonb, nullable) carries word marks, phoneme accuracy, phrase upgrades,
// and the coaching tip for analyzed turns.
type ConversationTurn struct {
	ID             string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ConversationID string         `gorm:"type:uuid;not null" json:"conversationId"`
	Position       int            `gorm:"not null" json:"position"`
	Role           enums.TurnRole `gorm:"not null" json:"role"`
	Text           string         `gorm:"not null" json:"text"`
	Feedback       datatypes.JSON `gorm:"type:jsonb" json:"feedback"`
	CreatedAt      time.Time      `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt      time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (ConversationTurn) TableName() string { return "conversation_turns" }
