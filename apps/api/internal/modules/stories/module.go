package stories

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/stories/controllers"
	"engflex-api/internal/modules/stories/services"
	"engflex-api/internal/server/middleware"
)

// RegisterRoutes mounts the stories endpoints under /api/v1.
func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	repo := repositories.NewStoryRepository(db)
	svc := services.NewStoryService(repo)
	ctl := controllers.NewStoryController(svc)

	g := rg.Group("/stories")
	g.GET("", middleware.RequireAuth(), ctl.List)
	g.GET("/:id", middleware.RequireAuth(), ctl.GetByID)
	g.GET("/by-slug/:slug", middleware.RequireAuth(), ctl.GetBySlug)
}
