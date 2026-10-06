package services

import (
	"context"
	"log/slog"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
)

// LessonCategoryService owns the lesson taxonomy.
type LessonCategoryService interface {
	List(ctx context.Context, limit, offset int) ([]*models.LessonCategory, int64, error)
	GetByID(ctx context.Context, id string) (*models.LessonCategory, error)
	GetBySlug(ctx context.Context, slug string) (*models.LessonCategory, error)
}

type lessonCategoryService struct {
	repo repositories.LessonCategoryRepository
}

// NewLessonCategoryService builds the service over the repository interface.
func NewLessonCategoryService(repo repositories.LessonCategoryRepository) LessonCategoryService {
	return &lessonCategoryService{repo: repo}
}

func (s *lessonCategoryService) List(ctx context.Context, limit, offset int) ([]*models.LessonCategory, int64, error) {
	items, err := s.repo.List(ctx, limit, offset)
	if err != nil {
		appErr := common.FromDBError(err, "lesson category")
		logger.Report(ctx, "list lesson categories failed", appErr)
		return nil, 0, appErr
	}
	total, err := s.repo.Count(ctx)
	if err != nil {
		appErr := common.FromDBError(err, "lesson category")
		logger.Report(ctx, "count lesson categories failed", appErr)
		return nil, 0, appErr
	}
	slog.InfoContext(ctx, "lesson categories listed", "count", len(items), "total", total)
	return items, total, nil
}

func (s *lessonCategoryService) GetByID(ctx context.Context, id string) (*models.LessonCategory, error) {
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "lesson category")
		logger.Report(ctx, "get lesson category failed", appErr, "id", id)
		return nil, appErr
	}
	return m, nil
}

func (s *lessonCategoryService) GetBySlug(ctx context.Context, slug string) (*models.LessonCategory, error) {
	m, err := s.repo.GetBySlug(ctx, slug)
	if err != nil {
		appErr := common.FromDBError(err, "lesson category")
		logger.Report(ctx, "get lesson category by slug failed", appErr, "slug", slug)
		return nil, appErr
	}
	return m, nil
}
