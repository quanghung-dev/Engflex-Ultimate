package services

import (
	"context"
	"log/slog"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
)

// LessonBookmarkService owns the caller's saved lessons.
type LessonBookmarkService interface {
	ListByUser(ctx context.Context, userID string) ([]*models.LessonBookmark, error)
	Save(ctx context.Context, userID, lessonID string) (*models.LessonBookmark, error)
	Unsave(ctx context.Context, userID, lessonID string) error
}

type lessonBookmarkService struct {
	repo repositories.LessonBookmarkRepository
}

// NewLessonBookmarkService builds the service over the repository interface.
func NewLessonBookmarkService(repo repositories.LessonBookmarkRepository) LessonBookmarkService {
	return &lessonBookmarkService{repo: repo}
}

func (s *lessonBookmarkService) ListByUser(ctx context.Context, userID string) ([]*models.LessonBookmark, error) {
	items, err := s.repo.ListByUser(ctx, userID)
	if err != nil {
		appErr := common.FromDBError(err, "lesson bookmark")
		logger.Report(ctx, "list lesson bookmarks failed", appErr)
		return nil, appErr
	}
	return items, nil
}

// Save bookmarks a lesson idempotently: a repeated save returns the row,
// not a conflict (repository uses ON CONFLICT DO NOTHING).
func (s *lessonBookmarkService) Save(ctx context.Context, userID, lessonID string) (*models.LessonBookmark, error) {
	b := &models.LessonBookmark{UserID: userID, LessonID: lessonID}
	if err := s.repo.Create(ctx, b); err != nil {
		appErr := common.FromDBError(err, "lesson")
		logger.Report(ctx, "save lesson bookmark failed", appErr, "lessonID", lessonID)
		return nil, appErr
	}
	got, err := s.repo.Get(ctx, userID, lessonID)
	if err != nil {
		appErr := common.FromDBError(err, "lesson bookmark")
		logger.Report(ctx, "read saved lesson bookmark failed", appErr, "lessonID", lessonID)
		return nil, appErr
	}
	slog.InfoContext(ctx, "lesson bookmarked", "lessonID", lessonID)
	return got, nil
}

func (s *lessonBookmarkService) Unsave(ctx context.Context, userID, lessonID string) error {
	if err := s.repo.Delete(ctx, userID, lessonID); err != nil {
		appErr := common.FromDBError(err, "lesson bookmark")
		logger.Report(ctx, "unsave lesson bookmark failed", appErr, "lessonID", lessonID)
		return appErr
	}
	slog.InfoContext(ctx, "lesson unbookmarked", "lessonID", lessonID)
	return nil
}
