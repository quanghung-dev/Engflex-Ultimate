package requests

import "engflex-api/internal/common"

// ListScenarios pages the scenario catalog, optionally topic-filtered.
type ListScenarios struct {
	common.ListParams `tstype:",extends"`
	TopicID           *string `form:"topicId" json:"topicId"`
}
