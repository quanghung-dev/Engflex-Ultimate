package server

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"

	"engflex-api/config"
	_ "engflex-api/docs"
	"engflex-api/internal/modules/conversations"
	"engflex-api/internal/server/middleware"
)

// NewRouter builds the Gin engine with shared middleware and module routes.
// Add domain modules here as they are implemented:
// profiles.RegisterRoutes(v1, db), contents.RegisterRoutes(v1, db), ...
func NewRouter(db *gorm.DB, cfg config.Config) *gin.Engine {
	r := gin.New()
	r.Use(middleware.RequestID(), middleware.RequestLogger(), middleware.Recovery())
	r.Use(cors.New(cors.Config{
		// Dev: allow all origins. For production, switch to
		// AllowOrigins: cfg.Cors.AllowedOrigins (and re-enable
		// AllowCredentials, which browsers reject with a wildcard).
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:   []string{"Content-Length"},
		MaxAge:          12 * time.Hour,
	}))

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := r.Group("/api/v1")
	conversations.RegisterRoutes(v1, db, cfg.Voice)
	// TODO: register remaining engflex modules, e.g.
	// profiles.RegisterRoutes(v1, repositories.NewProfileRepository(db))
	// contents.RegisterRoutes(v1, repositories.NewContentRepository(db))
	// attempts.RegisterRoutes(v1, repositories.NewAttemptRepository(db))

	return r
}
