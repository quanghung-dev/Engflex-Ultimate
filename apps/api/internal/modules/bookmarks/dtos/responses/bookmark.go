package responses

import (
	"time"

	"engflex-api/internal/common/enums"
)

type Bookmark struct {
	ContentType enums.ContentType `json:"contentType"`
	ContentID   string            `json:"contentId"`
	CreatedAt   time.Time         `json:"createdAt"`
}
