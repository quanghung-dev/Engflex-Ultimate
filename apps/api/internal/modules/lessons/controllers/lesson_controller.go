package controllers

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/common"
	"engflex-api/internal/modules/lessons/dtos/requests"
	"engflex-api/internal/modules/lessons/dtos/responses"
	"engflex-api/internal/modules/lessons/services"
	"engflex-api/internal/utils"
)

// LessonController exposes unit browsing.
type LessonController struct {
	lessons services.LessonService
}

// NewLessonController wires the controller to the service.
func NewLessonController(lessons services.LessonService) *LessonController {
	return &LessonController{lessons: lessons}
}

// List godoc
// @Summary      List units grouped by CEFR section (whole path, unpaginated)
// @Tags         lessons
// @Security     BearerAuth
// @Produce      json
// @Param        level query string false "CEFR filter"
// @Success      200 {object} common.ApiResponse{data=[]responses.UnitSection}
// @Router       /lessons [get]
func (h *LessonController) List(c *gin.Context) {
	var req requests.ListLessons
	if err := c.ShouldBindQuery(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	// Section-first read: the repository returns sections with units
	// attached, mirroring the DTO shape, so this is one MapSlice.
	secs, err := h.lessons.ListSections(c.Request.Context(), req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dtos []responses.UnitSection
	_ = utils.MapSlice(&dtos, secs)
	common.OK(c, "lessons", dtos)
}

// GetByID godoc
// @Summary      Get one unit with ordered activities
// @Tags         lessons
// @Security     BearerAuth
// @Produce      json
// @Param        id path string true "lesson id"
// @Success      200 {object} common.ApiResponse{data=responses.LessonDetail}
// @Router       /lessons/{id} [get]
func (h *LessonController) GetByID(c *gin.Context) {
	m, err := h.lessons.GetDetail(c.Request.Context(), c.Param("id"))
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.LessonDetail
	_ = utils.Map(&dto, m)
	for i := range dto.Activities {
		if i < len(m.Activities) {
			dto.Activities[i].SplitPayload(m.Activities[i].Type, m.Activities[i].Config)
		}
	}
	common.OK(c, "lesson", dto)
}
