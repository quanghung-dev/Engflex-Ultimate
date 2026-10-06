package controllers

import (
	"engflex-api/internal/common"
	"engflex-api/internal/modules/users/dtos/requests"
	"engflex-api/internal/modules/users/dtos/responses"
	"engflex-api/internal/modules/users/services"
	"engflex-api/internal/utils"

	"github.com/gin-gonic/gin"
)

type UserController struct {
	service services.UserService
}

func NewUserController(service services.UserService) *UserController {
	return &UserController{service: service}
}

// GetByID godoc
//
//	@Summary		Get user by ID
//	@Description	Retrieve details of a user by their ID
//	@Tags			Users
//	@Produce		json
//	@Param			id	path		string											true	"User ID"
//	@Success		200	{object}	common.ApiResponse{data=responses.UserResponse}	"User found"
//	@Failure		400	{object}	common.ApiResponse								"Invalid ID"
//	@Failure		404	{object}	common.ApiResponse								"User not found"
//	@Failure		500	{object}	common.ApiResponse								"Internal server error"
//	@Router			/users/{id} [get]
func (h *UserController) GetByID(c *gin.Context) {
	id := c.Param("id")
	user, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.UserResponse
	_ = utils.Map(&dto, user)
	common.OK(c, "user found", dto)
}

// UpSert godoc
//
//	@Summary		Upsert user
//	@Description	Create or update a user profile
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			request	body		requests.UpsertUser								true	"User payload"
//	@Success		200		{object}	common.ApiResponse{data=responses.UserResponse}	"User upserted successfully"
//	@Failure		400		{object}	common.ApiResponse								"Invalid request body"
//	@Failure		500		{object}	common.ApiResponse								"Internal server error"
//	@Router			/users [post]
func (h *UserController) UpSert(c *gin.Context) {
	var req requests.UpsertUser
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	user, err := h.service.UpSert(c.Request.Context(), req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.UserResponse
	_ = utils.Map(&dto, user)
	common.OK(c, "user upserted", dto)
}
