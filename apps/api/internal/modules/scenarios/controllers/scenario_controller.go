package controllers

import (
	"encoding/json"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"

	"engflex-api/internal/common"
	prequests "engflex-api/internal/modules/personas/dtos/requests"
	"engflex-api/internal/modules/personas/dtos/responses"
	"engflex-api/internal/modules/scenarios/dtos/requests"
	"engflex-api/internal/modules/scenarios/services"
	"engflex-api/internal/server/middleware"
	"engflex-api/internal/utils"
)

// ScenarioController exposes scenario browsing and custom creation.
type ScenarioController struct {
	service *services.ScenarioService
}

// NewScenarioController wires the controller to the service.
func NewScenarioController(service *services.ScenarioService) *ScenarioController {
	return &ScenarioController{service: service}
}

// List godoc
// @Summary      List scenarios
// @Tags         scenarios
// @Security     BearerAuth
// @Produce      json
// @Param        page query int false "page"
// @Param        pageSize query int false "page size"
// @Param        topicId query string false "topic filter"
// @Param        scope query string false "all or custom"
// @Success      200 {object} common.ApiResponse{data=[]responses.Scenario}
// @Router       /scenarios [get]
func (h *ScenarioController) List(c *gin.Context) {
	page, pageSize := utils.ParsePagination(c)
	var req requests.ListScenarios
	if err := c.ShouldBindQuery(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	req.Page, req.PageSize = page, pageSize
	items, total, err := h.service.List(c.Request.Context(), middleware.UserID(c), req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	dtos := make([]responses.Scenario, 0, len(items))
	for _, m := range items {
		var dto responses.Scenario
		_ = utils.Map(&dto, m)
		dto.Persona = nil // list view carries no persona join; the room resolves it
		dto.DurationMin, dto.DurationMax = scenarioDurations(m.Details)
		dto.IsCustom = m.UserID != nil
		dtos = append(dtos, dto)
	}
	common.Paginated(c, "scenarios", dtos, page, pageSize, total)
}

// scenarioDurations reads durations out of the details jsonb. A missing or
// malformed details object yields zeros rather than failing the list.
func scenarioDurations(raw datatypes.JSON) (int, int) {
	var details struct {
		DurationMin int `json:"duration_min"`
		DurationMax int `json:"duration_max"`
	}
	if err := json.Unmarshal(raw, &details); err != nil {
		return 0, 0
	}
	return details.DurationMin, details.DurationMax
}

// Create godoc
// @Summary      Create a custom scenario
// @Tags         scenarios
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body body requests.CreateCustomScenario true "custom scenario"
// @Success      201 {object} common.ApiResponse{data=responses.Scenario}
// @Failure      400 {object} common.ApiResponse
// @Router       /scenarios [post]
func (h *ScenarioController) Create(c *gin.Context) {
	var req prequests.CreateCustomScenario
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	m, err := h.service.Create(c.Request.Context(), middleware.UserID(c), req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.Scenario
	_ = utils.Map(&dto, m)
	dto.DurationMin, dto.DurationMax = req.DurationMin, req.DurationMax
	dto.IsCustom = true
	common.Created(c, "scenario created", dto)
}
