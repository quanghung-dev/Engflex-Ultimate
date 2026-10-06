package services

import (
	"context"
	"log/slog"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/users/dtos/requests"
)

type UserService interface {
	GetByID(ctx context.Context, id string) (*models.User, error)
	UpSert(ctx context.Context, req requests.UpsertUser) (*models.User, error)
}

type userService struct {
	repo repositories.UserRepository
}

func NewUserService(repo repositories.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) GetByID(ctx context.Context, id string) (*models.User, error) {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "user")
		logger.Report(ctx, "failed to get user by id", appErr, "id", id)
		return nil, appErr
	}
	slog.InfoContext(ctx, "user found", "id", user.ID)
	return user, nil
}

func (s *userService) UpSert(ctx context.Context, req requests.UpsertUser) (*models.User, error) {
	user := &models.User{
		ID:        req.ID,
		Email:     req.Email,
		Name:      req.Name,
		AvatarURL: req.AvatarURL,
		UserRole:  models.UserRoleUser,
	}

	err := s.repo.UpSert(ctx, user)
	if err != nil {
		appErr := common.FromDBError(err, "user")
		logger.Report(ctx, "failed to upsert user", appErr, "id", req.ID)
		return nil, appErr
	}
	slog.InfoContext(ctx, "user upserted", "id", user.ID)
	return user, nil
}
