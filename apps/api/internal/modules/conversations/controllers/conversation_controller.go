package controllers

import (
	"encoding/json"
	"io"
	"strconv"

	"github.com/gin-gonic/gin"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
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
	m, turns, feedbacks, err := h.service.GetWithFeedback(c.Request.Context(), userID, c.Param("id"))
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.Conversation
	_ = utils.Map(&dto, m)
	dto.Turns = attachFeedback(turns, feedbacks)
	common.OK(c, "conversation", dto)
}

// attachFeedback maps turns into wire DTOs and joins each feedback row onto
// its turn by subject id. Turns without feedback keep a nil Feedback.
func attachFeedback(turns []*models.ConversationTurn, feedbacks []*models.Feedback) []responses.Turn {
	bySubject := make(map[string]responses.TurnFeedback, len(feedbacks))
	for _, fb := range feedbacks {
		var tf responses.TurnFeedback
		if err := json.Unmarshal(fb.Payload, &tf); err != nil {
			// A stored payload is always valid (NormalizeLanguageFeedback
			// validated it on write); skip rather than fail the whole read.
			continue
		}
		bySubject[fb.SubjectID] = tf
	}
	var dtos []responses.Turn
	_ = utils.MapSlice(&dtos, turns)
	for i := range dtos {
		if tf, ok := bySubject[turns[i].ID]; ok {
			tf := tf
			dtos[i].Feedback = &tf
		}
	}
	return dtos
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

// AnalyzeTurn godoc
// @Summary      Analyze one learner turn by position
// @Tags         conversations
// @Security     BearerAuth
// @Produce      json
// @Param        id path string true "conversation id"
// @Param        position path int true "turn position (1-based)"
// @Success      200 {object} common.ApiResponse{data=responses.TurnFeedback}
// @Failure      400 {object} common.ApiResponse
// @Failure      404 {object} common.ApiResponse
// @Failure      503 {object} common.ApiResponse
// @Router       /conversations/{id}/turns/{position}/analyze [post]
func (h *ConversationController) AnalyzeTurn(c *gin.Context) {
	userID := middleware.UserID(c)
	position, err := strconv.Atoi(c.Param("position"))
	if err != nil || position < 1 {
		common.Fail(c, common.BadRequest("invalid position"))
		return
	}
	feedback, err := h.service.AnalyzeTurn(c.Request.Context(), userID, c.Param("id"), position)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.TurnFeedback
	_ = json.Unmarshal(feedback.Payload, &dto)
	common.OK(c, "turn analyzed", dto)
}

// Transcript applies one learner-initiated correction command. The engine owns
// the window and resolves which turn is corrected; Go only proves the
// conversation is the caller's and forwards.
//
// @Summary      Apply a transcript correction command
// @Description  One endpoint for the correction modal's four actions (review, retake, send, dismiss). The engine owns the window state.
// @Tags         conversations
// @Accept       json
// @Produce      json
// @Param        id path string true "conversation id"
// @Param        body body responses.TranscriptCommand true "command"
// @Success      200 {object} common.ApiResponse{data=responses.TranscriptResult}
// @Failure      400 {object} common.ApiResponse
// @Failure      404 {object} common.ApiResponse
// @Failure      409 {object} common.ApiResponse
// @Failure      422 {object} common.ApiResponse
// @Failure      503 {object} common.ApiResponse
// @Router       /conversations/{id}/transcript [post]
func (h *ConversationController) Transcript(c *gin.Context) {
	var req responses.TranscriptCommand
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest("invalid request body"))
		return
	}
	result, err := h.service.Transcript(c.Request.Context(), middleware.UserID(c), c.Param("id"), req.Action, req.Text)
	if err != nil {
		common.Fail(c, err)
		return
	}
	common.OK(c, "transcript command applied", result)
}
