package enums

// ContentType identifies the resource kind in polymorphic tables like bookmarks.
type ContentType string

const (
	ContentTypeLesson ContentType = "lesson"
	ContentTypeVideo  ContentType = "video"
	ContentTypeStory  ContentType = "story"
)
