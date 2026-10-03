package lessons

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/lessons/controllers"
	"engflex-api/internal/modules/lessons/services"
)

func RegisterRoutes(rg *gin.RouterGroup, repo repositories.LessonRepository) {
	svc := services.NewLessonService(repo)
	ctl := controllers.NewLessonController(svc)

	g := rg.Group("/lessons")
	{
		g.GET("", ctl.List)
		g.GET("/:id", ctl.GetByID)
		g.POST("", ctl.Create)
		g.PUT("/:id", ctl.Update)
		g.DELETE("/:id", ctl.Delete)
	}
}
