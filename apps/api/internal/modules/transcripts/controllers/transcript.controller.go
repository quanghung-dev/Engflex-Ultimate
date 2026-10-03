package controllers

import (
	"engflex-api/internal/common"
	"engflex-api/internal/modules/transcripts/dtos/requests"
	"engflex-api/internal/modules/transcripts/dtos/responses"
	"engflex-api/internal/modules/transcripts/services"
	"engflex-api/internal/utils"

	"github.com/gin-gonic/gin"
)

type TranscriptController struct {
	service services.TranscriptService
}

func NewTranscriptController(service services.TranscriptService) *TranscriptController {
	return &TranscriptController{service: service}
}

// Create godoc
//
//	@Summary		Create transcript
//	@Description	Create a new transcript
//	@Tags			Transcripts
//	@Accept			json
//	@Produce		json
//	@Param			request	body		requests.CreateTranscript								true	"Transcript payload"
//	@Success		201		{object}	common.ApiResponse{data=responses.TranscriptResponse}	"Transcript created successfully"
//	@Failure		400		{object}	common.ApiResponse										"Invalid request body"
//	@Failure		409		{object}	common.ApiResponse										"Transcript conflict"
//	@Failure		500		{object}	common.ApiResponse										"Internal server error"
//	@Router			/transcripts [post]
func (h *TranscriptController) Create(c *gin.Context) {
	var req requests.CreateTranscript
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	m, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.TranscriptResponse
	_ = utils.Map(&dto, m)
	common.Created(c, "transcript created", dto)
}

// Update godoc
//
//	@Summary		Update transcript
//	@Description	Update an existing transcript by its ID
//	@Tags			Transcripts
//	@Accept			json
//	@Produce		json
//	@Param			id		path		string													true	"Transcript ID"
//	@Param			request	body		requests.UpdateTranscript								true	"Transcript payload"
//	@Success		200		{object}	common.ApiResponse{data=responses.TranscriptResponse}	"Transcript updated successfully"
//	@Failure		400		{object}	common.ApiResponse										"Invalid ID or payload"
//	@Failure		404		{object}	common.ApiResponse										"Transcript not found"
//	@Failure		500		{object}	common.ApiResponse										"Internal server error"
//	@Router			/transcripts/{id} [put]
func (h *TranscriptController) Update(c *gin.Context) {
	id := c.Param("id")
	var req requests.UpdateTranscript
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	m, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.TranscriptResponse
	_ = utils.Map(&dto, m)
	common.OK(c, "transcript updated", dto)
}

// Delete godoc
//
//	@Summary		Delete transcript
//	@Description	Delete a transcript by its ID
//	@Tags			Transcripts
//	@Produce		json
//	@Param			id	path		string				true	"Transcript ID"
//	@Success		200	{object}	common.ApiResponse	"Transcript deleted successfully"
//	@Failure		400	{object}	common.ApiResponse	"Invalid ID"
//	@Failure		404	{object}	common.ApiResponse	"Transcript not found"
//	@Failure		500	{object}	common.ApiResponse	"Internal server error"
//	@Router			/transcripts/{id} [delete]
func (h *TranscriptController) Delete(c *gin.Context) {
	id := c.Param("id")
	err := h.service.Delete(c.Request.Context(), id)
	if err != nil {
		common.Fail(c, err)
		return
	}
	common.OK(c, "transcript deleted successfully", nil)
}

// GetByID godoc
//
//	@Summary		Get transcript by ID
//	@Description	Retrieve details of a transcript by its ID
//	@Tags			Transcripts
//	@Produce		json
//	@Param			id	path		string													true	"Transcript ID"
//	@Success		200	{object}	common.ApiResponse{data=responses.TranscriptResponse}	"Transcript retrieved successfully"
//	@Failure		400	{object}	common.ApiResponse										"Invalid ID"
//	@Failure		404	{object}	common.ApiResponse										"Transcript not found"
//	@Failure		500	{object}	common.ApiResponse										"Internal server error"
//	@Router			/transcripts/{id} [get]
func (h *TranscriptController) GetByID(c *gin.Context) {
	id := c.Param("id")
	m, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.TranscriptResponse
	_ = utils.Map(&dto, m)
	common.OK(c, "transcript found", dto)
}

// GetByLessonID godoc
//
//	@Summary		Get transcripts by lesson ID
//	@Description	Retrieve list of transcripts belonging to a lesson
//	@Tags			Transcripts
//	@Produce		json
//	@Param			lesson_id	path		string													true	"Lesson ID"
//	@Success		200			{object}	common.ApiResponse{data=[]responses.TranscriptResponse}	"Transcripts retrieved successfully"
//	@Failure		400			{object}	common.ApiResponse										"Invalid lesson ID"
//	@Failure		500			{object}	common.ApiResponse										"Internal server error"
//	@Router			/transcripts/lesson/{lesson_id} [get]
func (h *TranscriptController) GetByLessonID(c *gin.Context) {
	lessonID := c.Param("lesson_id")
	list, err := h.service.GetByLessonID(c.Request.Context(), lessonID)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dtos []responses.TranscriptResponse
	_ = utils.MapSlice(&dtos, list)
	common.OK(c, "transcripts retrieved", dtos)
}

// List godoc
//
//	@Summary		List transcripts
//	@Description	Get paginated list of transcripts
//	@Tags			Transcripts
//	@Produce		json
//	@Param			page		query		int														false	"Page number (1-based)"	default(1)
//	@Param			pageSize	query		int														false	"Page size"				default(20)
//	@Success		200			{object}	common.ApiResponse{data=[]responses.TranscriptResponse}	"Transcripts retrieved successfully"
//	@Failure		500			{object}	common.ApiResponse										"Internal server error"
//	@Router			/transcripts [get]
func (h *TranscriptController) List(c *gin.Context) {
	page, pageSize := utils.ParsePagination(c)
	offset := utils.Offset(page, pageSize)
	list, total, err := h.service.List(c.Request.Context(), pageSize, offset)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dtos []responses.TranscriptResponse
	_ = utils.MapSlice(&dtos, list)
	common.Paginated(c, "transcripts retrieved", dtos, page, pageSize, total)
}
