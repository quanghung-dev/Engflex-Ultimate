package services

import (
	"context"
	"log/slog"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/vocabulary/dtos/requests"
	"engflex-api/internal/utils"
)

// VocabularyDeckService owns user flashcard decks.
type VocabularyDeckService interface {
	ListByUser(ctx context.Context, userID string, limit, offset int) ([]*models.VocabularyDeck, int64, error)
	GetDetail(ctx context.Context, userID, id string) (*models.VocabularyDeck, error)
	Create(ctx context.Context, userID string, req requests.CreateVocabularyDeck) (*models.VocabularyDeck, error)
	Update(ctx context.Context, userID, id string, req requests.UpdateVocabularyDeck) (*models.VocabularyDeck, error)
	Delete(ctx context.Context, userID, id string) error
}

type vocabularyDeckService struct {
	repo repositories.VocabularyDeckRepository
}

// NewVocabularyDeckService builds the service over the repository interface.
func NewVocabularyDeckService(repo repositories.VocabularyDeckRepository) VocabularyDeckService {
	return &vocabularyDeckService{repo: repo}
}

func (s *vocabularyDeckService) ListByUser(ctx context.Context, userID string, limit, offset int) ([]*models.VocabularyDeck, int64, error) {
	items, err := s.repo.ListByUser(ctx, userID, limit, offset)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary deck")
		logger.Report(ctx, "list vocabulary decks failed", appErr)
		return nil, 0, appErr
	}
	total, err := s.repo.CountByUser(ctx, userID)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary deck")
		logger.Report(ctx, "count vocabulary decks failed", appErr)
		return nil, 0, appErr
	}
	return items, total, nil
}

func (s *vocabularyDeckService) GetDetail(ctx context.Context, userID, id string) (*models.VocabularyDeck, error) {
	m, err := s.repo.GetDetail(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary deck")
		logger.Report(ctx, "get vocabulary deck detail failed", appErr, "id", id)
		return nil, appErr
	}
	if m.UserID == nil || *m.UserID != userID {
		return nil, common.Forbidden("not your deck")
	}
	return m, nil
}

func (s *vocabularyDeckService) Create(ctx context.Context, userID string, req requests.CreateVocabularyDeck) (*models.VocabularyDeck, error) {
	d := &models.VocabularyDeck{}
	if err := utils.Map(d, req); err != nil {
		logger.Report(ctx, "map create vocabulary deck failed", err)
		return nil, common.Internal()
	}
	uid := userID
	d.UserID = &uid
	if err := s.repo.Create(ctx, d); err != nil {
		appErr := common.FromDBError(err, "vocabulary deck")
		logger.Report(ctx, "create vocabulary deck failed", appErr)
		return nil, appErr
	}
	slog.InfoContext(ctx, "vocabulary deck created", "id", d.ID)
	return d, nil
}

func (s *vocabularyDeckService) Update(ctx context.Context, userID, id string, req requests.UpdateVocabularyDeck) (*models.VocabularyDeck, error) {
	d, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary deck")
		logger.Report(ctx, "get vocabulary deck for update failed", appErr, "id", id)
		return nil, appErr
	}
	if d.UserID == nil || *d.UserID != userID {
		return nil, common.Forbidden("not your deck")
	}
	// Partial update: UpdateVocabularyDeck fields are all pointers and copier
	// copies nil *string over *string (verified live), so only non-nil fields
	// are assigned — a blanket utils.Map here would detach CategoryID whenever
	// the body omits it.
	if req.CategoryID != nil {
		d.CategoryID = req.CategoryID
	}
	if req.Name != nil {
		d.Name = *req.Name
	}
	if req.Description != nil {
		d.Description = *req.Description
	}
	if req.ThumbnailURL != nil {
		d.ThumbnailURL = *req.ThumbnailURL
	}
	if req.Level != nil {
		d.Level = *req.Level
	}
	if err := s.repo.Update(ctx, d); err != nil {
		appErr := common.FromDBError(err, "vocabulary deck")
		logger.Report(ctx, "update vocabulary deck failed", appErr, "id", id)
		return nil, appErr
	}
	return d, nil
}

func (s *vocabularyDeckService) Delete(ctx context.Context, userID, id string) error {
	d, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary deck")
		logger.Report(ctx, "get vocabulary deck for delete failed", appErr, "id", id)
		return appErr
	}
	if d.UserID == nil || *d.UserID != userID {
		return common.Forbidden("not your deck")
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		appErr := common.FromDBError(err, "vocabulary deck")
		logger.Report(ctx, "delete vocabulary deck failed", appErr, "id", id)
		return appErr
	}
	return nil
}
