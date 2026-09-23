package models

import (
	"time"

	"gorm.io/datatypes"
)

// UserProfile stores the onboarding profile for one Clerk subject. The
// surrogate id is the table's PK; user_id (Clerk subject) is unique.
// Other tables keep referencing users by user_id text with no FK.
type UserProfile struct {
	ID                    string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID                string         `gorm:"not null;uniqueIndex" json:"userId"`
	Preferences           datatypes.JSON `gorm:"type:jsonb;not null;default:'{}'" json:"preferences"`
	OnboardingCompletedAt *time.Time     `json:"onboardingCompletedAt"`
	CreatedAt             time.Time      `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt             time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (UserProfile) TableName() string { return "user_profiles" }
