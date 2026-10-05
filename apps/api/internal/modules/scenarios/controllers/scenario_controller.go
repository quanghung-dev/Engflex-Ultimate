package controllers

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"engflex-api/internal/common"
	"engflex-api/internal/modules/personas/dtos/responses"
	"engflex-api/internal/modules/scenarios/dtos/requests"
	"engflex-api/internal/modules/scenarios/services"
	"engflex-api/internal/server/middleware"
	"engflex-api/internal/utils"
)

// ScenarioController exposes scenario browsing.
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
	_ = utils.MapSlice(&dtos, items)
	common.Paginated(c, "scenarios", dtos, page, pageSize, total)
}

// TopicsWithPreview godoc
// @Summary      List scenario topics with top-k previews
// @Tags         scenario-topics
// @Security     BearerAuth
// @Produce      json
// @Param        previewK query int false "preview cards per topic (default 3, max 6)"
// @Param        difficulty query string false "B1+, B2 or C1 filter"
// @Param        search query string false "title/objective substring"
// @Success      200 {object} common.ApiResponse{data=[]responses.TopicWithPreviews}
// @Router       /scenario-topics [get]
func (h *ScenarioController) TopicsWithPreview(c *gin.Context) {
	previewK := 3
	if raw := c.Query("previewK"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil {
			previewK = n
		}
	}
	var difficulty *string
	if d := c.Query("difficulty"); d != "" {
		switch d {
		case "B1+", "B2", "C1":
			difficulty = &d
		default:
			common.Fail(c, common.BadRequest("difficulty must be one of B1+, B2, C1"))
			return
		}
	}
	search := strings.TrimSpace(c.Query("search"))
	topics, err := h.service.ListTopicsWithPreview(c.Request.Context(), previewK, difficulty, search)
	if err != nil {
		common.Fail(c, err)
		return
	}
	dtos := make([]responses.TopicWithPreviews, 0, len(topics))
	for _, tp := range topics {
		scens := make([]responses.Scenario, 0, len(tp.Scenarios))
		_ = utils.MapSlice(&scens, tp.Scenarios)
		dtos = append(dtos, responses.TopicWithPreviews{
			ID: tp.Topic.ID, Slug: tp.Topic.Slug, Name: tp.Topic.Name,
			Position: tp.Topic.Position, Scenarios: scens,
		})
	}
	// Plain array, NOT Paginated: the web reads it with api<T>.
	common.OK(c, "scenario topics", dtos)
}

// GetByID godoc
// @Summary      Get one scenario with detail content
// @Tags         scenarios
// @Security     BearerAuth
// @Produce      json
// @Param        id path string true "scenario id"
// @Success      200 {object} common.ApiResponse{data=responses.Scenario}
// @Router       /scenarios/{id} [get]
func (h *ScenarioController) GetByID(c *gin.Context) {
	m, err := h.service.GetDetail(c.Request.Context(), c.Param("id"))
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.Scenario
	_ = utils.Map(&dto, m)
	common.OK(c, "scenario", dto)
}
