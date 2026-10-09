package services

import (
	"context"
	"log/slog"

	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/vocabulary/dtos/requests"
	"engflex-api/internal/utils"
)

// UserVocabularyService owns per-user word state.
type UserVocabularyService interface {
	ListByUser(ctx context.Context, userID string, limit, offset int) ([]*models.UserVocabulary, error)
	Save(ctx context.Context, userID string, req requests.SaveUserVocabulary) (*models.UserVocabulary, error)
	Unsave(ctx context.Context, userID, itemID string) error
}

type userVocabularyService struct {
	repo repositories.UserVocabularyRepository
}

// NewUserVocabularyService builds the service over the repository interface.
func NewUserVocabularyService(repo repositories.UserVocabularyRepository) UserVocabularyService {
	return &userVocabularyService{repo: repo}
}

func (s *userVocabularyService) ListByUser(ctx context.Context, userID string, limit, offset int) ([]*models.UserVocabulary, error) {
	items, err := s.repo.ListByUser(ctx, userID, limit, offset)
	if err != nil {
		appErr := common.FromDBError(err, "user vocabulary")
		logger.Report(ctx, "list user vocabulary failed", appErr)
		return nil, appErr
	}
	slog.InfoContext(ctx, "user vocabulary listed", "count", len(items))
	return items, nil
}

// Save stores per-user state idempotently via Upsert.
func (s *userVocabularyService) Save(ctx context.Context, userID string, req requests.SaveUserVocabulary) (*models.UserVocabulary, error) {
	u := &models.UserVocabulary{UserID: userID}
	if err := utils.Map(u, req); err != nil {
		logger.Report(ctx, "map save user vocabulary failed", err)
		return nil, common.Internal()
	}
	u.SourceType = enums.VocabularySource(req.SourceType)
	if err := s.repo.Upsert(ctx, u); err != nil {
		appErr := common.FromDBError(err, "vocabulary item")
		logger.Report(ctx, "save user vocabulary failed", appErr)
		return nil, appErr
	}
	got, err := s.repo.Get(ctx, userID, req.ItemID)
	if err != nil {
		appErr := common.FromDBError(err, "user vocabulary")
		logger.Report(ctx, "read saved user vocabulary failed", appErr)
		return nil, appErr
	}
	slog.InfoContext(ctx, "user vocabulary saved", "itemID", req.ItemID)
	return got, nil
}

func (s *userVocabularyService) Unsave(ctx context.Context, userID, itemID string) error {
	if err := s.repo.Delete(ctx, userID, itemID); err != nil {
		appErr := common.FromDBError(err, "user vocabulary")
		logger.Report(ctx, "unsave user vocabulary failed", appErr)
		return appErr
	}
	slog.InfoContext(ctx, "user vocabulary unsaved", "itemID", itemID)
	return nil
}
