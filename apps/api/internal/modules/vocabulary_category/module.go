package vocabularycategory

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/vocabulary_category/controllers"
	"engflex-api/internal/modules/vocabulary_category/services"
	"engflex-api/internal/server/middleware"
)

func RegisterRoutes(rg *gin.RouterGroup, repo repositories.VocabularyCategoryRepository) {
	svc := services.NewVocabularyCategoryService(repo)
	ctl := controllers.NewVocabularyCategoryController(svc)

	g := rg.Group("/vocabulary-categories")
	{
		g.GET("", middleware.RequireAuth(), ctl.List)
		g.GET("/:id", middleware.RequireAuth(), ctl.GetByID)
		g.POST("", middleware.RequireAuth(), ctl.Create)
		g.PUT("/:id", middleware.RequireAuth(), ctl.Update)
		g.DELETE("/:id", middleware.RequireAuth(), ctl.Delete)
	}
}
