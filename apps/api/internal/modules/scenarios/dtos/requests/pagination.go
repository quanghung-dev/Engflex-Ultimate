package requests

import "engflex-api/internal/common"

// ListScenarios pages the scenario catalog. Scope selects built-in rows
// (user_id IS NULL) or the caller's own custom rows.
type ListScenarios struct {
	common.ListParams `tstype:",extends"`
	TopicID           *string `form:"topicId" json:"topicId"`
	Scope             string  `form:"scope" json:"scope" binding:"omitempty,oneof=all custom"`
}
