package vocabularycategory

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/vocabulary_category/controllers"
	"engflex-api/internal/modules/vocabulary_category/services"
)

func RegisterRoutes(rg *gin.RouterGroup, repo repositories.VocabularyCategoryRepository) {
	svc := services.NewVocabularyCategoryService(repo)
	ctl := controllers.NewVocabularyCategoryController(svc)

	g := rg.Group("/vocabulary-categories")
	{
		g.GET("", ctl.List)
		g.GET("/:id", ctl.GetByID)
		g.POST("", ctl.Create)
		g.PUT("/:id", ctl.Update)
		g.DELETE("/:id", ctl.Delete)
	}
}
