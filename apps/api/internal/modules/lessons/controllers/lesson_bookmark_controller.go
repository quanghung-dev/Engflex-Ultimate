package controllers

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/common"
	"engflex-api/internal/modules/lessons/dtos/requests"
	"engflex-api/internal/modules/lessons/dtos/responses"
	"engflex-api/internal/modules/lessons/services"
	"engflex-api/internal/server/middleware"
	"engflex-api/internal/utils"
)

// LessonBookmarkController exposes the caller's saved lessons.
type LessonBookmarkController struct {
	bookmarks services.LessonBookmarkService
}

// NewLessonBookmarkController wires the controller to the service.
func NewLessonBookmarkController(bookmarks services.LessonBookmarkService) *LessonBookmarkController {
	return &LessonBookmarkController{bookmarks: bookmarks}
}

// List godoc
// @Summary      List my lesson bookmarks
// @Tags         lesson-bookmarks
// @Security     BearerAuth
// @Produce      json
// @Success      200 {object} common.ApiResponse{data=[]responses.Bookmark}
// @Router       /lesson-bookmarks [get]
func (h *LessonBookmarkController) List(c *gin.Context) {
	items, err := h.bookmarks.ListByUser(c.Request.Context(), middleware.UserID(c))
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dtos []responses.Bookmark
	_ = utils.MapSlice(&dtos, items)
	common.OK(c, "lesson bookmarks", dtos)
}

// Save godoc
// @Summary      Bookmark a lesson
// @Tags         lesson-bookmarks
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request body requests.SaveBookmark true "lesson id"
// @Success      201 {object} common.ApiResponse{data=responses.Bookmark}
// @Router       /lesson-bookmarks [post]
func (h *LessonBookmarkController) Save(c *gin.Context) {
	var req requests.SaveBookmark
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	b, err := h.bookmarks.Save(c.Request.Context(), middleware.UserID(c), req.LessonID)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.Bookmark
	_ = utils.Map(&dto, b)
	common.Created(c, "lesson bookmarked", dto)
}

// Unsave godoc
// @Summary      Remove a lesson bookmark
// @Tags         lesson-bookmarks
// @Security     BearerAuth
// @Produce      json
// @Param        lessonId path string true "lesson id"
// @Success      200 {object} common.ApiResponse
// @Router       /lesson-bookmarks/{lessonId} [delete]
func (h *LessonBookmarkController) Unsave(c *gin.Context) {
	if err := h.bookmarks.Unsave(c.Request.Context(), middleware.UserID(c), c.Param("lessonId")); err != nil {
		common.Fail(c, err)
		return
	}
	common.OK(c, "lesson unbookmarked", nil)
}
