package services

import (
	"context"
	"log/slog"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/lessons/dtos/requests"
)

// LessonService owns section-first browsing: sections with units attached,
// in path order. The hub renders the whole path, unpaginated.
type LessonService interface {
	ListSections(ctx context.Context, req requests.ListLessons) ([]*models.LessonSection, error)
	GetDetail(ctx context.Context, id string) (*models.Lesson, error)
}

type lessonService struct {
	sections repositories.LessonSectionRepository
	lessons  repositories.LessonRepository
}

// NewLessonService builds the service over both repositories. Neither may
// be nil.
func NewLessonService(sections repositories.LessonSectionRepository, lessons repositories.LessonRepository) LessonService {
	return &lessonService{sections: sections, lessons: lessons}
}

func (s *lessonService) ListSections(ctx context.Context, req requests.ListLessons) ([]*models.LessonSection, error) {
	secs, err := s.sections.ListWithUnits(ctx, req.Level)
	if err != nil {
		appErr := common.FromDBError(err, "lesson section")
		logger.Report(ctx, "list lesson sections failed", appErr)
		return nil, appErr
	}
	slog.InfoContext(ctx, "lesson sections listed", "count", len(secs))
	return secs, nil
}

func (s *lessonService) GetDetail(ctx context.Context, id string) (*models.Lesson, error) {
	m, err := s.lessons.GetDetail(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "lesson")
		logger.Report(ctx, "get lesson detail failed", appErr, "id", id)
		return nil, appErr
	}
	slog.InfoContext(ctx, "lesson detail found", "id", m.ID)
	return m, nil
}
