package models

import (
	"time"

	"gorm.io/datatypes"

	"engflex-api/internal/common/enums"
)

// Feedback is the global, per-subject coaching record: one row per
// (subject_type, subject_id), whatever the subject is. There is deliberately
// no `type` column -- the subject-to-product mapping is a product invariant,
// so the payload envelope carries the variation instead (spec D17/D18).
// user_id is denormalized because the polymorphic pair has no foreign key;
// it keeps "all my feedback" and "delete my data" answerable.
type Feedback struct {
	ID          string                    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID      string                    `gorm:"not null" json:"userId"`
	SubjectType enums.FeedbackSubjectType `gorm:"not null" json:"subjectType"`
	SubjectID   string                    `gorm:"not null" json:"subjectId"`
	Payload     datatypes.JSON            `gorm:"type:jsonb;not null" json:"payload"`
	CreatedAt   time.Time                 `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time                 `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Feedback) TableName() string { return "feedbacks" }
