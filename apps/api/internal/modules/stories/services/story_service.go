package services

import (
	"context"
	"log/slog"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/stories/dtos/requests"
)

type StoryService interface {
	ListStories(ctx context.Context, req requests.ListStories, limit, offset int) ([]*models.Story, int64, error)
	GetByID(ctx context.Context, id string) (*models.Story, error)
	GetBySlug(ctx context.Context, slug string) (*models.Story, error)
	ListTopics(ctx context.Context) ([]string, error)
}

type storyService struct {
	repo repositories.StoryRepository
}

func NewStoryService(repo repositories.StoryRepository) StoryService {
	return &storyService{repo: repo}
}

func (s *storyService) ListStories(ctx context.Context, req requests.ListStories, limit, offset int) ([]*models.Story, int64, error) {
	f := repositories.StoryFilter{
		CEFR:   string(req.CEFR),
		Topic:  req.Topic,
		Search: req.Search,
		Limit:  limit,
		Offset: offset,
	}
	items, err := s.repo.List(ctx, f)
	if err != nil {
		appErr := common.FromDBError(err, "story")
		logger.Report(ctx, "list stories failed", appErr)
		return nil, 0, appErr
	}
	total, err := s.repo.Count(ctx, f)
	if err != nil {
		appErr := common.FromDBError(err, "story")
		logger.Report(ctx, "count stories failed", appErr)
		return nil, 0, appErr
	}
	slog.InfoContext(ctx, "stories listed", "count", len(items), "total", total)
	return items, total, nil
}

func (s *storyService) GetByID(ctx context.Context, id string) (*models.Story, error) {
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "story")
		logger.Report(ctx, "get story by id failed", appErr, "id", id)
		return nil, appErr
	}
	slog.InfoContext(ctx, "story retrieved", "id", id)
	return m, nil
}

func (s *storyService) GetBySlug(ctx context.Context, slug string) (*models.Story, error) {
	m, err := s.repo.GetBySlug(ctx, slug)
	if err != nil {
		appErr := common.FromDBError(err, "story")
		logger.Report(ctx, "get story by slug failed", appErr, "slug", slug)
		return nil, appErr
	}
	slog.InfoContext(ctx, "story retrieved by slug", "slug", slug)
	return m, nil
}

func (s *storyService) ListTopics(ctx context.Context) ([]string, error) {
	topics, err := s.repo.ListTopics(ctx)
	if err != nil {
		appErr := common.FromDBError(err, "story")
		logger.Report(ctx, "list story topics failed", appErr)
		return nil, appErr
	}
	slog.InfoContext(ctx, "story topics listed", "count", len(topics))
	return topics, nil
}
