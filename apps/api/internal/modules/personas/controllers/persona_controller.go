package controllers

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/common"
	"engflex-api/internal/modules/personas/dtos/requests"
	"engflex-api/internal/modules/personas/dtos/responses"
	"engflex-api/internal/modules/personas/services"
	"engflex-api/internal/utils"
)

// PersonaController exposes the persona catalog over HTTP.
type PersonaController struct {
	service *services.PersonaService
}

// NewPersonaController wires the controller to the service.
func NewPersonaController(service *services.PersonaService) *PersonaController {
	return &PersonaController{service: service}
}

// List godoc
// @Summary      List personas
// @Tags         personas
// @Security     BearerAuth
// @Produce      json
// @Param        page query int false "page"
// @Param        pageSize query int false "page size"
// @Success      200 {object} common.ApiResponse{data=[]responses.Persona}
// @Router       /personas [get]
func (h *PersonaController) List(c *gin.Context) {
	page, pageSize := utils.ParsePagination(c)
	items, total, err := h.service.List(c.Request.Context(), requests.ListPersonas{
		ListParams: common.ListParams{Page: page, PageSize: pageSize},
	})
	if err != nil {
		common.Fail(c, err)
		return
	}
	var dtos []responses.Persona
	_ = utils.MapSlice(&dtos, items)
	common.Paginated(c, "personas", dtos, page, pageSize, total)
}
