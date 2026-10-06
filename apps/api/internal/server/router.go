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
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/modules/categories"
	"engflex-api/internal/modules/lessons"
	"engflex-api/internal/modules/transcripts"
	"engflex-api/internal/modules/users"
	"engflex-api/internal/server/middleware"
)

func NewRouter(db *gorm.DB, corsCfg config.CorsConfig) *gin.Engine {
	r := gin.New()
	r.Use(middleware.RequestID(), middleware.RequestLogger(), middleware.Recovery())
	r.Use(cors.New(cors.Config{
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
	_ = corsCfg

	categories.RegisterRoutes(v1, repositories.NewCategoryRepository(db))
	lessons.RegisterRoutes(v1, repositories.NewLessonRepository(db))
	transcripts.RegisterRoutes(v1, repositories.NewTranscriptRepository(db))
	users.RegisterRoutes(v1, repositories.NewUserRepository(db))
	return r
}
