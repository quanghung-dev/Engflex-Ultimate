package controllers

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/common"
	"engflex-api/internal/modules/lessons/dtos/requests"
	"engflex-api/internal/modules/lessons/dtos/responses"
	"engflex-api/internal/modules/lessons/services"
	"engflex-api/internal/utils"
)

// LessonActivityController exposes ordered lesson parts.
type LessonActivityController struct {
	activities services.LessonActivityService
}

// NewLessonActivityController wires the controller to the service.
func NewLessonActivityController(activities services.LessonActivityService) *LessonActivityController {
	return &LessonActivityController{activities: activities}
}

// List godoc
// @Summary      List activities of one lesson
// @Tags         lesson-activities
// @Security     BearerAuth
// @Produce      json
// @Param        lessonId query string true "lesson id"
// @Success      200 {object} common.ApiResponse{data=[]responses.Activity}
// @Router       /lesson-activities [get]
func (h *LessonActivityController) List(c *gin.Context) {
	var req requests.ListActivities
	if err := c.ShouldBindQuery(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	items, err := h.activities.ListByLesson(c.Request.Context(), req.LessonID)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dtos []responses.Activity
	_ = utils.MapSlice(&dtos, items)
	for i := range dtos {
		if i < len(items) {
			dtos[i].SplitPayload(items[i].Type, items[i].Config)
		}
	}
	common.OK(c, "lesson activities", dtos)
}

// GetByID godoc
// @Summary      Get one lesson activity
// @Tags         lesson-activities
// @Security     BearerAuth
// @Produce      json
// @Param        id path string true "activity id"
// @Success      200 {object} common.ApiResponse{data=responses.Activity}
// @Router       /lesson-activities/{id} [get]
func (h *LessonActivityController) GetByID(c *gin.Context) {
	m, err := h.activities.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.Activity
	_ = utils.Map(&dto, m)
	dto.SplitPayload(m.Type, m.Config)
	common.OK(c, "lesson activity", dto)
}
