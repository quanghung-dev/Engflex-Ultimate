// Package conversations wires the conversation lifecycle module.
package conversations

import (
	"net/http"

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
	turns := repositories.NewConversationTurnRepository(db)
	feedbacks := repositories.NewFeedbackRepository(db)
	voice := services.NewHTTPVoiceClient(cfg)
	svc := services.NewConversationService(repo, turns, voice, cfg.MaxDurationSec, feedbacks,
		repositories.NewScenarioRepository(db), repositories.NewPersonaRepository(db))
	ctl := controllers.NewConversationController(svc, cfg.MaxDurationSec)

	g := rg.Group("/conversations")
	g.POST("", middleware.RequireAuth(), ctl.Create)
	g.GET("/:id", middleware.RequireAuth(), ctl.Get)
	g.POST("/:id/start", middleware.RequireAuth(), ctl.Start)
	g.POST("/:id/offer", middleware.RequireAuth(), ctl.Offer)
	g.PATCH("/:id/offer", middleware.RequireAuth(), ctl.Offer)
	g.POST("/:id/end", middleware.RequireAuth(), ctl.End)
	g.POST("/:id/turns/:position/analyze", middleware.RequireAuth(), ctl.AnalyzeTurn)
	// One command for the correction modal: the engine owns the reviewed turn.
	// Retake audio uploads here; gin buffers the multipart file in memory, so
	// the controller caps the declared size and the service re-checks the
	// actual bytes before proxying.
	g.POST("/:id/transcript", middleware.RequireAuth(), ctl.Transcript)
	g.POST("/:id/transcribe", middleware.RequireAuth(), ctl.Transcribe)
	g.POST("/:id/pronounce", middleware.RequireAuth(), ctl.Pronounce)

	cb := controllers.NewVoiceCallbackController(svc)
	tcb := controllers.NewTurnCallbackController(svc)
	internal := rg.Group("/internal/conversations", middleware.RequireInternalSecret(cfg.InternalSecret))
	internal.POST("/:id/finalize", cb.Finalize)
	// A text-only batch is small; this is a guard against a malformed or
	// hostile request buffering itself into memory.
	const maxTurnsBatchBytes = 4 << 20
	internal.POST("/:id/turns", maxBodyBytes(maxTurnsBatchBytes), tcb.IngestTurns)
}

// maxBodyBytes rejects an oversized batch before it is buffered, so a bad
// request cannot exhaust memory.
func maxBodyBytes(limit int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, limit)
		c.Next()
	}
}
