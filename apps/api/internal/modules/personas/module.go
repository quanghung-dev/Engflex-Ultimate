// Package personas wires the personas module.
package personas

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/personas/controllers"
	"engflex-api/internal/modules/personas/services"
	"engflex-api/internal/server/middleware"
)

// RegisterRoutes mounts the endpoints under /api/v1.
func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	svc := services.NewPersonaService(repositories.NewPersonaRepository(db))
	ctl := controllers.NewPersonaController(svc)

	g := rg.Group("/personas")
	g.GET("", middleware.RequireAuth(), ctl.List)
}
