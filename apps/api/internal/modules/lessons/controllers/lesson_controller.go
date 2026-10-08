package controllers

import (
	"github.com/gin-gonic/gin"

	"engflex-api/config"
	"engflex-api/internal/common"
	"engflex-api/internal/modules/lessons/dtos/requests"
	"engflex-api/internal/modules/lessons/dtos/responses"
	"engflex-api/internal/modules/lessons/services"
	"engflex-api/internal/utils"
)

// LessonController exposes unit browsing.
type LessonController struct {
	lessons services.LessonService
	media   config.MediaConfig
}

// NewLessonController wires the controller to the service.
func NewLessonController(lessons services.LessonService, media config.MediaConfig) *LessonController {
	return &LessonController{lessons: lessons, media: media}
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
			ApplyPayload(&dto.Activities[i], m.Activities[i], h.media)
		}
	}
	common.OK(c, "lesson", dto)
}

// GetBySlug godoc
// @Summary      Get one unit by slug with ordered activities
// @Tags         lessons
// @Security     BearerAuth
// @Produce      json
// @Param        slug path string true "lesson slug"
// @Success      200 {object} common.ApiResponse{data=responses.LessonDetail}
// @Router       /lessons/by-slug/{slug} [get]
func (h *LessonController) GetBySlug(c *gin.Context) {
	m, err := h.lessons.GetDetailBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.LessonDetail
	_ = utils.Map(&dto, m)
	for i := range dto.Activities {
		if i < len(m.Activities) {
			ApplyPayload(&dto.Activities[i], m.Activities[i], h.media)
		}
	}
	common.OK(c, "lesson", dto)
}
