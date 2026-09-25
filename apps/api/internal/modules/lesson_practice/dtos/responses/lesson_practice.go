package responses

import (
	"time"

	"engflex-api/internal/common/enums"
)

// LessonPracticeCategory is a lesson_practice_categories row.
type LessonPracticeCategory struct {
	ID   string `json:"id"`
	Slug string `json:"slug"`
	Name string `json:"name"`
}

// LessonPracticeDetails mirrors lessons_practice.details (jsonb).
type LessonPracticeDetails struct {
	EstimatedDurationMin *int                `json:"estimatedDurationMin"`
	AcousticTargetPct    *int                `json:"acousticTargetPct"`
	CoverImageURL        string              `json:"coverImageUrl"`
	Skill                *enums.ActivityType `json:"skill"`
}

// LessonPracticeProgress is the user-specific state derived from attempts and
// bookmarks (nil when the user has no interaction with the lesson).
type LessonPracticeProgress struct {
	Status         enums.LessonStatus `json:"status"`
	Percent        int                `json:"percent"`
	PartsCompleted int                `json:"partsCompleted"`
	PartsTotal     int                `json:"partsTotal"`
	Bookmarked     bool               `json:"bookmarked"`
	SavedAt        *time.Time         `json:"savedAt"`
}

// LessonPractice is a lesson hub card and the lesson detail header.
type LessonPractice struct {
	ID          string                  `json:"id"`
	Slug        string                  `json:"slug"`
	Title       string                  `json:"title"`
	Category    *LessonPracticeCategory `json:"category"`
	CEFRLevel   enums.CEFR              `json:"cefrLevel"`
	Description string                  `json:"description"`
	Details     LessonPracticeDetails   `json:"details"`
	PartCount   int                     `json:"partCount"`
	Progress    *LessonPracticeProgress `json:"progress"`
}
