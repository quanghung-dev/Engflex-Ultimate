package models

import (
	"time"

	"engflex-api/internal/common/enums"
)

// ConversationTurn is one transcript line. position keeps transcript order
// deterministic (created_at alone ties within a transaction).
// was_interrupted marks a turn the learner cut in on. Per-subject analysis
// lives in the global feedbacks table, not here (spec D17).
//
// Feedback is that coaching record, attached by Joins("Feedback") in the same
// round trip as the turns. The relation is polymorphic: feedbacks is keyed by
// (subject_type, subject_id) with no foreign key, so the mapping is declared
// here in Go and needs no migration. It stays nil for a turn with no feedback
// yet — the LEFT JOIN does not invent one. Never set it on a turn you insert:
// feedback is written by its own Upsert.
type ConversationTurn struct {
	ID             string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ConversationID string         `gorm:"type:uuid;not null" json:"conversationId"`
	Position       int            `gorm:"not null" json:"position"`
	Role           enums.TurnRole `gorm:"not null" json:"role"`
	Text           string         `gorm:"not null" json:"text"`
	WasInterrupted bool           `gorm:"not null;default:false" json:"wasInterrupted"`
	// "->" is read-only: Creatable/Updatable false, Readable true. The field
	// stays a registered relationship, so Joins("Feedback") keeps populating it
	// and the Feedback__* aliases still scan, but SelectAndOmitColumns marks it
	// excluded, so SaveBeforeAssociations skips it. Without a write barrier here
	// GORM treats a populated Feedback as an association to save, and upserting a
	// turn that came back from ListTurnsWithFeedback silently INSERTs a duplicate
	// feedbacks row — verified against a real database, not inferred. Do not
	// "simplify" this to a bare foreignKey tag, to "-", or to a comment: only a
	// permission bit protects the write path.
	Feedback  *Feedback `gorm:"->;foreignKey:SubjectID;references:ID" json:"feedback,omitempty"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (ConversationTurn) TableName() string { return "conversation_turns" }
