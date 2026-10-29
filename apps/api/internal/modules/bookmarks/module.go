package bookmarks

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/bookmarks/controllers"
	"engflex-api/internal/modules/bookmarks/services"
	"engflex-api/internal/server/middleware"
)

// RegisterRoutes mounts the bookmarks endpoints under /api/v1.
func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	repo := repositories.NewBookmarkRepository(db)
	svc := services.NewBookmarkService(repo)
	ctl := controllers.NewBookmarkController(svc)

	g := rg.Group("/bookmarks")
	g.GET("", middleware.RequireAuth(), ctl.List)
	g.POST("", middleware.RequireAuth(), ctl.Save)
	g.DELETE("/:contentType/:contentId", middleware.RequireAuth(), ctl.Unsave)
}
