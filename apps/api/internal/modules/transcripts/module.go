package transcripts

import (
	"github.com/gin-gonic/gin"

	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/transcripts/controllers"
	"engflex-api/internal/modules/transcripts/services"
)

func RegisterRoutes(rg *gin.RouterGroup, repo repositories.TranscriptRepository) {
	svc := services.NewTranscriptService(repo)
	ctl := controllers.NewTranscriptController(svc)

	g := rg.Group("/transcripts")
	{
		g.GET("", ctl.List)
		g.GET("/:id", ctl.GetByID)
		g.GET("/lesson/:lesson_id", ctl.GetByLessonID)
		g.POST("", ctl.Create)
		g.PUT("/:id", ctl.Update)
		g.DELETE("/:id", ctl.Delete)
	}
}
