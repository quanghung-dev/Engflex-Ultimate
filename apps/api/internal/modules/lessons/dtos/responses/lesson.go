package responses

import (
	"time"

	"engflex-api/internal/common/enums"
)

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

// Section is a lesson_sections row: the titled, ordered path group.
type Section struct {
	ID          string     `json:"id"`
	Slug        string     `json:"slug"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	CEFRBand    enums.CEFR `json:"cefrBand"`
	Position    int        `json:"position"`
}

// Lesson is a unit card and the unit detail header. Section repeats per
// unit so a card renders without wrapper context; the hub groups on it.
type Lesson struct {
	ID          string          `json:"id"`
	Slug        string          `json:"slug"`
	Title       string          `json:"title"`
	Section     *Section        `json:"section"`
	CEFRLevel   enums.CEFR      `json:"cefrLevel"`
	Description string          `json:"description"`
	Details     LessonDetails   `json:"details"`
	PartCount   int             `json:"partCount"`
	Progress    *LessonProgress `json:"progress"`
}

// UnitSection mirrors models.LessonSection field for field, with Units
// nested the same way, so one utils.MapSlice copies the whole hub.
type UnitSection struct {
	ID          string     `json:"id"`
	Slug        string     `json:"slug"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	CEFRBand    enums.CEFR `json:"cefrBand"`
	Position    int        `json:"position"`
	Units       []Lesson   `json:"units"`
}

// LessonDetail is the GET /lessons/:id shape: header + section + ordered
// activities. No Progress in v1 (attempts stays outside the module).
type LessonDetail struct {
	ID          string        `json:"id"`
	Slug        string        `json:"slug"`
	Title       string        `json:"title"`
	Section     *Section      `json:"section"`
	CEFRLevel   enums.CEFR    `json:"cefrLevel"`
	Description string        `json:"description"`
	Details     LessonDetails `json:"details"`
	Activities  []Activity    `json:"activities"`
}

// Bookmark is one saved lesson for the caller. Go name CreatedAt matches
// the model for copier; wire name savedAt is the product term.
type Bookmark struct {
	LessonID  string    `json:"lessonId"`
	CreatedAt time.Time `json:"savedAt"`
}
