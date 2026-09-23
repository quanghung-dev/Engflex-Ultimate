package requests

import (
	"github.com/gianghp123/engflex-ultimate/internal/common"
	"github.com/gianghp123/engflex-ultimate/internal/common/enums"
)

// ListLessons filters the lesson hub (level, category, skill tab,
// completion status). Pagination/search come from the embedded
// common.ListParams (tstype:",extends" -> `interface ListLessons extends
// ListParams`); json tags mirror the query keys so the generated TS field
// names match the wire.
type ListLessons struct {
	common.ListParams `tstype:",extends"`
	Level             enums.CEFR         `form:"level" json:"level" binding:"omitempty,oneof=A1 A2 B1 B2 C1 C2"`
	CategorySlug      string             `form:"categorySlug" json:"categorySlug"`
	Skill             enums.ActivityType `form:"skill" json:"skill" binding:"omitempty,oneof=reading dictation writing voice"`
	Status            enums.LessonStatus `form:"status" json:"status" binding:"omitempty,oneof=unstarted in_progress completed"`
}
