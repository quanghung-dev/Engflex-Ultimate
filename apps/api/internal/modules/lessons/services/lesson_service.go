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

// LessonService owns lesson browsing. CategorySlug filtering resolves via
// the category service (service→service for filter resolution, not row
// joining — the graph itself comes from LessonRepository.GetDetail).
type LessonService interface {
	List(ctx context.Context, req requests.ListLessons, limit, offset int) ([]*models.Lesson, int64, error)
	GetDetail(ctx context.Context, id string) (*models.Lesson, error)
}

type lessonService struct {
	lessons    repositories.LessonRepository
	categories LessonCategoryService
}

// NewLessonService builds the service over the lesson repo and the category
// service used for slug→id resolution. Neither may be nil.
func NewLessonService(lessons repositories.LessonRepository, categories LessonCategoryService) LessonService {
	return &lessonService{lessons: lessons, categories: categories}
}

func (s *lessonService) List(ctx context.Context, req requests.ListLessons, limit, offset int) ([]*models.Lesson, int64, error) {
	var categoryID *string
	if req.CategorySlug != "" {
		cat, err := s.categories.GetBySlug(ctx, req.CategorySlug)
		if err != nil {
			return nil, 0, err
		}
		categoryID = &cat.ID
	}
	items, err := s.lessons.List(ctx, categoryID, req.Level, limit, offset)
	if err != nil {
		appErr := common.FromDBError(err, "lesson")
		logger.Report(ctx, "list lessons failed", appErr)
		return nil, 0, appErr
	}
	total, err := s.lessons.Count(ctx, categoryID, req.Level)
	if err != nil {
		appErr := common.FromDBError(err, "lesson")
		logger.Report(ctx, "count lessons failed", appErr)
		return nil, 0, appErr
	}
	slog.InfoContext(ctx, "lessons listed", "count", len(items), "total", total)
	return items, total, nil
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
