package requests

import "engflex-api/internal/common"

// ListPersonas pages the persona catalog.
type ListPersonas struct {
	common.ListParams `tstype:",extends"`
}
