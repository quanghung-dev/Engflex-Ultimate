package services

import (
	"context"
	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/categories/dtos/requests"
	"log/slog"
)

type CategoryService interface {
	List(ctx context.Context, limit, offset int) ([]*models.Category, int64, error)
	GetByID(ctx context.Context, id string) (*models.Category, error)
	Create(ctx context.Context, req requests.CreateCategory) (*models.Category, error)
	Update(ctx context.Context, id string, req requests.UpdateCategory) (*models.Category, error)
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int64, error)
}

type categoryService struct {
	repo repositories.CategoryRepository
}

func NewCategoryService(repo repositories.CategoryRepository) CategoryService {
	return &categoryService{repo: repo}
}

func (s *categoryService) Create(ctx context.Context, req requests.CreateCategory) (*models.Category, error) {
	category := &models.Category{
		Name: req.Name,
	}
	err := s.repo.Create(ctx, category)
	if err != nil {
		appErr := common.FromDBError(err, "category")
		logger.Report(ctx, "failed to create category", appErr, "name", req.Name)
		return nil, appErr
	}
	slog.InfoContext(ctx, "category created", "category_id", category.ID)
	return category, nil
}

func (s *categoryService) Update(ctx context.Context, id string, req requests.UpdateCategory) (*models.Category, error) {
	category, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "category")
		logger.Report(ctx, "failed to find category for update", appErr, "id", id)
		return nil, appErr
	}
	category.Name = req.Name
	if err := s.repo.Update(ctx, category); err != nil {
		appErr := common.FromDBError(err, "category")
		logger.Report(ctx, "failed to update category", appErr, "id", id)
		return nil, appErr
	}
	slog.InfoContext(ctx, "category updated", "category_id", category.ID)
	return category, nil
}

func (s *categoryService) Delete(ctx context.Context, id string) error {
	err := s.repo.Delete(ctx, id)

	if err != nil {
		appErr := common.FromDBError(err, "category")
		logger.Report(ctx, "failed to delete category", appErr, "id", id)
		return appErr
	}
	slog.InfoContext(ctx, "category deleted", "id", id)
	return nil
}

func (s *categoryService) GetByID(ctx context.Context, id string) (*models.Category, error) {
	category, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "category")
		logger.Report(ctx, "failed to get category", appErr, "id", id)
		return nil, appErr
	}
	slog.InfoContext(ctx, "category found", "category_id", category.ID)
	return category, nil
}

func (s *categoryService) Count(ctx context.Context) (int64, error) {
	count, err := s.repo.Count(ctx)
	if err != nil {
		appErr := common.FromDBError(err, "category")
		logger.Report(ctx, "failed to count category", appErr)
		return 0, appErr
	}
	slog.InfoContext(ctx, "category count", "count", count)
	return count, nil
}

func (s *categoryService) List(ctx context.Context, limit, offset int) ([]*models.Category, int64, error) {
	categories, err := s.repo.List(ctx, limit, offset)
	if err != nil {
		appErr := common.FromDBError(err, "category")
		logger.Report(ctx, "failed to list categories", appErr)
		return nil, 0, appErr
	}
	total, err := s.repo.Count(ctx)
	if err != nil {
		appErr := common.FromDBError(err, "category")
		logger.Report(ctx, "failed to count categories", appErr)
		return nil, 0, appErr
	}
	slog.InfoContext(ctx, "categories listed", "count", len(categories), "total", total)
	return categories, total, nil
}
