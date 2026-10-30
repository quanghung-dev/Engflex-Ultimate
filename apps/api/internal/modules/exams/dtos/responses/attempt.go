package responses

import (
	"time"

	"engflex-api/internal/common/enums"
)

type Category struct {
	ID    string         `json:"id"`
	Slug  string         `json:"slug"`
	Title string         `json:"title"`
	Type  enums.ExamType `json:"type"`
}

type ExamAttemptSummary struct {
	ID            string              `json:"id"`
	Status        enums.AttemptStatus `json:"status"`
	Mode          *enums.ExamMode     `json:"mode"`
	SelectedParts []int64             `json:"selectedParts"`
	Score         *float64            `json:"score"`
	DurationSec   *int                `json:"durationSec"`
	StartedAt     *time.Time          `json:"startedAt"`
	SubmittedAt   *time.Time          `json:"submittedAt"`
	DeadlineAt    *time.Time          `json:"deadlineAt"`
	CreatedAt     time.Time           `json:"createdAt"`
	ExamTest      *AttemptTestSummary `json:"examTest"`
}
type AttemptTestSummary struct {
	ID         string    `json:"id"`
	CategoryID string    `json:"categoryId"`
	Slug       string    `json:"slug"`
	Title      string    `json:"title"`
	Category   *Category `json:"category"`
}

type ExamAttempt struct {
	ID            string              `json:"id"`
	Status        enums.AttemptStatus `json:"status"`
	Mode          *enums.ExamMode     `json:"mode"`
	SelectedParts []int64             `json:"selectedParts"`
	Score         *float64            `json:"score"`
	DurationSec   *int                `json:"durationSec"`
	StartedAt     *time.Time          `json:"startedAt"`
	SubmittedAt   *time.Time          `json:"submittedAt"`
	DeadlineAt    *time.Time          `json:"deadlineAt"`
	CreatedAt     time.Time           `json:"createdAt"`
	ExamTest      *TakingTest         `json:"examTest"`
	ParsedResult  *Result             `json:"result"`
}
type TakingTest struct {
	ID            string         `json:"id"`
	CategoryID    string         `json:"categoryId"`
	Slug          string         `json:"slug"`
	Title         string         `json:"title"`
	Category      *Category      `json:"category"`
	ParsedContent *TakingContent `json:"content"`
}

type ReviewAttempt struct {
	ID            string              `json:"id"`
	Status        enums.AttemptStatus `json:"status"`
	Mode          *enums.ExamMode     `json:"mode"`
	SelectedParts []int64             `json:"selectedParts"`
	Score         *float64            `json:"score"`
	DurationSec   *int                `json:"durationSec"`
	StartedAt     *time.Time          `json:"startedAt"`
	SubmittedAt   *time.Time          `json:"submittedAt"`
	DeadlineAt    *time.Time          `json:"deadlineAt"`
	CreatedAt     time.Time           `json:"createdAt"`
	ExamTest      *ReviewTest         `json:"examTest"`
	ParsedResult  *Result             `json:"result"`
}
type ReviewTest struct {
	ID            string         `json:"id"`
	CategoryID    string         `json:"categoryId"`
	Slug          string         `json:"slug"`
	Title         string         `json:"title"`
	Category      *Category      `json:"category"`
	ParsedContent *ReviewContent `json:"content"`
}
