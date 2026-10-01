package controllers

import (
	"engflex-api/internal/common"
	"engflex-api/internal/modules/categories/dtos/requests"
	"engflex-api/internal/modules/categories/dtos/responses"
	"engflex-api/internal/modules/categories/services"
	"engflex-api/internal/utils"

	"github.com/gin-gonic/gin"
)

type CategoryController struct {
	service services.CategoryService
}

func NewCategoryController(service services.CategoryService) *CategoryController {
	return &CategoryController{service: service}
}

// Create godoc
//
//	@Summary		Create category
//	@Description	Create a new category with the specified name
//	@Tags			Categories
//	@Accept			json
//	@Produce		json
//	@Param			request	body		requests.CreateCategory								true	"Category payload"
//	@Success		201		{object}	common.ApiResponse{data=responses.CategoryResponse}	"Category created successfully"
//	@Failure		400		{object}	common.ApiResponse									"Invalid request body"
//	@Failure		409		{object}	common.ApiResponse									"Category name already exists"
//	@Failure		500		{object}	common.ApiResponse									"Internal server error"
//	@Router			/categories [post]
func (h *CategoryController) Create(c *gin.Context) {
	var req requests.CreateCategory
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	m, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.CategoryResponse
	_ = utils.Map(&dto, m)
	common.Created(c, "category created", dto)
}

// Update godoc
//
//	@Summary		Update category
//	@Description	Update an existing category's name by its ID
//	@Tags			Categories
//	@Accept			json
//	@Produce		json
//	@Param			id		path		string												true	"Category ID"
//	@Param			request	body		requests.UpdateCategory								true	"Category payload"
//	@Success		200		{object}	common.ApiResponse{data=responses.CategoryResponse}	"Category updated successfully"
//	@Failure		400		{object}	common.ApiResponse									"Invalid ID or payload"
//	@Failure		404		{object}	common.ApiResponse									"Category not found"
//	@Failure		409		{object}	common.ApiResponse									"Category name already exists"
//	@Failure		500		{object}	common.ApiResponse									"Internal server error"
//	@Router			/categories/{id} [put]
func (h *CategoryController) Update(c *gin.Context) {
	var req requests.UpdateCategory
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}
	m, err := h.service.Update(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.CategoryResponse
	_ = utils.Map(&dto, m)
	common.OK(c, "category updated", dto)
}

// Delete godoc
//
//	@Summary		Delete category
//	@Description	Delete a category by its ID
//	@Tags			Categories
//	@Produce		json
//	@Param			id	path		string				true	"Category ID"
//	@Success		200	{object}	common.ApiResponse	"Category deleted successfully"
//	@Failure		400	{object}	common.ApiResponse	"Invalid ID"
//	@Failure		404	{object}	common.ApiResponse	"Category not found"
//	@Failure		500	{object}	common.ApiResponse	"Internal server error"
//	@Router			/categories/{id} [delete]
func (h *CategoryController) Delete(c *gin.Context) {
	id := c.Param("id")
	err := h.service.Delete(c.Request.Context(), id)
	if err != nil {
		common.Fail(c, err)
		return
	}
	common.OK(c, "category deleted successfully", nil)
}

// GetByID godoc
//
//	@Summary		Get category by ID
//	@Description	Retrieve details of a category by its ID
//	@Tags			Categories
//	@Produce		json
//	@Param			id	path		string												true	"Category ID"
//	@Success		200	{object}	common.ApiResponse{data=responses.CategoryResponse}	"Category retrieved successfully"
//	@Failure		400	{object}	common.ApiResponse									"Invalid ID"
//	@Failure		404	{object}	common.ApiResponse									"Category not found"
//	@Failure		500	{object}	common.ApiResponse									"Internal server error"
//	@Router			/categories/{id} [get]
func (h *CategoryController) GetByID(c *gin.Context) {
	id := c.Param("id")
	m, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dto responses.CategoryResponse
	_ = utils.Map(&dto, m)
	common.OK(c, "category found", dto)
}

// List godoc
//
//	@Summary		List categories
//	@Description	Get paginated list of categories
//	@Tags			Categories
//	@Produce		json
//	@Param			page		query		int													false	"Page number (1-based)"	default(1)
//	@Param			pageSize	query		int													false	"Page size"				default(20)
//	@Success		200			{object}	common.ApiResponse{data=[]responses.CategoryResponse}	"Categories retrieved successfully"
//	@Failure		500			{object}	common.ApiResponse									"Internal server error"
//	@Router			/categories [get]
func (h *CategoryController) List(c *gin.Context) {
	page, pageSize := utils.ParsePagination(c)
	offset := utils.Offset(page, pageSize)
	categories, total, err := h.service.List(c.Request.Context(), pageSize, offset)
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dtos []responses.CategoryResponse
	_ = utils.MapSlice(&dtos, categories)
	common.Paginated(c, "categories retrieved", dtos, page, pageSize, total)
}
