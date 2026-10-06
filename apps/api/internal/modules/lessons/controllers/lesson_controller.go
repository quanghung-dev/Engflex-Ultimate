package controllers

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/common"
	"engflex-api/internal/modules/lessons/dtos/requests"
	"engflex-api/internal/modules/lessons/dtos/responses"
	"engflex-api/internal/modules/lessons/services"
	"engflex-api/internal/utils"
)

// LessonController exposes lesson browsing.
type LessonController struct {
	lessons services.LessonService
}

// NewLessonController wires the controller to the service.
func NewLessonController(lessons services.LessonService) *LessonController {
	return &LessonController{lessons: lessons}
}

// List godoc
// @Summary      List lessons
// @Tags         lessons
// @Security     BearerAuth
// @Produce      json
// @Param        page query int false "page"
// @Param        pageSize query int false "page size"
// @Param        categorySlug query string false "category filter"
// @Success      200 {object} common.ApiResponse{data=[]responses.Lesson}
// @Router       /lessons [get]
func (h *LessonController) List(c *gin.Context) {
	var req requests.ListLessons
	if err := c.ShouldBindQuery(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	page, pageSize := utils.ParsePagination(c)
	items, total, err := h.lessons.List(c.Request.Context(), req, pageSize, utils.Offset(page, pageSize))
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dtos []responses.Lesson
	_ = utils.MapSlice(&dtos, items)
	common.Paginated(c, "lessons", dtos, page, pageSize, total)
}

// GetByID godoc
// @Summary      Get one lesson with category and activities
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
