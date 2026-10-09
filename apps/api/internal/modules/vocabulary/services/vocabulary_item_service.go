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

// VocabularyItemService owns the shared dictionary.
type VocabularyItemService interface {
	List(ctx context.Context, limit, offset int) ([]*models.VocabularyItem, int64, error)
	GetByID(ctx context.Context, id string) (*models.VocabularyItem, error)
	Create(ctx context.Context, userID string, req requests.CreateVocabularyItem) (*models.VocabularyItem, error)
}

type vocabularyItemService struct {
	repo repositories.VocabularyItemRepository
}

// NewVocabularyItemService builds the service over the repository interface.
func NewVocabularyItemService(repo repositories.VocabularyItemRepository) VocabularyItemService {
	return &vocabularyItemService{repo: repo}
}

func (s *vocabularyItemService) List(ctx context.Context, limit, offset int) ([]*models.VocabularyItem, int64, error) {
	items, err := s.repo.List(ctx, limit, offset)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary item")
		logger.Report(ctx, "list vocabulary items failed", appErr)
		return nil, 0, appErr
	}
	total, err := s.repo.Count(ctx)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary item")
		logger.Report(ctx, "count vocabulary items failed", appErr)
		return nil, 0, appErr
	}
	slog.InfoContext(ctx, "vocabulary items listed", "count", len(items), "total", total)
	return items, total, nil
}

func (s *vocabularyItemService) GetByID(ctx context.Context, id string) (*models.VocabularyItem, error) {
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary item")
		logger.Report(ctx, "get vocabulary item failed", appErr, "id", id)
		return nil, appErr
	}
	slog.InfoContext(ctx, "vocabulary item found", "id", m.ID)
	return m, nil
}

func (s *vocabularyItemService) Create(ctx context.Context, userID string, req requests.CreateVocabularyItem) (*models.VocabularyItem, error) {
	i := &models.VocabularyItem{}
	if err := utils.Map(i, req); err != nil {
		logger.Report(ctx, "map create vocabulary item failed", err)
		return nil, common.Internal()
	}
	i.CEFR = enums.CEFR(req.CEFR)
	if req.Domain != nil {
		d := enums.VocabularyDomain(*req.Domain)
		i.Domain = &d
	}
	if userID != "" {
		uid := userID
		i.CreatedByUserID = &uid
	}
	if err := s.repo.Create(ctx, i); err != nil {
		appErr := common.FromDBError(err, "vocabulary item")
		logger.Report(ctx, "create vocabulary item failed", appErr)
		return nil, appErr
	}
	slog.InfoContext(ctx, "vocabulary item created", "id", i.ID)
	return i, nil
}
