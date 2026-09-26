package services

import (
	"context"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/personas/dtos/requests"
	"engflex-api/internal/utils"
)

// PersonaService owns the persona catalog.
type PersonaService struct {
	personas repositories.PersonaRepository
}

// NewPersonaService builds the service over the repository interface.
func NewPersonaService(personas repositories.PersonaRepository) *PersonaService {
	return &PersonaService{personas: personas}
}

// List pages the persona catalog.
func (s *PersonaService) List(ctx context.Context, req requests.ListPersonas) ([]*models.Persona, int64, error) {
	page, pageSize := req.Page, req.PageSize
	if page < 1 {
		page = common.DefaultPage
	}
	if pageSize < 1 {
		pageSize = common.DefaultPageSize
	}
	offset := utils.Offset(page, pageSize)

	items, err := s.personas.List(ctx, pageSize, offset)
	if err != nil {
		appErr := common.FromDBError(err, "persona")
		logger.Report(ctx, "list personas failed", appErr)
		return nil, 0, appErr
	}
	total, err := s.personas.Count(ctx)
	if err != nil {
		appErr := common.FromDBError(err, "persona")
		logger.Report(ctx, "count personas failed", appErr)
		return nil, 0, appErr
	}
	return items, total, nil
}
