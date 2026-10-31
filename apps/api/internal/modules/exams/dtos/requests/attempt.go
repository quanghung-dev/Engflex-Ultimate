package requests

import "engflex-api/internal/common/enums"

// StartAttempt contains only the learner's choices; ownership and state are
// assigned by the server.
type StartAttempt struct {
	Mode          enums.ExamMode `json:"mode" binding:"required,oneof=exam practice"`
	SelectedParts []int          `json:"selectedParts" binding:"required,min=1,max=7,dive,min=1,max=7"`
}
