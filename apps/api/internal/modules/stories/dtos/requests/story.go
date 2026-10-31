package requests

import (
	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
)

type ListStories struct {
	common.ListParams `tstype:",extends"`
	CEFR              enums.CEFR `form:"cefr" json:"cefr" binding:"omitempty,oneof=A1 A2 B1 B2 C1 C2"`
	Topic             string     `form:"topic" json:"topic" binding:"omitempty,max=100"`
}
