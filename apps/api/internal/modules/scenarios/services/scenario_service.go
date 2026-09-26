package services

import (
	"context"
	"encoding/json"
	"log/slog"

	"gorm.io/datatypes"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	prequests "engflex-api/internal/modules/personas/dtos/requests"
	"engflex-api/internal/modules/scenarios/dtos/requests"
	"engflex-api/internal/utils"
)

// customTopicSlug is the seeded bucket custom scenarios file under, so POST
// /scenarios can satisfy the NOT NULL topic FK without inventing a topic.
const customTopicSlug = "custom"

// ScenarioService owns scenario browsing and custom-scenario creation.
type ScenarioService struct {
	scenarios repositories.ScenarioRepository
}

// NewScenarioService builds the service over the repository interface.
func NewScenarioService(scenarios repositories.ScenarioRepository) *ScenarioService {
	return &ScenarioService{scenarios: scenarios}
}

// List pages built-in scenarios (optionally topic-filtered) or the caller's
// own custom rows, per Scope.
func (s *ScenarioService) List(ctx context.Context, userID string, req requests.ListScenarios) ([]*models.Scenario, int64, error) {
	page, pageSize := req.Page, req.PageSize
	if page < 1 {
		page = common.DefaultPage
	}
	if pageSize < 1 {
		pageSize = common.DefaultPageSize
	}
	offset := utils.Offset(page, pageSize)

	if req.Scope == "custom" {
		items, err := s.scenarios.ListForUser(ctx, userID, pageSize, offset)
		if err != nil {
			appErr := common.FromDBError(err, "scenario")
			logger.Report(ctx, "list custom scenarios failed", appErr, "userID", userID)
			return nil, 0, appErr
		}
		total, err := s.scenarios.CountForUser(ctx, userID)
		if err != nil {
			appErr := common.FromDBError(err, "scenario")
			logger.Report(ctx, "count custom scenarios failed", appErr, "userID", userID)
			return nil, 0, appErr
		}
		return items, total, nil
	}

	items, err := s.scenarios.List(ctx, req.TopicID, pageSize, offset)
	if err != nil {
		appErr := common.FromDBError(err, "scenario")
		logger.Report(ctx, "list scenarios failed", appErr)
		return nil, 0, appErr
	}
	total, err := s.scenarios.Count(ctx, req.TopicID)
	if err != nil {
		appErr := common.FromDBError(err, "scenario")
		logger.Report(ctx, "count scenarios failed", appErr)
		return nil, 0, appErr
	}
	return items, total, nil
}

// Create stores a learner-authored scenario under the seeded custom topic
// and returns it with a real UUID, so starting it needs no fake id.
func (s *ScenarioService) Create(ctx context.Context, userID string, req prequests.CreateCustomScenario) (*models.Scenario, error) {
	if req.DurationMin > req.DurationMax {
		return nil, common.BadRequest("durationMin must not exceed durationMax")
	}
	topic, err := s.scenarios.GetTopicBySlug(ctx, customTopicSlug)
	if err != nil {
		appErr := common.FromDBError(err, "scenario topic")
		logger.Report(ctx, "custom topic lookup failed", appErr)
		return nil, appErr
	}
	details, err := json.Marshal(map[string]int{
		"duration_min": req.DurationMin,
		"duration_max": req.DurationMax,
	})
	if err != nil {
		logger.Report(ctx, "marshal scenario details failed", common.Internal(), "userID", userID)
		return nil, common.Internal()
	}
	m := &models.Scenario{
		TopicID:   topic.ID,
		Title:     req.Title,
		Objective: req.Objective,
		CEFRLevel: req.Difficulty,
		UserID:    &userID,
	}
	m.Details = datatypes.JSON(details)
	if err := s.scenarios.Create(ctx, m); err != nil {
		appErr := common.FromDBError(err, "scenario")
		logger.Report(ctx, "create scenario failed", appErr, "userID", userID)
		return nil, appErr
	}
	slog.InfoContext(ctx, "scenario created", "scenarioID", m.ID, "userID", userID)
	return m, nil
}
