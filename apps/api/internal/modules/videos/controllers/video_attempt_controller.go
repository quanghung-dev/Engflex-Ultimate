package controllers

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/modules/videos/dtos/requests"
	"engflex-api/internal/modules/videos/services"
	"engflex-api/internal/server/middleware"
)

type VideoAttemptController struct {
	service services.VideoAttemptService
}

func NewVideoAttemptController(service services.VideoAttemptService) *VideoAttemptController {
	return &VideoAttemptController{service: service}
}

func (h *VideoAttemptController) StartAttempt(c *gin.Context) {
	id := c.Param("id")
	var req requests.StartVideoAttempt
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	attemptType := req.Type
	if attemptType == "" {
		attemptType = enums.AttemptType(c.Query("type"))
	}
	if attemptType == "" {
		attemptType = enums.AttemptType(c.Param("type"))
	}
	userID := middleware.UserID(c)
	m, err := h.service.StartAttempt(c.Request.Context(), userID, id, attemptType, req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	common.Created(c, "attempt started", m)
}

func (h *VideoAttemptController) GetOpenAttempt(c *gin.Context) {
	id := c.Param("id")
	attemptType := enums.AttemptType(c.Query("type"))
	if attemptType == "" {
		attemptType = enums.AttemptType(c.Param("type"))
	}
	if attemptType == "" {
		common.Fail(c, common.BadRequest("type is required"))
		return
	}
	userID := middleware.UserID(c)
	res, err := h.service.GetOpenAttempt(c.Request.Context(), userID, id, attemptType)
	if err != nil {
		common.Fail(c, err)
		return
	}
	common.OK(c, "open attempt found", res)
}

func (h *VideoAttemptController) SaveProgress(c *gin.Context) {
	id := c.Param("id")
	attemptID := c.Param("attemptId")
	var req requests.SaveVideoProgress
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	userID := middleware.UserID(c)
	m, err := h.service.SaveProgress(c.Request.Context(), userID, id, attemptID, req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	common.OK(c, "progress saved", m)
}

func (h *VideoAttemptController) CompleteAttempt(c *gin.Context) {
	id := c.Param("id")
	attemptID := c.Param("attemptId")
	var req requests.CompleteVideoAttempt
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	userID := middleware.UserID(c)
	m, err := h.service.CompleteAttempt(c.Request.Context(), userID, id, attemptID, req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	common.OK(c, "attempt completed", m)
}
