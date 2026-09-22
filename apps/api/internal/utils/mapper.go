package utils

import (
	"github.com/jinzhu/copier"
)

// Map copies src into dst (must be a pointer). Fields are matched by name,
// e.g. gorm model -> response DTO:
//
//	var dto responses.Content
//	if err := utils.Map(&dto, model); err != nil { ... }
func Map[D any, S any](dst *D, src S, opts ...copier.Option) error {
	return copyInto(dst, &src, opts)
}

// MapSlice copies each element of src into dst (must be a pointer to a
// slice), e.g. gorm models -> response DTOs:
//
//	var dtos []responses.Content
//	if err := utils.MapSlice(&dtos, models); err != nil { ... }
func MapSlice[D any, S any](dst *[]D, src []S, opts ...copier.Option) error {
	return copyInto(dst, &src, opts)
}

func copyInto(dst, src any, opts []copier.Option) error {
	if len(opts) == 0 {
		return copier.Copy(dst, src)
	}
	return copier.CopyWithOption(dst, src, opts[0])
}
