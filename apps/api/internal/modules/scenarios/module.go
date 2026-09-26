// Package scenarios wires the scenarios module.
package scenarios

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/scenarios/controllers"
	"engflex-api/internal/modules/scenarios/services"
	"engflex-api/internal/server/middleware"
)

// RegisterRoutes mounts the endpoints under /api/v1.
func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	svc := services.NewScenarioService(repositories.NewScenarioRepository(db))
	ctl := controllers.NewScenarioController(svc)

	g := rg.Group("/scenarios")
	g.GET("", middleware.RequireAuth(), ctl.List)
	g.POST("", middleware.RequireAuth(), ctl.Create)
}
