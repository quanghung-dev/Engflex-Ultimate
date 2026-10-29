package services

import (
	"context"
	"log/slog"

	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
)

type BookmarkService interface {
	ListByUser(ctx context.Context, userID, contentType string) ([]*models.Bookmark, error)
	Save(ctx context.Context, userID string, contentType enums.ContentType, contentID string) (*models.Bookmark, error)
	Unsave(ctx context.Context, userID, contentType, contentID string) error
}

type bookmarkService struct {
	repo repositories.BookmarkRepository
}

func NewBookmarkService(repo repositories.BookmarkRepository) BookmarkService {
	return &bookmarkService{repo: repo}
}

func (s *bookmarkService) ListByUser(ctx context.Context, userID, contentType string) ([]*models.Bookmark, error) {
	items, err := s.repo.ListByUser(ctx, userID, contentType)
	if err != nil {
		appErr := common.FromDBError(err, "bookmark")
		logger.Report(ctx, "list bookmarks failed", appErr, "userID", userID, "contentType", contentType)
		return nil, appErr
	}
	slog.InfoContext(ctx, "bookmarks listed", "count", len(items), "contentType", contentType)
	return items, nil
}

func (s *bookmarkService) Save(ctx context.Context, userID string, contentType enums.ContentType, contentID string) (*models.Bookmark, error) {
	b := &models.Bookmark{UserID: userID, ContentType: contentType, ContentID: contentID}
	if err := s.repo.Create(ctx, b); err != nil {
		appErr := common.FromDBError(err, "bookmark")
		logger.Report(ctx, "save bookmark failed", appErr, "contentType", contentType, "contentID", contentID)
		return nil, appErr
	}
	got, err := s.repo.Get(ctx, userID, string(contentType), contentID)
	if err != nil {
		appErr := common.FromDBError(err, "bookmark")
		logger.Report(ctx, "read saved bookmark failed", appErr, "contentType", contentType, "contentID", contentID)
		return nil, appErr
	}
	slog.InfoContext(ctx, "bookmark saved", "contentType", contentType, "contentID", contentID)
	return got, nil
}

func (s *bookmarkService) Unsave(ctx context.Context, userID, contentType, contentID string) error {
	if err := s.repo.Delete(ctx, userID, contentType, contentID); err != nil {
		appErr := common.FromDBError(err, "bookmark")
		logger.Report(ctx, "unsave bookmark failed", appErr, "contentType", contentType, "contentID", contentID)
		return appErr
	}
	slog.InfoContext(ctx, "bookmark unsaved", "contentType", contentType, "contentID", contentID)
	return nil
}
