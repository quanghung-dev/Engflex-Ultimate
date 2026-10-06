package controllers

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/common"
	"engflex-api/internal/modules/lessons/dtos/responses"
	"engflex-api/internal/modules/lessons/services"
	"engflex-api/internal/utils"
)

// LessonCategoryController exposes the lesson taxonomy.
type LessonCategoryController struct {
	categories services.LessonCategoryService
}

// NewLessonCategoryController wires the controller to the service.
func NewLessonCategoryController(categories services.LessonCategoryService) *LessonCategoryController {
	return &LessonCategoryController{categories: categories}
}

// List godoc
// @Summary      List lesson categories
// @Tags         lesson-categories
// @Security     BearerAuth
// @Produce      json
// @Success      200 {object} common.ApiResponse{data=[]responses.Category}
// @Router       /lesson-categories [get]
func (h *LessonCategoryController) List(c *gin.Context) {
	page, pageSize := utils.ParsePagination(c)
	items, total, err := h.categories.List(c.Request.Context(), pageSize, utils.Offset(page, pageSize))
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dtos []responses.Category
	_ = utils.MapSlice(&dtos, items)
	common.Paginated(c, "lesson categories", dtos, page, pageSize, total)
}

// GetByID godoc
// @Summary      Get one lesson category
// @Tags         lesson-categories
// @Security     BearerAuth
// @Produce      json
// @Param        id path string true "category id"
// @Success      200 {object} common.ApiResponse{data=responses.Category}
// @Router       /lesson-categories/{id} [get]
func (h *LessonCategoryController) GetByID(c *gin.Context) {
	m, err := h.categories.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.Category
	_ = utils.Map(&dto, m)
	common.OK(c, "lesson category", dto)
}
