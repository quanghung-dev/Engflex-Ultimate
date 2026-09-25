package controllers

import (
	"io"

	"github.com/gin-gonic/gin"

	"engflex-api/internal/common"
	"engflex-api/internal/modules/conversations/dtos/requests"
	"engflex-api/internal/modules/conversations/dtos/responses"
	"engflex-api/internal/modules/conversations/services"
	"engflex-api/internal/server/middleware"
	"engflex-api/internal/utils"
)

// ConversationController exposes the conversation lifecycle over HTTP.
type ConversationController struct {
	service     *services.ConversationService
	maxDuration int
}

// NewConversationController wires the controller to the service.
func NewConversationController(service *services.ConversationService, maxDuration int) *ConversationController {
	return &ConversationController{service: service, maxDuration: maxDuration}
}

// Create godoc
// @Summary      Start a conversation
// @Tags         conversations
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        body body requests.StartConversation true "conversation to start"
// @Success      201 {object} common.ApiResponse{data=responses.Conversation}
// @Failure      400 {object} common.ApiResponse
// @Failure      401 {object} common.ApiResponse
// @Router       /conversations [post]
func (h *ConversationController) Create(c *gin.Context) {
	var req requests.StartConversation
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	userID := middleware.UserID(c)
	m, err := h.service.Create(c.Request.Context(), userID, req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.Conversation
	_ = utils.Map(&dto, m)
	dto.Turns = []responses.Turn{}
	common.Created(c, "conversation created", dto)
}

// Get godoc
// @Summary      Get a conversation
// @Tags         conversations
// @Security     BearerAuth
// @Produce      json
// @Param        id path string true "conversation id"
// @Success      200 {object} common.ApiResponse{data=responses.Conversation}
// @Failure      404 {object} common.ApiResponse
// @Router       /conversations/{id} [get]
func (h *ConversationController) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	m, err := h.service.Get(c.Request.Context(), userID, c.Param("id"))
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.Conversation
	_ = utils.Map(&dto, m)
	dto.Turns = []responses.Turn{}
	common.OK(c, "conversation", dto)
}

// Start godoc
// @Summary      Provision the voice session
// @Tags         conversations
// @Security     BearerAuth
// @Produce      json
// @Param        id path string true "conversation id"
// @Success      200 {object} common.ApiResponse{data=responses.ConversationSession}
// @Failure      409 {object} common.ApiResponse
// @Failure      503 {object} common.ApiResponse
// @Router       /conversations/{id}/start [post]
func (h *ConversationController) Start(c *gin.Context) {
	userID := middleware.UserID(c)
	conv, ice, err := h.service.Start(c.Request.Context(), userID, c.Param("id"))
	if err != nil {
		common.Fail(c, err)
		return
	}
	common.OK(c, "session ready", responses.ConversationSession{
		SessionID:   conv.ID,
		IceConfig:   ice,
		MaxDuration: h.maxDuration,
	})
}

// Offer godoc
// @Summary      Proxy an SDP offer or ICE candidates to the voice engine
// @Tags         conversations
// @Security     BearerAuth
// @Accept       json
// @Param        id path string true "conversation id"
// @Success      200 {string} string "raw engine response"
// @Failure      409 {object} common.ApiResponse
// @Failure      503 {object} common.ApiResponse
// @Router       /conversations/{id}/offer [post]
// @Router       /conversations/{id}/offer [patch]
func (h *ConversationController) Offer(c *gin.Context) {
	userID := middleware.UserID(c)
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		common.Fail(c, common.BadRequest("unreadable request body"))
		return
	}
	respBody, status, err := h.service.Offer(c.Request.Context(), userID, c.Param("id"), c.Request.Method, body)
	if err != nil {
		common.Fail(c, err)
		return
	}
	c.Data(status, "application/json", respBody)
}

// End godoc
// @Summary      End a conversation
// @Tags         conversations
// @Security     BearerAuth
// @Produce      json
// @Param        id path string true "conversation id"
// @Success      200 {object} common.ApiResponse{data=responses.Conversation}
// @Router       /conversations/{id}/end [post]
func (h *ConversationController) End(c *gin.Context) {
	userID := middleware.UserID(c)
	m, err := h.service.End(c.Request.Context(), userID, c.Param("id"))
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.Conversation
	_ = utils.Map(&dto, m)
	dto.Turns = []responses.Turn{}
	common.OK(c, "conversation ended", dto)
}
