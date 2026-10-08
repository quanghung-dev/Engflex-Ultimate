package services

import (
	"context"
	"errors"
	"log/slog"
	"strings"

	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/lessons/activityconfig"
	"engflex-api/internal/modules/lessons/dtos/responses"
	"engflex-api/internal/utils"
	"engflex-api/internal/voice/pronunciation"
)

// LessonActivityService owns ordered lesson parts.
type LessonActivityService interface {
	ListByLesson(ctx context.Context, lessonID string) ([]*models.LessonActivity, error)
	GetByID(ctx context.Context, id string) (*models.LessonActivity, error)
	CheckAnswer(ctx context.Context, id string, questionIndex int, key string) (*responses.CheckResult, error)
	Pronounce(ctx context.Context, id string, itemIndex int, audio []byte, mime string) (*responses.PronunciationResult, error)
}

type lessonActivityService struct {
	repo   repositories.LessonActivityRepository
	scorer pronunciation.Scorer
}

// NewLessonActivityService builds the service over the repository interface
// and the shared pronunciation scorer.
func NewLessonActivityService(repo repositories.LessonActivityRepository, scorer pronunciation.Scorer) LessonActivityService {
	return &lessonActivityService{repo: repo, scorer: scorer}
}

func (s *lessonActivityService) ListByLesson(ctx context.Context, lessonID string) ([]*models.LessonActivity, error) {
	items, err := s.repo.ListByLesson(ctx, lessonID)
	if err != nil {
		appErr := common.FromDBError(err, "lesson activity")
		logger.Report(ctx, "list lesson activities failed", appErr, "lessonID", lessonID)
		return nil, appErr
	}
	slog.InfoContext(ctx, "lesson activities listed", "lessonID", lessonID, "count", len(items))
	return items, nil
}

func (s *lessonActivityService) GetByID(ctx context.Context, id string) (*models.LessonActivity, error) {
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "lesson activity")
		logger.Report(ctx, "get lesson activity failed", appErr, "id", id)
		return nil, appErr
	}
	return m, nil
}

// loadActivity fetches one activity, mapping DB errors to the API vocabulary.
func (s *lessonActivityService) loadActivity(ctx context.Context, id string) (*models.LessonActivity, error) {
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "lesson activity")
		logger.Report(ctx, "load lesson activity failed", appErr, "id", id)
		return nil, appErr
	}
	return m, nil
}

// CheckAnswer grades one question of a reading/listening activity. Answer keys
// live only in the config blob; nothing is returned until the caller commits.
func (s *lessonActivityService) CheckAnswer(ctx context.Context, id string, questionIndex int, key string) (*responses.CheckResult, error) {
	m, err := s.loadActivity(ctx, id)
	if err != nil {
		return nil, err
	}
	questions, err := activityconfig.QuestionsFor(m.Type, m.Config)
	if errors.Is(err, activityconfig.ErrNotCheckable) {
		return nil, common.UnprocessableEntity("activity is not checkable")
	}
	if err != nil {
		return nil, common.Internal()
	}
	if questionIndex < 0 || questionIndex >= len(questions) {
		return nil, common.BadRequest("question index out of range")
	}
	q := questions[questionIndex]
	correct := strings.EqualFold(strings.TrimSpace(key), strings.TrimSpace(q.AnswerKey))
	slog.InfoContext(ctx, "activity checked", "id", id, "questionIndex", questionIndex, "correct", correct)
	return &responses.CheckResult{Correct: correct, CorrectKey: q.AnswerKey, Explanation: q.Explanation}, nil
}

// Pronounce scores one read-aloud attempt. It resolves the reference text
// from the speaking config and delegates scoring to the shared scorer.
func (s *lessonActivityService) Pronounce(ctx context.Context, id string, itemIndex int, audio []byte, mime string) (*responses.PronunciationResult, error) {
	m, err := s.loadActivity(ctx, id)
	if err != nil {
		return nil, err
	}
	if m.Type != enums.ActivityTypeSpeaking {
		return nil, common.UnprocessableEntity("activity is not a speaking exercise")
	}
	cfg, perr := activityconfig.ParseSpeakingConfig(m.Config)
	if perr != nil {
		return nil, common.Internal()
	}
	if itemIndex < 0 || itemIndex >= len(cfg.Items) {
		return nil, common.BadRequest("item index out of range")
	}
	out, err := s.scorer.Score(ctx, cfg.Items[itemIndex].Text, audio, mime)
	if err != nil {
		return nil, err
	}
	var dto responses.PronunciationResult
	if utils.Map(&dto, out) != nil {
		return nil, common.Internal()
	}
	slog.InfoContext(ctx, "pronunciation scored", "activityID", id, "score", dto.Score)
	return &dto, nil
}
