// Package conversations wires the conversation lifecycle module.
package conversations

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"engflex-api/config"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/conversations/controllers"
	"engflex-api/internal/modules/conversations/services"
	"engflex-api/internal/server/middleware"
)

// RegisterRoutes mounts the conversation endpoints under /api/v1.
func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB, cfg config.VoiceConfig) {
	repo := repositories.NewConversationRepository(db)
	voice := services.NewHTTPVoiceClient(cfg)
	svc := services.NewConversationService(repo, voice, cfg.MaxDurationSec)
	ctl := controllers.NewConversationController(svc, cfg.MaxDurationSec)

	g := rg.Group("/conversations")
	g.POST("", middleware.RequireAuth(), ctl.Create)
	g.GET("/:id", middleware.RequireAuth(), ctl.Get)
	g.POST("/:id/start", middleware.RequireAuth(), ctl.Start)
	g.POST("/:id/offer", middleware.RequireAuth(), ctl.Offer)
	g.PATCH("/:id/offer", middleware.RequireAuth(), ctl.Offer)
	g.POST("/:id/end", middleware.RequireAuth(), ctl.End)

	cb := controllers.NewVoiceCallbackController(svc)
	internal := rg.Group("/internal/conversations", middleware.RequireInternalSecret(cfg.InternalSecret))
	internal.POST("/:id/finalize", cb.Finalize)
}
