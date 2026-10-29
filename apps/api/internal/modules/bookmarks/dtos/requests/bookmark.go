package requests

import "engflex-api/internal/common/enums"

type ListBookmarks struct {
	ContentType enums.ContentType `form:"type" json:"type" binding:"omitempty,oneof=lesson video story"`
}

type SaveBookmark struct {
	ContentType enums.ContentType `json:"contentType" binding:"required,oneof=lesson video story"`
	ContentID   string            `json:"contentId" binding:"required,uuid"`
}
