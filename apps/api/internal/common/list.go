package common

// ListParams are the reusable query params embedded by every list request
// DTO (lesson hub, vocabulary studio, future attempt/turn lists). Defaults
// and clamping are owned by utils.ParsePagination (DefaultPage,
// DefaultPageSize, MaxPageSize), not by binding tags. DTOs embed it with
// `tstype:",extends"` so tygo emits `interface ListX extends ListParams`;
// json tags mirror the query keys so generated field names match the wire.
type ListParams struct {
	Page     int    `form:"page" json:"page"`
	PageSize int    `form:"pageSize" json:"pageSize"`
	Search   string `form:"search" json:"search"`
}
