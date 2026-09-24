package requests

import "engflex-api/internal/common/enums"

// UpdateProfile carries the onboarding/profile preference fields
// (all optional; partial update).
type UpdateProfile struct {
	Level              enums.Level           `json:"level" binding:"omitempty,oneof=beginner intermediate advanced"`
	PrimaryGoal        enums.Goal            `json:"primaryGoal" binding:"omitempty,oneof=travel work exams daily fun"`
	DailyCommitmentMin int                   `json:"dailyCommitmentMin" binding:"omitempty,oneof=5 10 15 30"`
	Topics             []enums.InterestTopic `json:"topics" binding:"omitempty,min=2"`
}
