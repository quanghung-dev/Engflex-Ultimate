package services

import (
	"context"
	"log/slog"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
)

// LessonActivityService owns ordered lesson parts.
type LessonActivityService interface {
	ListByLesson(ctx context.Context, lessonID string) ([]*models.LessonActivity, error)
	GetByID(ctx context.Context, id string) (*models.LessonActivity, error)
}

type lessonActivityService struct {
	repo repositories.LessonActivityRepository
}

// NewLessonActivityService builds the service over the repository interface.
func NewLessonActivityService(repo repositories.LessonActivityRepository) LessonActivityService {
	return &lessonActivityService{repo: repo}
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
