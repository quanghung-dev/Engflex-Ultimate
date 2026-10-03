package controllers

import (
	"engflex-api/internal/common"
	"engflex-api/internal/modules/lessons/dtos/requests"
	"engflex-api/internal/modules/lessons/dtos/responses"
	"engflex-api/internal/modules/lessons/services"
	"engflex-api/internal/utils"

	"github.com/gin-gonic/gin"
)

type LessonController struct {
	service services.LessonService
}

func NewLessonController(service services.LessonService) *LessonController {
	return &LessonController{service: service}
}

// Create godoc
//
//	@Summary		Create lesson
//	@Description	Create a new lesson
//	@Tags			Lessons
//	@Accept			json
//	@Produce		json
//	@Param			request	body		requests.CreateLesson								true	"Lesson payload"
//	@Success		201		{object}	common.ApiResponse{data=responses.LessonResponse}	"Lesson created successfully"
//	@Failure		400		{object}	common.ApiResponse									"Invalid request body"
//	@Failure		409		{object}	common.ApiResponse									"Lesson conflict"
//	@Failure		500		{object}	common.ApiResponse									"Internal server error"
//	@Router			/lessons [post]
func (h *LessonController) Create(c *gin.Context) {
	var req requests.CreateLesson
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	m, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.LessonResponse
	_ = utils.Map(&dto, m)
	common.Created(c, "lesson created", dto)
}

// Update godoc
//
//	@Summary		Update lesson
//	@Description	Update an existing lesson by its ID
//	@Tags			Lessons
//	@Accept			json
//	@Produce		json
//	@Param			id		path		string												true	"Lesson ID"
//	@Param			request	body		requests.UpdateLesson								true	"Lesson payload"
//	@Success		200		{object}	common.ApiResponse{data=responses.LessonResponse}	"Lesson updated successfully"
//	@Failure		400		{object}	common.ApiResponse									"Invalid ID or payload"
//	@Failure		404		{object}	common.ApiResponse									"Lesson not found"
//	@Failure		500		{object}	common.ApiResponse									"Internal server error"
//	@Router			/lessons/{id} [put]
func (h *LessonController) Update(c *gin.Context) {
	id := c.Param("id")
	var req requests.UpdateLesson
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	m, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.LessonResponse
	_ = utils.Map(&dto, m)
	common.OK(c, "lesson updated", dto)
}

// Delete godoc
//
//	@Summary		Delete lesson
//	@Description	Delete a lesson by its ID
//	@Tags			Lessons
//	@Produce		json
//	@Param			id	path		string				true	"Lesson ID"
//	@Success		200	{object}	common.ApiResponse	"Lesson deleted successfully"
//	@Failure		400	{object}	common.ApiResponse	"Invalid ID"
//	@Failure		404	{object}	common.ApiResponse	"Lesson not found"
//	@Failure		500	{object}	common.ApiResponse	"Internal server error"
//	@Router			/lessons/{id} [delete]
func (h *LessonController) Delete(c *gin.Context) {
	id := c.Param("id")
	err := h.service.Delete(c.Request.Context(), id)
	if err != nil {
		common.Fail(c, err)
		return
	}
	common.OK(c, "lesson deleted successfully", nil)
}

// GetByID godoc
//
//	@Summary		Get lesson by ID
//	@Description	Retrieve details of a lesson by its ID
//	@Tags			Lessons
//	@Produce		json
//	@Param			id	path		string												true	"Lesson ID"
//	@Success		200	{object}	common.ApiResponse{data=responses.LessonResponse}	"Lesson retrieved successfully"
//	@Failure		400	{object}	common.ApiResponse									"Invalid ID"
//	@Failure		404	{object}	common.ApiResponse									"Lesson not found"
//	@Failure		500	{object}	common.ApiResponse									"Internal server error"
//	@Router			/lessons/{id} [get]
func (h *LessonController) GetByID(c *gin.Context) {
	id := c.Param("id")
	m, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.LessonResponse
	_ = utils.Map(&dto, m)
	common.OK(c, "lesson found", dto)
}

// List godoc
//
//	@Summary		List lessons
//	@Description	Get paginated list of lessons
//	@Tags			Lessons
//	@Produce		json
//	@Param			page		query		int													false	"Page number (1-based)"	default(1)
//	@Param			pageSize	query		int													false	"Page size"				default(20)
//	@Success		200			{object}	common.ApiResponse{data=[]responses.LessonResponse}	"Lessons retrieved successfully"
//	@Failure		500			{object}	common.ApiResponse									"Internal server error"
//	@Router			/lessons [get]
func (h *LessonController) List(c *gin.Context) {
	page, pageSize := utils.ParsePagination(c)
	offset := utils.Offset(page, pageSize)
	lessons, total, err := h.service.List(c.Request.Context(), pageSize, offset)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dtos []responses.LessonResponse
	_ = utils.MapSlice(&dtos, lessons)
	common.Paginated(c, "lessons retrieved", dtos, page, pageSize, total)
}
