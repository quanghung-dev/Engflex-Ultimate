package services

import (
	"context"
	"log/slog"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/vocabulary/dtos/requests"
)

type VocabularyCategoryService interface {
	List(ctx context.Context, limit int, offset int) ([]*models.VocabularyCategory, int64, error)
	GetByID(ctx context.Context, id string) (*models.VocabularyCategory, error)
	Create(ctx context.Context, req requests.CreateVocabularyCategory) (*models.VocabularyCategory, error)
	Update(ctx context.Context, id string, req requests.UpdateVocabularyCategory) (*models.VocabularyCategory, error)
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int64, error)
}

type vocabularyCategoryService struct {
	repo repositories.VocabularyCategoryRepository
}

func NewVocabularyCategoryService(repo repositories.VocabularyCategoryRepository) VocabularyCategoryService {
	return &vocabularyCategoryService{repo: repo}
}

func (s *vocabularyCategoryService) List(ctx context.Context, limit int, offset int) ([]*models.VocabularyCategory, int64, error) {
	categories, err := s.repo.List(ctx, limit, offset)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary category")
		logger.Report(ctx, "failed to list vocabulary categories", appErr)
		return nil, 0, appErr
	}
	total, err := s.repo.Count(ctx)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary category")
		logger.Report(ctx, "failed to count vocabulary categories", appErr)
		return nil, 0, appErr
	}
	slog.InfoContext(ctx, "vocabulary categories listed", "count", len(categories), "total", total)
	return categories, total, nil
}

func (s *vocabularyCategoryService) GetByID(ctx context.Context, id string) (*models.VocabularyCategory, error) {
	category, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary category")
		logger.Report(ctx, "failed to get vocabulary category", appErr, "id", id)
		return nil, appErr
	}
	slog.InfoContext(ctx, "vocabulary category found", "id", category.ID)
	return category, nil
}

func (s *vocabularyCategoryService) Create(ctx context.Context, req requests.CreateVocabularyCategory) (*models.VocabularyCategory, error) {
	category := &models.VocabularyCategory{
		Name:        req.Name,
		Description: req.Description,
	}
	err := s.repo.Create(ctx, category)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary category")
		logger.Report(ctx, "failed to create vocabulary category", appErr)
		return nil, appErr
	}
	slog.InfoContext(ctx, "vocabulary category created", "id", category.ID)
	return category, nil
}

func (s *vocabularyCategoryService) Update(ctx context.Context, id string, req requests.UpdateVocabularyCategory) (*models.VocabularyCategory, error) {
	category, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary category")
		logger.Report(ctx, "failed to get vocabulary category for update", appErr, "id", id)
		return nil, appErr
	}
	if req.Name != nil {
		category.Name = *req.Name
	}
	if req.Description != nil {
		category.Description = *req.Description
	}
	if err := s.repo.Update(ctx, category); err != nil {
		appErr := common.FromDBError(err, "vocabulary category")
		logger.Report(ctx, "failed to update vocabulary category", appErr, "id", id)
		return nil, appErr
	}
	slog.InfoContext(ctx, "vocabulary category updated", "id", category.ID)
	return category, nil
}

func (s *vocabularyCategoryService) Delete(ctx context.Context, id string) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		appErr := common.FromDBError(err, "vocabulary category")
		logger.Report(ctx, "failed to delete vocabulary category", appErr, "id", id)
		return appErr
	}
	slog.InfoContext(ctx, "vocabulary category deleted", "id", id)
	return nil
}

func (s *vocabularyCategoryService) Count(ctx context.Context) (int64, error) {
	count, err := s.repo.Count(ctx)
	if err != nil {
		appErr := common.FromDBError(err, "vocabulary category")
		logger.Report(ctx, "failed to count vocabulary category", appErr)
		return 0, appErr
	}
	slog.InfoContext(ctx, "vocabulary category count", "count", count)
	return count, nil
}
