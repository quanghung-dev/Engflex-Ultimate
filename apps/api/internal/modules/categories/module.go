package categories

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/categories/controllers"
	"engflex-api/internal/modules/categories/services"
)

func RegisterRoutes(rg *gin.RouterGroup, repo repositories.CategoryRepository) {
	svc := services.NewCategoryService(repo)
	ctl := controllers.NewCategoryController(svc)

	g := rg.Group("/categories")
	{
		g.GET("", ctl.List)
		g.GET("/:id", ctl.GetByID)
		g.POST("", ctl.Create)
		g.PUT("/:id", ctl.Update)
		g.DELETE("/:id", ctl.Delete)
	}
}
