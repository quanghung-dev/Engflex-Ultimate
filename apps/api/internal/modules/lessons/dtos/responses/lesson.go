package responses

import (
	"time"

	"engflex-api/internal/common/enums"
)

// Category is a lesson_categories row.
type Category struct {
	ID   string `json:"id"`
	Slug string `json:"slug"`
	Name string `json:"name"`
}

// LessonDetails mirrors lessons.details (jsonb).
type LessonDetails struct {
	EstimatedDurationMin *int                `json:"estimatedDurationMin"`
	AcousticTargetPct    *int                `json:"acousticTargetPct"`
	CoverImageURL        string              `json:"coverImageUrl"`
	Skill                *enums.ActivityType `json:"skill"`
}

// LessonProgress is the user-specific state derived from attempts and
// bookmarks (nil when the user has no interaction with the lesson).
type LessonProgress struct {
	Status         enums.LessonStatus `json:"status"`
	Percent        int                `json:"percent"`
	PartsCompleted int                `json:"partsCompleted"`
	PartsTotal     int                `json:"partsTotal"`
	Bookmarked     bool               `json:"bookmarked"`
	SavedAt        *time.Time         `json:"savedAt"`
}

// Lesson is a lesson hub card and the lesson detail header.
type Lesson struct {
	ID          string          `json:"id"`
	Slug        string          `json:"slug"`
	Title       string          `json:"title"`
	Category    *Category       `json:"category"`
	CEFRLevel   enums.CEFR      `json:"cefrLevel"`
	Description string          `json:"description"`
	Details     LessonDetails   `json:"details"`
	PartCount   int             `json:"partCount"`
	Progress    *LessonProgress `json:"progress"`
}
