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
	"engflex-api/internal/modules/personas"
	"engflex-api/internal/modules/scenarios"
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

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	// gin-swagger gates every request on a regexp that only accepts an
	// allowlist of asset names (index.html, doc.json, the swagger-ui bundles),
	// so a bare /swagger or /swagger/ is refused from *inside* the handler —
	// gin's own trailing-slash redirect lands straight on that 404. Route both
	// bare forms to the UI entry point so the URL people type works.
	swaggerIndex := func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
	}
	// PersistAuthorization keeps whatever token is pasted into the Authorize
	// dialog in localStorage, so the long-lived SWAGGER_TESTING_JWT (or any
	// freshly minted session token) is entered once instead of on every
	// reload. The doc JSON is unaffected — this is UI state only.
	swaggerAssets := ginSwagger.WrapHandler(swaggerFiles.Handler,
		ginSwagger.PersistAuthorization(true))
	r.GET("/swagger", swaggerIndex)
	r.GET("/swagger/*any", func(c *gin.Context) {
		// The catch-all also matches the bare directory, so screen it here:
		// gin cannot route /swagger/ separately (it panics on the conflict
		// with *any), and c.Param("any") is "/" rather than "" for it.
		if c.Request.URL.Path == "/swagger/" {
			swaggerIndex(c)
			return
		}
		swaggerAssets(c)
	})

	v1 := r.Group("/api/v1")
	conversations.RegisterRoutes(v1, db, cfg.Voice)
	personas.RegisterRoutes(v1, db)
	scenarios.RegisterRoutes(v1, db)
	// TODO: register remaining engflex modules, e.g.
	// profiles.RegisterRoutes(v1, repositories.NewProfileRepository(db))
	// contents.RegisterRoutes(v1, repositories.NewContentRepository(db))
	// attempts.RegisterRoutes(v1, repositories.NewAttemptRepository(db))

	return r
}
